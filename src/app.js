import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon, shadowUrl: shadow });

import { transitionTo } from './utils/transition.js';
import { Router } from './router.js';
import { initNav } from './views/nav.js';

import { StoryPresenter } from './presenters/storyPresenter.js';
import { AddPresenter } from './presenters/addPresenter.js';
import { AuthPresenter } from './presenters/authPresenter.js';
import { DetailPresenter } from './presenters/detailPresenter.js';
import { OfflinePresenter } from './presenters/offlinePresenter.js';
import { syncOutbox } from './models/offlineStore.js';



const outlet = document.querySelector('#main');

const routes = {
  '#/home':  new StoryPresenter(outlet),
  '#/add':   new AddPresenter(outlet),
  '#/login': new AuthPresenter(outlet),
  '#/offline': new OfflinePresenter(outlet),   // ✅ baru

  // Advanced: route detail untuk action notifikasi
  '#/story/*': (path) => {
    const id = path.replace('#/story/', '');
    return new DetailPresenter(outlet, id);
  },
};

const router = new Router(routes, '#/home', (render) => {
  transitionTo(outlet, render);
});

router.init();
initNav();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL; // "/storyshandy/"
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).then((reg) => {
      reg.update();
    });

  });
}

async function autoSync(){
  if (!navigator.onLine) return;
  try {
    const r = await syncOutbox();
    if (r.sent > 0) window.dispatchEvent(new CustomEvent('stories:changed'));
  } catch(_) {}
}
window.addEventListener('online', autoSync);
autoSync();
