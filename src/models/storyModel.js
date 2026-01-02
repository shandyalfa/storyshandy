export class StoryModel {
  constructor() { this.items = []; }
  set(items) { this.items = items; }
  add(item) { this.items.unshift(item); }
  filterByCategory(cat){ return !cat || cat==='semua' ? this.items : this.items.filter(i => i.category === cat); }
}
