import { makeDefaultIcon } from '../map/icon.js';
export class AddView {
  constructor(presenter, outlet){ this.presenter = presenter; this.outlet = outlet; this.map=null; this.clickMarker=null; this.stream=null; }

  render(){
    this.outlet.innerHTML = `
      <section class="grid grid-2">
        <h1 class="full">Tambah Data Baru</h1>

        <form id="f" class="card" novalidate aria-describedby="msg">
          <h2>Form Tambah Data</h2>
          <div id="msg" class="sr-only">Pesan status pengiriman.</div>

          <div class="form-row">
            <div><label for="title">Judul</label><input id="title" name="title" required /></div>
            <div><label for="category">Kategori</label>
              <select id="category" name="category" required>
                <option value="">Pilih...</option><option>cerita</option><option>jualan</option><option>film</option>
              </select>
            </div>
          </div>

          <label for="description">Deskripsi</label>
          <textarea id="description" name="description" rows="4" required></textarea>

          <div class="form-row">
            <div><label for="lat">Latitude</label><input id="lat" name="lat" inputmode="decimal" required readonly /></div>
            <div><label for="lng">Longitude</label><input id="lng" name="lng" inputmode="decimal" required readonly /></div>
          </div>

          <label for="image">Gambar</label>
          <input id="image" name="image" type="file" accept="image/*" />

          <div class="toolbar">
            <button type="button" id="useCam" aria-pressed="false">Gunakan Kamera</button>
            <button type="button" id="snap" disabled>Ambil Foto</button>
          </div>
          <video id="preview" class="card" style="display:none;width:100%;max-height:260px;" playsinline></video>
          <canvas id="canvas" class="sr-only" aria-hidden="true"></canvas>

          <div class="toolbar"><button type="submit">Kirim</button><button type="reset">Reset</button></div>
          <div id="status" class="alert" role="status" aria-live="polite"></div>
        </form>

        <div class="card">
          <h2>Peta Lokasi</h2>
          <div class="toolbar"><span class="badge">Klik di peta untuk memilih koordinat</span></div>
          <div id="map" class="map" role="application" aria-label="Peta untuk memilih lokasi"></div>
        </div>
      </section>`;

    // Validasi ringan
    const form = this.outlet.querySelector('#f');
    const MAX_IMAGE = 1024*1024;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const desc = this.outlet.querySelector('#description').value.trim();
      const lat  = this.outlet.querySelector('#lat').value.trim();
      const lng  = this.outlet.querySelector('#lng').value.trim();
      const file = this.outlet.querySelector('#image').files[0];
      if(!desc) return this.showError('Deskripsi wajib diisi.');
      if(!lat || !lng) return this.showError('Silakan klik peta untuk memilih koordinat.');
      if(file && file.size > MAX_IMAGE) return this.showError('Ukuran gambar maksimal 1MB.');
      this.presenter.submit(form);
    });
    form.addEventListener('reset', ()=> this.stopStream());
  // ambil elemen map dari outlet (bukan document global)
  const mapEl = this.outlet.querySelector('#map');

  // kalau render dipanggil ulang, bersihkan instance lama
  if (this.map) {
    this.map.off();
    this.map.remove();
    this.map = null;
  }
  this.clickMarker = null;

  // reset leaflet id kalau ada (jaga-jaga)
  if (mapEl && mapEl._leaflet_id) {
    mapEl._leaflet_id = null;
  }

  // Map
  import('leaflet').then(mod=>{
    const L = mod.default || mod;
    const icon = makeDefaultIcon(L);

    // ✅ pakai elemen, bukan string id
    this.map = L.map(mapEl, { center:[-2,117], zoom:4.5 });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(this.map);
    const hot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom:19 });
    L.control.layers({ OSM:osm, HOT:hot }).addTo(this.map);

    this.map.on('click', (e)=> this.setPoint({ lat:e.latlng.lat, lng:e.latlng.lng, icon }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos=>{
        const { latitude, longitude } = pos.coords;
        this.map.setView([latitude, longitude], 11);
        this.setPoint({ lat:latitude, lng:longitude, icon });
      });
    }
  });


    // Kamera
    const btnUseCam=this.outlet.querySelector('#useCam');
    const btnSnap=this.outlet.querySelector('#snap');
    const video=this.outlet.querySelector('#preview');
    const canvas=this.outlet.querySelector('#canvas');

    btnUseCam.addEventListener('click', async ()=>{
      if (this.stream){ this.stopStream(); btnUseCam.setAttribute('aria-pressed','false'); btnSnap.disabled=true; return; }
      try{
        this.stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
        video.srcObject=this.stream; video.style.display='block'; await video.play();
        btnUseCam.setAttribute('aria-pressed','true'); btnSnap.disabled=false;
      }catch(e){ this.showError('Tidak bisa akses kamera: '+e.message); }
    });

    btnSnap.addEventListener('click', ()=>{
      if(!this.stream) return;
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>{
        const file=new File([blob],'camera.jpg',{type:blob.type});
        const dt=new DataTransfer(); dt.items.add(file);
        this.outlet.querySelector('#image').files = dt.files;
        this.showSuccess('Foto dari kamera dilampirkan.');
        this.stopStream();
      }, 'image/jpeg', .9);
    });
  }

  setPoint({ lat, lng, icon }) {
    import('leaflet').then(mod => {
      const L = mod.default || mod;
      const useIcon = icon || makeDefaultIcon(L);

      if (this.clickMarker) this.clickMarker.remove();
      if (!this.map) return; // map sudah dibuang

      this.clickMarker = L.marker([lat, lng], { icon: useIcon })
        .addTo(this.map)
        .bindPopup('Lokasi dipilih').openPopup();

      const latEl = this.outlet.querySelector('#lat');
      const lngEl = this.outlet.querySelector('#lng');
      if (!latEl || !lngEl) return; // halaman sudah berubah / DOM sudah diganti

      latEl.value = lat.toFixed(6);
      lngEl.value = lng.toFixed(6);
    });
  }


  showSuccess(msg){ this.setStatus(msg,false); }
  showError(msg){ this.setStatus(msg,true); }
  setStatus(msg,isErr=false){
    const box=this.outlet.querySelector('#status');
    box.className='alert '+(isErr?'err':'ok'); box.textContent=msg;
  }
  stopStream(){
    if (this.stream){ this.stream.getTracks().forEach(t=>t.stop()); this.stream=null; }
    const v=this.outlet.querySelector('#preview'); if(v){ v.pause(); v.removeAttribute('srcObject'); v.style.display='none'; }
    this.outlet.querySelector('#snap').disabled = true;
  }
}
