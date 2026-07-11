(function(){
  window.addEventListener('error', (e) => {
    console.error('Erro no registro semanal:', e.error || e.message);
  });

  const state = { entries: [], projetoCount: 0 };

  // ---------- Tema claro/escuro (localStorage, pois agora roda fora do Claude) ----------
  const appEl = document.getElementById('app');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-toggle-icon');
  const themeLabel = themeToggle.querySelector('.theme-toggle-label');
  const THEME_KEY = 'ux-registro-theme';

  const ICON_MOON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M20.2 14.4a8.7 8.7 0 0 1-10.6-10.6A9.7 9.7 0 1 0 20.2 14.4z"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="4.2" y1="4.2" x2="6" y2="6"/><line x1="18" y1="18" x2="19.8" y2="19.8"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/><line x1="4.2" y1="19.8" x2="6" y2="18"/><line x1="18" y1="6" x2="19.8" y2="4.2"/></svg>';

  function applyTheme(theme){
    appEl.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeIcon.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
    themeLabel.textContent = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
  }

  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  themeToggle.addEventListener('click', () => {
    const next = appEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  // ---------- Toast de alerta ----------
  const toastEl = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  function showToast(message){
    toastMessage.textContent = message;
    toastEl.hidden = false;
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }

  const nomeEl = document.getElementById('nome');
  const dataEl = document.getElementById('data');
  dataEl.value = new Date().toISOString().slice(0,10);

  // ---------- Tabs ----------
  const tabForm = document.getElementById('tab-form');
  const tabHistory = document.getElementById('tab-history');
  const viewForm = document.getElementById('view-form');
  const viewHistory = document.getElementById('view-history');

  function showTab(which){
    const formActive = which === 'form';
    viewForm.hidden = !formActive;
    viewHistory.hidden = formActive;
    tabForm.classList.toggle('is-active', formActive);
    tabHistory.classList.toggle('is-active', !formActive);
    tabForm.setAttribute('aria-selected', String(formActive));
    tabHistory.setAttribute('aria-selected', String(!formActive));
    if(!formActive) loadHistory();
  }
  tabForm.addEventListener('click', () => showTab('form'));
  tabHistory.addEventListener('click', () => showTab('history'));

  // ---------- Projetos dinâmicos ----------
  const projetosContainer = document.getElementById('projetos-container');
  const projetoTemplate = document.getElementById('projeto-template');
  const addProjetoBtn = document.getElementById('add-projeto');

  function addProjeto(){
    state.projetoCount += 1;
    const node = projetoTemplate.content.cloneNode(true);
    node.querySelector('[data-index]').textContent = state.projetoCount;
    node.querySelector('[data-remove-projeto]').addEventListener('click', (e) => {
      e.target.closest('[data-projeto]').remove();
      renumberProjetos();
    });
    const fileInput = node.querySelector('[data-field="imagens"]');
    const fileHint = node.querySelector('[data-file-hint]');
    fileInput.addEventListener('change', () => {
      fileHint.textContent = fileInput.files.length
        ? `${fileInput.files.length} imagem(ns) selecionada(s)`
        : '';
    });
    projetosContainer.appendChild(node);
  }
  function renumberProjetos(){
    const blocks = projetosContainer.querySelectorAll('[data-projeto]');
    blocks.forEach((b, i) => { b.querySelector('[data-index]').textContent = i + 1; });
    state.projetoCount = blocks.length;
  }
  addProjetoBtn.addEventListener('click', addProjeto);
  addProjeto(); // começa com um projeto em branco

  function collectProjetos(){
    const blocks = [...projetosContainer.querySelectorAll('[data-projeto]')];
    return blocks.map(b => ({
      titulo: b.querySelector('[data-field="titulo"]').value.trim(),
      descricao: b.querySelector('[data-field="descricao"]').value.trim(),
      link: b.querySelector('[data-field="link"]').value.trim(),
      imagens: [],
      imagensCount: b.querySelector('[data-field="imagens"]').files.length,
      usuarios: b.querySelector('[data-field="usuarios"]').value || '0',
      proximaAcao: b.querySelector('[data-field="proximaAcao"]').value.trim(),
    })).filter(p => p.titulo || p.descricao || p.proximaAcao || p.imagensCount);
  }

  // ---------- Coletar entrada (metadados, sem os arquivos em si) ----------
  function collectEntry(){
    const legalFile = document.getElementById('meme-legal-img').files[0];
    const fodaFile = document.getElementById('meme-foda-img').files[0];
    const shitFile = document.getElementById('meme-shit-img').files[0];
    return {
      id: 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      nome: nomeEl.value.trim(),
      data: dataEl.value,
      memes: {
        legal: { titulo: document.getElementById('meme-legal-titulo').value.trim(), imagem: '', imagemNome: legalFile ? legalFile.name : '' },
        foda:  { titulo: document.getElementById('meme-foda-titulo').value.trim(),  imagem: '', imagemNome: fodaFile ? fodaFile.name : '' },
        shit:  { titulo: document.getElementById('meme-shit-titulo').value.trim(),  imagem: '', imagemNome: shitFile ? shitFile.name : '' },
      },
      projetos: collectProjetos(),
    };
  }

  function validate(entry){
    let ok = true;
    document.getElementById('err-nome').textContent = '';
    document.getElementById('err-data').textContent = '';
    if(!entry.nome){ document.getElementById('err-nome').textContent = 'Informe seu nome.'; ok = false; }
    if(!entry.data){ document.getElementById('err-data').textContent = 'Informe a data.'; ok = false; }
    return ok;
  }

  function formatEntry(entry){
    const dataFmt = entry.data ? entry.data.split('-').reverse().join('/') : '';
    let out = `${entry.nome} ${dataFmt}\n\n`;
    const memeBlock = (label, m) => {
      out += `Escolha um meme que represente o seu ${label} da semana:\n\n`;
      out += `${m.titulo || '—'}\n`;
      if(m.imagem) out += `${window.location.origin}${m.imagem}\n`;
      else if(m.imagemNome) out += `(imagem anexada: ${m.imagemNome})\n`;
      out += `\n`;
    };
    memeBlock('fiz algo legal', entry.memes.legal);
    memeBlock('resolvi algo foda', entry.memes.foda);
    memeBlock('shit happens', entry.memes.shit);

    out += `Projetos\n\n`;
    if(entry.projetos.length === 0){
      out += `(nenhum projeto registrado)\n\n`;
    }
    entry.projetos.forEach(p => {
      out += `${p.titulo}\n\n`;
      if(p.descricao) out += `${p.descricao}\n\n`;
      if(p.link) out += `${p.link}\n\n`;
      if(p.imagens && p.imagens.length){
        out += p.imagens.map(u => `${window.location.origin}${u}`).join('\n') + '\n\n';
      }else if(p.imagensCount){
        out += `(${p.imagensCount} imagem(ns) anexada(s))\n\n`;
      }
      out += `Usuários envolvidos: ${p.usuarios}\n\n`;
      out += `Próxima Ação: ${p.proximaAcao || '—'}\n\n`;
      out += `__________________________________________________________________________\n\n`;
    });
    return out.trim();
  }

  // ---------- Comunicação com o servidor local ----------
  const API_BASE = '/api/entries';

  async function loadAllEntries(){
    try{
      const res = await fetch(API_BASE);
      if(!res.ok) throw new Error('Falha ao buscar registros');
      return await res.json();
    }catch(err){
      console.error('Falha ao carregar registros:', err);
      return null; // null = erro de verdade (servidor fora do ar), diferente de [] (sem registros)
    }
  }

  async function saveEntryToServer(formData){
    try{
      const res = await fetch(API_BASE, { method: 'POST', body: formData });
      if(!res.ok) throw new Error('Falha ao salvar');
      return await res.json();
    }catch(err){
      console.error('Falha ao salvar registro:', err);
      return null;
    }
  }

  async function deleteEntryOnServer(id){
    try{
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      return res.ok;
    }catch(err){
      console.error('Falha ao excluir registro:', err);
      return false;
    }
  }

  async function deleteAllEntriesOnServer(){
    try{
      const res = await fetch(API_BASE, { method: 'DELETE' });
      return res.ok;
    }catch(err){
      console.error('Falha ao limpar registros:', err);
      return false;
    }
  }

  function buildFormData(entry){
    const fd = new FormData();
    const legalFile = document.getElementById('meme-legal-img').files[0];
    const fodaFile = document.getElementById('meme-foda-img').files[0];
    const shitFile = document.getElementById('meme-shit-img').files[0];
    if(legalFile) fd.append('meme_legal_img', legalFile);
    if(fodaFile) fd.append('meme_foda_img', fodaFile);
    if(shitFile) fd.append('meme_shit_img', shitFile);

    const blocks = [...projetosContainer.querySelectorAll('[data-projeto]')];
    blocks.forEach(b => {
      const files = b.querySelector('[data-field="imagens"]').files;
      for(let i = 0; i < files.length; i++){ fd.append('projeto_imagens', files[i]); }
    });

    fd.append('entry', JSON.stringify(entry));
    return fd;
  }

  // ---------- Salvar registro ----------
  const form = document.getElementById('entry-form');
  const saveStatus = document.getElementById('save-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const entry = collectEntry();
    if(!validate(entry)) return;
    saveStatus.textContent = 'Salvando…';
    const formData = buildFormData(entry);
    const result = await saveEntryToServer(formData);
    if(result && result.ok){
      saveStatus.textContent = 'Registro salvo. Obrigado!';
      form.reset();
      dataEl.value = new Date().toISOString().slice(0,10);
      projetosContainer.innerHTML = '';
      state.projetoCount = 0;
      addProjeto();
      showToast('Registro salvo com sucesso!');
      showTab('history');
    }else{
      saveStatus.textContent = 'Não foi possível salvar. O servidor local está rodando (node server.js)?';
      showToast('Não foi possível salvar. Verifique se o servidor está rodando.');
    }
  });

  // ---------- Copiar para a área de transferência (com fallback) ----------
  async function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      try{
        await navigator.clipboard.writeText(text);
        return true;
      }catch(err){ /* cai no fallback abaixo */ }
    }
    try{
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(temp);
      return ok;
    }catch(err){
      return false;
    }
  }

  // ---------- Preview modal ----------
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalTextarea = document.getElementById('modal-textarea');
  const copyStatus = document.getElementById('copy-status');

  document.getElementById('preview-btn').addEventListener('click', () => {
    const entry = collectEntry();
    modalTextarea.value = formatEntry(entry);
    copyStatus.textContent = '';
    modalBackdrop.hidden = false;
    modalTextarea.focus();
  });
  document.getElementById('modal-close').addEventListener('click', () => { modalBackdrop.hidden = true; });
  modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) modalBackdrop.hidden = true; });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && !modalBackdrop.hidden) modalBackdrop.hidden = true; });

  document.getElementById('modal-copy').addEventListener('click', async () => {
    const ok = await copyText(modalTextarea.value);
    if(ok){
      copyStatus.textContent = 'Copiado para a área de transferência.';
    }else{
      modalTextarea.select();
      copyStatus.textContent = 'Não deu para copiar automaticamente — texto selecionado, use Ctrl/Cmd+C.';
    }
  });

  // ---------- Histórico ----------
  const historyList = document.getElementById('history-list');
  const historyStatus = document.getElementById('history-status');

  function escapeHtml(str){
    return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  async function loadHistory(){
    historyStatus.textContent = 'Carregando registros…';
    historyList.innerHTML = '';
    const entries = await loadAllEntries();
    if(entries === null){
      historyStatus.textContent = '';
      historyList.innerHTML = '<div class="empty-state">Não foi possível conectar ao servidor local. Confirme que rodou <code>node server.js</code> no terminal.</div>';
      return;
    }
    state.entries = entries;
    if(entries.length === 0){
      historyStatus.textContent = '';
      historyList.innerHTML = '<div class="empty-state">Nenhum registro ainda. Preencha um na aba "Novo registro".</div>';
      return;
    }
    historyStatus.textContent = `${entries.length} registro(s) encontrado(s).`;
    const sorted = [...entries].sort((a,b) => (b.data || '').localeCompare(a.data || ''));
    sorted.forEach(entry => historyList.appendChild(renderEntryCard(entry)));
  }

  function renderEntryCard(entry){
    const card = document.createElement('div');
    card.className = 'entry-card';
    const dataFmt = entry.data ? entry.data.split('-').reverse().join('/') : '—';

    const memeChips = ['legal','foda','shit'].map(k => {
      const m = entry.memes && entry.memes[k];
      const labelMap = { legal: 'algo legal', foda: 'algo foda', shit: 'shit happens' };
      if(!m || !m.titulo) return '';
      const thumb = m.imagem ? `<img class="meme-thumb" src="${m.imagem}" alt="">` : '';
      return `<span class="chip">${thumb}${labelMap[k]}: ${escapeHtml(m.titulo)}</span>`;
    }).join('');

    const projetosHtml = (entry.projetos || []).map(p => {
      const thumbs = (p.imagens || []).map(u => `<img class="proj-thumb" src="${u}" alt="">`).join('');
      return `
      <div class="proj-summary">
        <strong>${escapeHtml(p.titulo || 'Projeto sem título')}</strong>
        ${p.descricao ? escapeHtml(p.descricao) : ''}
        ${thumbs ? `<div class="proj-thumbs">${thumbs}</div>` : ''}
        <div class="proj-meta">Usuários envolvidos: ${escapeHtml(String(p.usuarios ?? '0'))} · Próxima ação: ${escapeHtml(p.proximaAcao || '—')}</div>
      </div>
    `;
    }).join('');

    card.innerHTML = `
      <div class="entry-head">
        <span class="who">${escapeHtml(entry.nome || 'Sem nome')}</span>
        <span class="when">${dataFmt}</span>
      </div>
      <div class="entry-memes">${memeChips}</div>
      ${projetosHtml}
      <div class="actions" style="margin-top:10px;">
        <button type="button" class="btn btn-ghost" data-copy>Copiar texto</button>
        <button type="button" class="btn btn-danger-ghost" data-delete>Excluir</button>
      </div>
    `;

    const copyBtn = card.querySelector('[data-copy]');
    copyBtn.addEventListener('click', async () => {
      const text = formatEntry(entry);
      const ok = await copyText(text);
      const original = 'Copiar texto';
      copyBtn.textContent = ok ? 'Copiado!' : 'Não copiou — tente de novo';
      setTimeout(() => { copyBtn.textContent = original; }, 1800);
    });

    card.querySelector('[data-delete]').addEventListener('click', async () => {
      const confirmed = window.confirm(`Excluir o registro de ${entry.nome} (${dataFmt})? Essa ação não pode ser desfeita.`);
      if(!confirmed) return;
      const ok = await deleteEntryOnServer(entry.id);
      if(ok){ loadHistory(); }
      else{ historyStatus.textContent = 'Não foi possível excluir agora. Tente novamente.'; }
    });

    return card;
  }

  document.getElementById('refresh-history').addEventListener('click', loadHistory);
  document.getElementById('reset-all').addEventListener('click', async () => {
    const confirmed = window.confirm('Isso vai apagar TODOS os registros salvos localmente. Tem certeza?');
    if(!confirmed) return;
    const ok = await deleteAllEntriesOnServer();
    if(ok){ loadHistory(); }
    else{ historyStatus.textContent = 'Não foi possível limpar os registros agora.'; }
  });

})();
