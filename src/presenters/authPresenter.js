import { AuthView } from '../views/authView.js';
import { login, register, logout, getToken } from '../api.js';

export class AuthPresenter {
  constructor(outlet){ this.outlet = outlet; this.view = new AuthView(this, outlet); }
  render(){ this.view.render(!!getToken()); }

  async doLogin(email, password){
    try {
      await login({ email, password });
      window.dispatchEvent(new CustomEvent('auth:changed', { detail:{ loggedIn:true } }));
      this.view.showStatus('Login berhasil', false);
      this.render();
    } catch (e) { this.view.showStatus(e.message || 'Login gagal', true); }
  }

  async doRegister(name, email, password){
    try { await register({ name, email, password }); this.view.showStatus('Registrasi berhasil. Silakan login.', false); }
    catch (e){ this.view.showStatus(e.message || 'Registrasi gagal', true); }
  }

  doLogout(){
    logout();
    window.dispatchEvent(new CustomEvent('auth:changed', { detail:{ loggedIn:false } }));
    this.view.showStatus('Logout berhasil', false);
    this.render();
  }
}
