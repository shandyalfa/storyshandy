import { listStories } from '../api.js';

export class DetailPresenter {
  constructor(outlet, id) {
    this.outlet = outlet;
    this.id = id;
  }

  async render() {
    this.outlet.innerHTML = `
      <section class="container">
        <h1>Detail Story</h1>
        <p>Memuat data...</p>
        <p><a href="#/home">Kembali</a></p>
      </section>
    `;

    try {
      const rows = await listStories();
      const story = rows.find((s) => s.id === this.id);

      if (!story) throw new Error('Story tidak ditemukan.');

      this.outlet.innerHTML = `
        <section class="container">
          <h1>${escapeHtml(story.title)}</h1>

          ${story.imageUrl ? `<img src="${story.imageUrl}" alt="Foto story: ${escapeHtml(story.title)}" style="max-width:100%; height:auto;" />` : ''}

          <p>${escapeHtml(story.description)}</p>

          ${(typeof story.lat === 'number' && typeof story.lng === 'number')
            ? `<p><strong>Lokasi:</strong> ${story.lat}, ${story.lng}</p>`
            : `<p><strong>Lokasi:</strong> (tidak tersedia)</p>`}

          <p><a href="#/home">← Kembali ke Beranda</a></p>
        </section>
      `;
    } catch (e) {
      this.outlet.innerHTML = `
        <section class="container">
          <h1>Detail Story</h1>
          <p role="alert">${escapeHtml(e.message)}</p>
          <p><a href="#/home">Kembali</a></p>
        </section>
      `;
    }
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
