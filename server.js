const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'entries.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Garante que as pastas/arquivos existam antes de começar
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if(!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
if(!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configura onde e como os arquivos de imagem são salvos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, crypto.randomUUID() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB por imagem
});

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname)); // serve index.html, style.css, script.js direto na raiz

function readEntries(){
  try{
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }catch(err){
    console.error('Erro ao ler entries.json, começando do zero:', err.message);
    return [];
  }
}

function writeEntries(entries){
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

// Lista todos os registros salvos
app.get('/api/entries', (req, res) => {
  res.json(readEntries());
});

// Salva um novo registro, com as imagens que vierem junto
app.post('/api/entries', upload.fields([
  { name: 'meme_legal_img', maxCount: 1 },
  { name: 'meme_foda_img', maxCount: 1 },
  { name: 'meme_shit_img', maxCount: 1 },
  { name: 'projeto_imagens', maxCount: 50 },
]), (req, res) => {
  try{
    const entry = JSON.parse(req.body.entry);
    const files = req.files || {};
    const fileUrl = (f) => '/uploads/' + f.filename;

    if(files.meme_legal_img) entry.memes.legal.imagem = fileUrl(files.meme_legal_img[0]);
    if(files.meme_foda_img)  entry.memes.foda.imagem  = fileUrl(files.meme_foda_img[0]);
    if(files.meme_shit_img)  entry.memes.shit.imagem  = fileUrl(files.meme_shit_img[0]);

    // As imagens de projeto chegam todas juntas, na ordem dos blocos do formulário.
    // Cada projeto sabe quantas são suas (imagensCount), então distribuímos em fatias.
    const projetoFiles = files.projeto_imagens || [];
    let cursor = 0;
    (entry.projetos || []).forEach(p => {
      const count = p.imagensCount || 0;
      const slice = projetoFiles.slice(cursor, cursor + count);
      p.imagens = slice.map(fileUrl);
      delete p.imagensCount;
      cursor += count;
    });

    const entries = readEntries();
    entries.push(entry);
    writeEntries(entries);

    res.json({ ok: true, entry });
  }catch(err){
    console.error('Erro ao salvar registro:', err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Exclui um registro específico (mantém as imagens no disco, só remove a referência)
app.delete('/api/entries/:id', (req, res) => {
  const entries = readEntries().filter(e => e.id !== req.params.id);
  writeEntries(entries);
  res.json({ ok: true });
});

// Apaga todos os registros
app.delete('/api/entries', (req, res) => {
  writeEntries([]);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando! Abra http://localhost:${PORT} no navegador.\n`);
});
