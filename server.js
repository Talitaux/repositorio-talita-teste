const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações básicas de segurança e leitura de dados
app.use(cors());
app.use(express.json());

// Garante que as pastas de armazenamento existam no servidor do Render
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'entries.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]));

// Configuração do Multer: Como as imagens/vídeos serão salvos na pasta 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Cria um nome único para o arquivo (ex: 1718293821-nome-da-foto.jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Permite que as pessoas acessem as imagens salvas pela URL (Ex: ://seu-site.com)
app.use('/uploads', express.static(UPLOADS_DIR));

// ---------------- ROTA 1: BUSCAR TODOS OS REGISTROS (GET) ----------------
app.get('/api/entries', (req, res) => {
  try {
    const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
    const entries = JSON.parse(fileData || '[]');
    res.json(entries);
  } catch (error) {
    console.error('Erro ao ler registros:', error);
    res.status(500).json({ mensagem: 'Erro ao carregar os dados.' });
  }
});

// ---------------- ROTA 2: RECEBER NOVO REGISTRO COM MÍDIAS (POST) ----------------
// O multer.any() aceita qualquer arquivo vindo dos blocos dinâmicos de projetos ou memes
app.post('/api/entries', upload.any(), (req, res) => {
  try {
    // O texto estruturado enviado pelo fetch fica dentro de req.body.dados
    if (!req.body.dados) {
      return res.status(400).json({ mensagem: 'Dados do formulário não encontrados.' });
    }

    const novaEntrada = JSON.parse(req.body.dados);

    // Mapeia os arquivos físicos que o Multer acabou de salvar na pasta uploads
    req.files.forEach(file => {
      const urlDaMidia = `/uploads/${file.filename}`;

      // Se for imagem de Meme, vincula ao meme correspondente
      if (file.fieldname === 'meme_legal') novaEntrada.memes.legal.imagem = urlDaMidia;
      if (file.fieldname === 'meme_foda') novaEntrada.memes.foda.imagem = urlDaMidia;
      if (file.fieldname === 'meme_shit') novaEntrada.memes.shit.imagem = urlDaMidia;

      // Se for imagem de Projeto Dinâmico (ex: projeto_0_img_0)
      if (file.fieldname.startsWith('projeto_')) {
        const partes = file.fieldname.split('_');
        const projetoIndex = parseInt(partes[1], 10);
        
        if (novaEntrada.projetos[projetoIndex]) {
          novaEntrada.projetos[projetoIndex].imagens.push(urlDaMidia);
        }
      }
    });

    // Lê o arquivo JSON atual, adiciona o novo registro e salva de volta
    const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
    const entries = JSON.parse(fileData || '[]');
    
    entries.push(novaEntrada);
    fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2));

    console.log(`✓ Registro de ${novaEntrada.nome} salvo com sucesso!`);
    res.status(201).json({ mensagem: 'Registro salvo com sucesso!', dados: novaEntrada });

  } catch (error) {
    console.error('Erro ao salvar registro:', error);
    res.status(500).json({ mensagem: 'Erro interno ao processar o formulário.' });
  }
});

// Inicializa o servidor na porta correta
app.listen(PORT, () => {
  console.log(`Servidor rodando e escutando na porta ${PORT}`);
});
