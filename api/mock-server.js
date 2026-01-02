import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let data = [
  { id: '1', title:'Warung Sate Pak Budi', description:'Jual sate ayam enak di pinggir kali.', category:'jualan', lat:-6.2146, lng:106.8451, imageUrl:'' },
  { id: '2', title:'Festival Film Kampus', description:'Nobar film pendek karya mahasiswa.', category:'film', lat:-7.7972, lng:110.3705, imageUrl:'' },
  { id: '3', title:'Cerita Gunung Bromo', description:'Pengalaman hiking subuh melihat sunrise.', category:'cerita', lat:-7.9425, lng:112.9530, imageUrl:'' },
];

app.get('/stories', (req, res) => {
  res.json(data);
});

app.post('/stories', upload.single('image'), (req, res) => {
  const { title, description, category, lat, lng } = req.body;
  if (!title || !description || !category || !lat || !lng) {
    return res.status(400).send('Field wajib tidak lengkap.');
  }
  let imageUrl = '';
  if (req.file) {
    const ext = path.extname(req.file.originalname || '.jpg') || '.jpg';
    const newPath = path.join(req.file.destination, req.file.filename + ext);
    fs.renameSync(req.file.path, newPath);
    imageUrl = `/uploads/${path.basename(newPath)}`;
  }
  const item = { id: String(Date.now()), title, description, category, lat: parseFloat(lat), lng: parseFloat(lng), imageUrl };
  data.unshift(item);
  res.status(201).json(item);
});

const port = process.env.PORT || 5174;
app.listen(port, () => console.log('Mock API running on http://localhost:'+port));
