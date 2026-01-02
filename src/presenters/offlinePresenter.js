// src/presenters/offlinePresenter.js
import { OfflineView } from '../views/offlineView.js';
import {
  getSavedStories,
  deleteSavedStory,
  getOutbox,
  deleteOutbox,
  syncOutbox,
} from '../models/offlineStore.js';

export class OfflinePresenter {
  constructor(outlet) {
    this.outlet = outlet;
    this.view = new OfflineView(this, outlet);
    this.state = { q: '', sort: 'newest', syncing: false, status: '' };
    this._savedRaw = [];
    this._outboxRaw = [];
  }

  async render() {
    await this.refresh();
  }

  async refresh() {
    const [saved, outbox] = await Promise.all([getSavedStories(), getOutbox()]);
    this._savedRaw = saved || [];
    this._outboxRaw = outbox || [];
    this._render();
  }

  _render() {
    const saved = this._applyFilterSort(this._savedRaw);
    this.view.render({
      saved,
      outbox: this._outboxRaw,
      q: this.state.q,
      sort: this.state.sort,
      syncing: this.state.syncing,
      status: this.state.status,
    });
  }

  _applyFilterSort(rows) {
    const q = (this.state.q || '').trim().toLowerCase();
    let out = [...(rows || [])];

    if (q) {
      out = out.filter((it) =>
        `${it.title || ''} ${it.description || ''}`.toLowerCase().includes(q)
      );
    }

    if (this.state.sort === 'title') {
      out.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    } else if (this.state.sort === 'oldest') {
      out.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
    } else {
      out.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }

    return out;
  }

  setQuery(q) {
    this.state.q = q;
    this._render();
  }

  setSort(sort) {
    this.state.sort = sort;
    this._render();
  }

  async deleteSaved(id) {
    await deleteSavedStory(id);
    this.state.status = 'Story tersimpan dihapus.';
    await this.refresh();
  }

  async cancelOutbox(key) {
    await deleteOutbox(Number(key));
    this.state.status = 'Item outbox dibatalkan.';
    await this.refresh();
  }

  async syncNow() {
    // biar jelas kalau benar-benar kepanggil
    console.log('[syncNow] clicked', { online: navigator.onLine });

    if (this.state.syncing) return;

    this.state.syncing = true;
    this.state.status = navigator.onLine ? 'Memulai sync…' : 'Masih offline, tidak bisa sync.';
    this._render();

    if (!navigator.onLine) {
      this.state.syncing = false;
      this._render();
      return;
    }

    try {
      const res = await syncOutbox();
      this.state.status = `Sync selesai: ${res.sent}/${res.total} (gagal: ${res.failed || 0})`;
      await this.refresh();
      window.dispatchEvent(new CustomEvent('stories:changed'));
    } catch (e) {
      this.state.status = `Sync gagal: ${e.message || e}`;
      await this.refresh();
    } finally {
      this.state.syncing = false;
      this._render();
    }
  }
}
