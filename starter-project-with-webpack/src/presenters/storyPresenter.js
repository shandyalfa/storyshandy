import { StoryView } from '../views/storyView.js';
import { StoryModel } from '../models/storyModel.js';
import { listStories } from '../api.js';
import { saveStory } from '../models/offlineStore.js';


export class StoryPresenter {
  constructor(outlet) {
    this.outlet = outlet;
    this.model = new StoryModel();
    this.view = new StoryView(this, outlet);
    this.abort = null;
    window.addEventListener('stories:changed', () => {
      if (location.hash === '#/home') this.render();
    });

  }
  async render() {
    this.view.showSkeleton();
    try {
      this.abort?.abort();
      const ctrl = new AbortController();
      this.abort = ctrl;
      const data = await listStories(ctrl.signal);
      this.model.set(data);
      this.view.render(this.model.items);
    } catch (e) {
      this.view.showError(e.message || 'Terjadi kesalahan.');
    }
  }
  async saveToOffline(id){
    const story = this.model.items.find(s => s.id === id);
    if (!story) return alert('Story tidak ditemukan.');
    await saveStory(story);
    alert('Tersimpan di Offline (IndexedDB).');
  }

  getFiltered(cat) { return this.model.filterByCategory(cat); }
}
