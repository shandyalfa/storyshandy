import { getApiBase, setApiBase } from '../api.js';
import { makeDefaultIcon } from '../map/icon.js';

export class StoryView {
  constructor(presenter, outlet){ this.presenter = presenter; this.outlet = outlet; this.map = null; this.markers = []; }

  showSkeleton(){
    this.outlet.innerHTML = `
      <section class="grid grid-2">
        <div class="card"><div class="toolbar"><div class="badge">Memuat data...</div></div><div class="list" aria-busy="true"></div></div>
        <div class="card"><div id="map" class="map" role="application" aria-label="Peta lokasi"></div></div>
      </section>`;
  }

  render(items){
    this.outlet.innerHTML = `
      <section class="grid grid-2" id="storyHome">
        <h1 class="full">Beranda – Daftar Story</h1>

        <div class="card">
          <div class="toolbar">
            <label for="category" class="sr-only">Filter kategori</label>
            <select id="category" aria-label="Filter kategori">
              <option value="semua">Semua</option>
              <option>cerita</option>
              <option>jualan</option>
              <option>film</option>
            </select>
            <label for="apiBase" class="sr-only">API Base</label>
            <input id="apiBase" placeholder="API Base URL" value="${getApiBase()}" aria-label="Ubah API base">
            <button id="setApi">Set API</button>
          </div>

          <h2>Daftar Story</h2>
          <ul class="list" id="storyList" role="list" aria-describedby="listDesc"></ul>
          <p id="listDesc" class="sr-only">Daftar data dari API. Pilih item untuk fokus ke marker di peta.</p>
        </div>

        <div class="card">
          <h2>Peta Lokasi</h2>
          <div id="map" class="map" role="application" aria-label="Peta lokasi"></div>
        </div>
      </section>`;

    const list = this.outlet.querySelector('#storyList');
    const category = this.outlet.querySelector('#category');
    const apiField = this.outlet.querySelector('#apiBase');

    const imgSrc = (it) => {
      const u = it.imageUrl || it.image;
      if (!u) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%23121421"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,Segoe UI,Roboto" font-size="10" fill="%239aa3b2">no image</text></svg>';
      return u; // Dicoding photoUrl absolut
    };

    this.outlet.querySelector('#setApi').addEventListener('click', () => {
      setApiBase(apiField.value);
      alert('API Base disimpan. Muat ulang untuk menerapkan.');
    });

    const renderList = (rows) => {
      list.innerHTML = rows.map((it, idx) => `
        <li class="item" tabindex="0" data-idx="${idx}" aria-label="Item ${idx+1}: ${it.title}">
          <img src="${imgSrc(it)}" alt="${it.imageAlt || 'Gambar item'}" loading="lazy">
          <div>
            <div style="display:flex;gap:.5rem;align-items:center;">
              <strong>${it.title}</strong>
              <span class="badge">${it.category||'umum'}</span>
            </div>
            <p>${it.description}</p>
            <small class="muted">Lat: ${it.lat ?? '-'}, Lng: ${it.lng ?? '-'}</small>
            <button type="button" class="btn-save" data-id="${it.id}" aria-label="Simpan ${it.title} untuk offline">
              Simpan Offline
            </button>
          </div>
        </li>`).join('');
      Array.from(list.querySelectorAll('.item')).forEach((el, i) => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.btn-save')) return;
          this.focusMarker(i);
        });

        el.addEventListener('keydown', (e) => {
          if (e.target.closest('.btn-save')) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.focusMarker(i);
          }
        });

      });
    };
    renderList(items);
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-save');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      this.presenter.saveToOffline(btn.dataset.id);
    });


    category.addEventListener('change', () => {
      const filtered = this.presenter.getFiltered(category.value);
      renderList(filtered);
      this.loadMap(filtered, imgSrc);
    });

    this.loadMap(items, imgSrc);
  }

  showError(msg){ this.outlet.innerHTML = `<div class="card alert err" role="alert">${msg}</div>`; }

  loadMap(items, imgSrc){
    import('leaflet').then((mod) => {
      const L = mod.default || mod;
      if (this.map) { this.map.remove(); this.map = null; }

      this.map = L.map('map', { center: [-6.2, 106.8], zoom: 5, zoomSnap: .5, wheelPxPerZoomLevel: 60 });
      const osm  = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(this.map);
      const hot  = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',   { maxZoom: 19, attribution: '&copy; HOT OSM' });
      const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, attribution: '&copy; Carto' });
      L.control.layers({ OSM: osm, HOT: hot, Dark: dark }).addTo(this.map);

      const icon = makeDefaultIcon(L);
      this.markers = [];

      items.forEach((it, i) => {
        if (typeof it.lat === 'number' && typeof it.lng === 'number'){
          const m = L.marker([it.lat, it.lng], { icon })
            .addTo(this.map)
            .bindPopup(`
              <div style="display:flex;gap:8px;align-items:center;max-width:260px">
                <img src="${imgSrc(it)}" alt="" style="width:80px;height:60px;object-fit:cover;border-radius:6px;">
                <div><strong>${it.title}</strong><br>${it.description}</div>
              </div>`);
          m.on('click', () => this.highlightList(i));
          this.markers.push(m);
        } else {
          this.markers.push(null);
        }
      });

      const first = items.find(it => typeof it.lat === 'number' && typeof it.lng === 'number');
      if (first) this.map.setView([first.lat, first.lng], 7);
    });
  }

  focusMarker(i){
    const m = this.markers[i]; if (!m) return;
    m.openPopup(); this.map.setView(m.getLatLng(), 11);
    this.highlightList(i);
  }
  highlightList(i){
    const els = Array.from(this.outlet.querySelectorAll('#storyList .item'));
    els.forEach(el => el.style.outline = 'none');
    const el = els[i]; if (el) { el.style.outline = '3px solid var(--accent)'; el.scrollIntoView({ behavior:'smooth', block:'center' }); }
  }
}
