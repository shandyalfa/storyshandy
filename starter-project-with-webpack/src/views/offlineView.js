// src/views/offlineView.js
export class OfflineView {
  constructor(presenter, outlet) {
    this.presenter = presenter;
    this.outlet = outlet;
  }

  render({ saved = [], outbox = [], q = '', sort = 'newest', syncing = false, status = '' }) {
    
    this.outlet.innerHTML = `
      <section class="page">
        <h1>Offline (IndexedDB)</h1>

        <div class="card">
          <h2>Story Tersimpan</h2>
          <div class="toolbar">
            <input id="q" placeholder="Cari judul/deskripsi..." value="${escapeHtml(q)}" aria-label="Cari story tersimpan">
            <select id="sort" aria-label="Urutkan story tersimpan">
              <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Terbaru</option>
              <option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>Terlama</option>
              <option value="title"  ${sort === 'title'  ? 'selected' : ''}>Judul</option>
            </select>
          </div>

          <ul class="list" id="savedList">
            ${saved.length ? saved.map(it => `
              <li class="item">
                <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start">
                  <div>
                    <strong>${escapeHtml(it.title || '(tanpa judul)')}</strong>
                    <p>${escapeHtml(it.description || '')}</p>
                    <small class="muted">${it.savedAt ? new Date(it.savedAt).toLocaleString() : ''}</small>
                  </div>
                  <button type="button" class="btn-del-saved" data-id="${escapeHtml(it.id)}">Hapus</button>
                </div>
              </li>
            `).join('') : `<li class="muted">Belum ada story disimpan.</li>`}
          </ul>
        </div>

        <div class="card">
          <h2>Outbox (antrian saat offline)</h2>

          <div class="toolbar">
            <button type="button" id="syncNow" ${syncing ? 'disabled' : ''}>
              ${syncing ? 'Sync...' : 'Sync sekarang'}
            </button>
            <span class="badge">${outbox.length} pending</span>
          </div>

          <div id="syncStatus" class="alert" role="status" aria-live="polite">${escapeHtml(status || '')}</div>

          <ul class="list" id="outboxList">
            ${outbox.length ? outbox.map(it => `
              <li class="item">
                <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start">
                  <div>
                    <strong>${escapeHtml(it.description?.slice(0, 40) || '(tanpa deskripsi)')}</strong>
                    <p class="muted">${escapeHtml(String(it.lat))}, ${escapeHtml(String(it.lng))}</p>
                    <small class="muted">${it.createdAt ? new Date(it.createdAt).toLocaleString() : ''}</small>
                    <div class="muted" style="margin-top:.25rem">
                          Foto: ${(it.imageFile || it.image?.blob) ? 'ada' : 'tidak ada'}

                    </div>
                  </div>
                  <button type="button" class="btn-cancel-outbox" data-key="${it.key}">Batalkan</button>
                </div>
              </li>
            `).join('') : `<li class="muted">Outbox kosong.</li>`}
          </ul>
        </div>
      </section>
    `;

    // binding yang tahan render: event delegation
    this.outlet.querySelector('#q')?.addEventListener('input', (e) => {
      this.presenter.setQuery(e.target.value);
    });

    this.outlet.querySelector('#sort')?.addEventListener('change', (e) => {
      this.presenter.setSort(e.target.value);
    });

    this.outlet.querySelector('#syncNow')?.addEventListener('click', () => {
      this.presenter.syncNow();
    });

    this.outlet.querySelector('#savedList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-del-saved');
      if (!btn) return;
      this.presenter.deleteSaved(btn.dataset.id);
    });

    this.outlet.querySelector('#outboxList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-cancel-outbox');
      if (!btn) return;
      this.presenter.cancelOutbox(btn.dataset.key);
    });
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
