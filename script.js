(function(){
  window.addEventListener('error', (e) => {
    console.error('Erro no registro semanal:', e.error || e.message);
  });

  const state = { entries: [], projetoCount: 0 };

  // ---------- Tema claro/escuro (localStorage) ----------
  const appEl = document.getElementById('app');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-toggle-icon');
  const themeLabel = themeToggle.querySelector('.theme-toggle-label');
  const THEME_KEY = 'ux-registro-theme';

  const ICON_MOON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M20.2 14.4a8.7 8.7 0 0 1-10.6-10.6A9.7 9.7 0 1 0 20.2 14.4z"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="4.2" y1="4.2" x2="6" y2="6"/><line x1="18" y1="18" x2="19.8" y2="19.8"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/><line x1="4.2" y1="19.8" x2="6" y2="18"/><line x1="18" y1="6" x2="19.8" y2="4.2"/></svg>';

  function applyTheme(theme){
    if(!appEl) return;
    appEl.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeIcon.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
    themeLabel.textContent = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
  }

  if(themeToggle) {
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');
    themeToggle.addEventListener('click', () => {
      const next = appEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // ---------- Toast de alerta ----------
  const toastEl = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  function showToast(message){
    if(!toastEl) return;
    toastMessage.textContent = message;
    toastEl.hidden = false;
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }

  const nomeEl = document.getElementById('nome');
  const dataEl = document.getElementById('data');
  if(dataEl && !dataEl.value) {
    dataEl.value = new Date().toISOString().slice(0,10);
  }

  // ---------- Tabs ----------
  const tabForm = document.getElementById('tab-form');
  const tabHistory = document.getElementById('tab-history');
  const viewForm = document.getElementById('view-form');
  const viewHistory = document.getElementById('view-history');

  function showTab(which){
    const formActive = which === 'form';
    if(viewForm) viewForm.hidden = !formActive;
    if(viewHistory) viewHistory.hidden = formActive;
    if(tabForm) tabForm.classList.toggle('is-active', formActive);
    if(tabHistory) tabHistory.classList.toggle('is-active', !formActive);
    if(tabForm) tabForm.setAttribute('aria-selected', String(formActive));
    if(tabHistory) tabHistory.setAttribute('aria-selected', String(!formActive));
    if(!formActive) loadAllEntries(); 
  }
  
  if(tabForm) tabForm.addEventListener('click', () => showTab('form'));
  if(tabHistory) tabHistory.addEventListener('click', () => showTab('history'));

  // ---------- Projetos dinâmicos ----------
  const projetosContainer = document.getElementById('projetos-container');
  const BlackTemplate = document.getElementById('projeto-template');
  const addProjetoBtn = document.getElementById('add-projeto');

  function addProjeto(){
    if(!projetosContainer || !BlackTemplate) return;
    state.projetoCount += 1;
    const node = BlackTemplate.content.cloneNode(true);
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
  
  if(addProjetoBtn) addProjetoBtn.addEventListener('click', addProjeto);
  
  // Inicializa o primeiro bloco de projeto ao carregar a página
  document.addEventListener('DOMContentLoaded', () => {
    if(projetosContainer && projetosContainer.children.length === 0) {
      addProjeto();
    }
  });

  function collectProjetos(){
    if(!projetosContainer) return [];
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

  // ---------- Coletar entrada ----------
  function collectEntry(){
    const legalFile = document.getElementById('meme-legal-img') ? document.getElementById('meme-legal-img').files[0] : null;
    const fodaFile = document.getElementById('meme-foda-img') ? document.getElementById('meme-foda-img').files[0] : null;
    const shitFile = document.getElementById('meme-shit-img') ? document.getElementById('meme-shit-img').files[0] : null;
    
    return {
      id: 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      nome: nomeEl ? nomeEl.value.trim() : '',
      data: dataEl ? dataEl.value : '',
      memes: {
        legal: { titulo: document.getElementById('meme-legal-titulo') ? document.getElementById('meme-legal-titulo').value.trim() : '', imagem: '', imagemNome: legalFile ? legalFile.name : '' },
        foda:  { titulo: document.getElementById('meme-foda-titulo') ? document.getElementById('meme-foda-titulo').value.trim() : '',  imagem: '', imagemNome: fodaFile ? fodaFile.name : '' },
        shit:  { titulo: document.getElementById('meme-shit-titulo') ? document.getElementById('meme-shit-titulo').value.trim() : '',  imagem: '', imagemNome: shitFile ? shitFile.name : '' },
      },
      projetos: collectProjetos(),
    };
  }

  function validate(entry){
    let ok = true;
    const errNome = document.getElementById('err-nome');
    const errData = document.getElementById('err-data');
    if(errNome) errNome.textContent = '';
    if(errData) errData.textContent = '';
    
    if(!entry.nome){ if(errNome) errNome.textContent = 'Informe seu nome.'; ok = false; }
    if(!entry.data){ if(errData) errData.textContent = 'Informe a data.'; ok = false; }
    return ok;
  }

  // ---------- Envio do Formulário para a API do Render ----------
  const formEl = document.getElementById('entry-form');
  const feedbackBox = document.getElementById('api-feedback-box');
  const btnSalvar = document.getElementById('btn-salvar-registro');

  if(formEl) {
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const entry = collectEntry();
      if(!validate(entry)) return;

      if(btnSalvar) {
        btnSalvar.innerText = "Salvando no servidor...";
        btnSalvar.disabled = true;
      }
      if(feedbackBox) feedbackBox.style.display = "none";

      try {
        const formData = new FormData();
        formData.append('dados', JSON.stringify(entry));

        const legalFile = document.getElementById('meme-legal-img') ? document.getElementById('meme-legal-img').files[0] : null;
        const fodaFile = document.getElementById('meme-foda-img') ? document.getElementById('meme-foda-img').files[0] : null;
        const shitFile = document.getElementById('meme-shit-img') ? document.getElementById('meme-shit-img').files[0] : null;
        
        if (legalFile) formData.append('meme_legal', legalFile);
        if (fodaFile) formData.append('meme_foda', fodaFile);
        if (shitFile) formData.append('meme_shit', shitFile);

        if(projetosContainer) {
          const blocks = [...projetosContainer.querySelectorAll('[data-projeto]')];
          blocks.forEach((b, index) => {
            const files = b.querySelector('[data-field="imagens"]').files;
            for (let i = 0; i < files.length; i++) {
              formData.append(`projeto_${index}_img_${i}`, files[i]);
            }
          });
        }

        const urlBase = window.API_URL || '';
        const response = await fetch(`${urlBase}/api/entries`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Erro ao salvar no servidor.');

        if(feedbackBox) {
          feedbackBox.innerText = "✓ Registro publicado na nuvem com sucesso!";
          feedbackBox.style.backgroundColor = "rgba(46, 204, 113, 0.15)";
          feedbackBox.style.color = "#2ecc71";
          feedbackBox.style.display = "block";
        }
        
        formEl.reset();
        if(projetosContainer) projetosContainer.innerHTML = '';
        addProjeto(); 
        showToast("Salvo com sucesso!");

      } catch (error) {
        console.error(error);
        if(feedbackBox) {
