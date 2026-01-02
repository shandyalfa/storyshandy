export class Router {
  constructor(routes, defaultRoute, onChange) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.onChange = onChange;
  }

  init() {
    window.addEventListener('hashchange', () => this._route());
    if (!location.hash) location.hash = this.defaultRoute;
    this._route();
  }

  _route() {
    const path = location.hash || this.defaultRoute;

    let target = this.routes[path];

    // dukung wildcard: "#/story/*"
    if (!target) {
      const keys = Object.keys(this.routes);
      const wildcardKey = keys.find((k) => k.endsWith('*') && path.startsWith(k.slice(0, -1)));
      if (wildcardKey) target = this.routes[wildcardKey];
    }

    if (!target) target = this.routes[this.defaultRoute];
    if (!target) return;

    // route bisa presenter atau function(path)->presenter
    const presenter = (typeof target === 'function') ? target(path) : target;
    if (!presenter) return;

    const render = () => presenter.render();
    this.onChange ? this.onChange(render) : render();
  }
}
