export class AuthView {
  constructor(presenter, outlet){ this.presenter = presenter; this.outlet = outlet; }

  render(isLoggedIn=false){
    if (isLoggedIn){
      const tokenPreview = (localStorage.getItem('AUTH_TOKEN') || '').slice(0, 12) + '…';
      this.outlet.innerHTML = `
        <section class="card">
          <h1>Akun</h1>
          <h2 class="sr-only">Status</h2>
          <p>Sudah login. Token: <code>${tokenPreview}</code></p>
          <button id="logout">Keluar</button>
          <div id="status" class="alert" role="status" aria-live="polite"></div>
        </section>`;
      this.outlet.querySelector('#logout').addEventListener('click', () => this.presenter.doLogout());
      return;
    }

    this.outlet.innerHTML = `
      <section class="grid grid-2">
        <h1 class="full">Halaman Akun</h1>

        <form id="login" class="card">
          <h2>Masuk</h2>
          <label for="lemail">Email</label><input id="lemail" type="email" required />
          <label for="lpass">Kata sandi</label><input id="lpass" type="password" required />
          <button type="submit">Masuk</button>
        </form>

        <form id="reg" class="card">
          <h2>Daftar</h2>
          <label for="rname">Nama</label><input id="rname" required />
          <label for="remail">Email</label><input id="remail" type="email" required />
          <label for="rpass">Kata sandi (≥8)</label><input id="rpass" type="password" minlength="8" required />
          <button type="submit">Daftar</button>
        </form>

        <div style="grid-column:1/-1"><div id="status" class="alert" role="status" aria-live="polite"></div></div>
      </section>`;

    this.outlet.querySelector('#login').addEventListener('submit', (e)=>{
      e.preventDefault();
      this.presenter.doLogin(
        this.outlet.querySelector('#lemail').value,
        this.outlet.querySelector('#lpass').value
      );
    });
    this.outlet.querySelector('#reg').addEventListener('submit', (e)=>{
      e.preventDefault();
      this.presenter.doRegister(
        this.outlet.querySelector('#rname').value,
        this.outlet.querySelector('#remail').value,
        this.outlet.querySelector('#rpass').value
      );
    });
  }

  showStatus(msg, isErr=false){
    const box = this.outlet.querySelector('#status');
    if (!box) return;
    box.className = 'alert ' + (isErr ? 'err' : 'ok');
    box.textContent = msg;
  }
}
