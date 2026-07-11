# Registro semanal · Equipe de UX

Formulário + linha do tempo para o check-in semanal, com upload de imagens de verdade e
gravação local em disco (sem depender do Claude).

## Estrutura

```
registro-semanal-projeto/
├── index.html        → estrutura da página
├── style.css          → todo o visual (paleta, tema claro/escuro, responsividade)
├── script.js           → lógica do front-end (formulário, histórico, tema)
├── server.js            → servidor local (Node + Express) que grava tudo
├── package.json          → dependências do servidor
├── data/entries.json      → onde os registros ficam salvos (criado automaticamente)
└── uploads/                → onde as imagens enviadas ficam salvas (criado automaticamente)
```

## Como rodar (primeira vez)

Você precisa ter o **Node.js** instalado ([nodejs.org](https://nodejs.org), versão LTS).

No terminal, dentro da pasta do projeto:

```bash
npm install
node server.js
```

Você vai ver:

```
✅ Servidor rodando! Abra http://localhost:3000 no navegador.
```

Abra esse endereço no navegador — **não abra o `index.html` direto com duplo clique**, porque
o formulário precisa conversar com o servidor (`server.js`) pra gravar os dados.

## Nas próximas vezes

Só repita:

```bash
node server.js
```

(o `npm install` só é necessário uma vez, ou se você apagar a pasta `node_modules`)

## Onde os dados ficam

- **Textos**: em `data/entries.json` — um arquivo de texto simples, dá pra abrir e ler.
- **Imagens**: na pasta `uploads/`, com nomes gerados automaticamente (evita conflito entre
  arquivos com o mesmo nome).
- Excluir um registro pela interface remove ele do `entries.json`, mas a imagem em si continua
  em `uploads/` (fica órfã) — se quiser, pode apagar a pasta `uploads/` e o `entries.json` de vez
  em quando pra limpar tudo.

## Backup

Como é tudo local, faça backup da pasta `data/` e `uploads/` de vez em quando (por exemplo,
copiando pra um Google Drive) — se apagar a pasta do projeto sem isso, perde os registros.

## Fonte

Usa a fonte **Roboto** via Google Fonts (com fallback para fontes do sistema, caso não haja
internet no momento em que a página abrir).
