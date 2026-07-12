const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite conexões e lê dados em formato JSON comum
app.use(cors());
app.use(express.json());

// Define os caminhos das pastas onde o Claude salva os dados
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'entries.json');

// Garante que a pasta e o arquivo JSON existam no Render ao iniciar
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]));

// ROTA para o seu site buscar o histórico na Linha do Tempo
app.get('/api/entries', (req, res) => {
  try {
    const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
    res.json(JSON.parse(fileData || '[]'));
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao carregar dados.' });
  }
});

// ROTA para salvar um novo registro vindo do formulário
app.post('/api/entries', (req, res) => {
  try {
    const novaEntrada = req.body;

    // Lê o arquivo atual, adiciona o novo registro e salva
    const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
    const entries = JSON.parse(fileData || '[]');
    
    entries.push(novaEntrada);
    fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2));

    res.status(201).json(novaEntrada);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao salvar.' });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
