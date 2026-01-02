// src/presenters/addPresenter.js
import { AddView } from '../views/addView.js';
import { createStory, getToken } from '../api.js';
import { require, validateLatLng } from '../utils/validation.js';
import { addOutbox } from '../models/offlineStore.js';


export class AddPresenter {
  constructor(outlet) {
    this.outlet = outlet;
    this.view = new AddView(this, outlet);
 }
async render() {
  const token = getToken?.() || localStorage.getItem('accessToken');
  if (!token) {
    this.outlet.innerHTML = `
      <section class="page">
        <div class="notice">
          Perlu login terlebih dahulu (401 Unauthorized). Buka menu “Masuk”, login, lalu refresh beranda.
        </div>
      </section>
    `;
    return;
  }
  this.view.render(); // cukup sekali
}

  async submit(form) {
    try {
      const token = getToken?.() || localStorage.getItem('accessToken');
      if (!token) throw new Error('Perlu login terlebih dahulu (401 Unauthorized). Buka menu “Masuk”, login, lalu refresh beranda.');

      const title = form.title.value;
      const description = form.description.value;
      const category = form.category.value;

      const imageFile = form.image.files[0];

      require(title, 'Judul'); require(description, 'Deskripsi'); require(category, 'Kategori');
      const lat = Number.parseFloat(form.lat.value);
      const lng = Number.parseFloat(form.lng.value);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Koordinat tidak valid.');
      }
      validateLatLng(lat, lng);

      // ✅ Advanced: kalau offline → masuk outbox
      if (!navigator.onLine) {
        const imageFile = form.image.files[0];
        if (!imageFile) {
          throw new Error('Gambar wajib diunggah untuk membuat story.');
        }

        await addOutbox({ title, category, description, lat, lng, imageFile });
        this.view.showSuccess('Kamu offline. Data masuk Outbox dan akan di-sync saat online.');
        form.reset();
        return;
      }

      const result = await createStory({ title, description, category, lat, lng, imageFile });
      this.view.showSuccess('Berhasil menambah data!');
      window.dispatchEvent(new CustomEvent('stories:changed'));
      form.reset();
      return result;

    } catch (e) {
      // kalau error network mendadak, juga masuk outbox
      if (!navigator.onLine || /Failed to fetch|NetworkError/i.test(String(e.message || ''))) {
        try {
          const title = form.title.value;
          const description = form.description.value;
          const category = form.category.value;
          const lat = parseFloat(form.lat.value);
          const lng = parseFloat(form.lng.value);
          const imageFile = form.image.files[0];
          await addOutbox({ title, category, description, lat, lng, imageFile });
          this.view.showSuccess('Koneksi bermasalah. Data masuk Outbox dan akan di-sync saat online.');
          form.reset();
          return;
        } catch(_) {}
      }
      this.view.showError(e.message || 'Gagal mengirim data.');
    }
  }

}
