/* Page « Actualités » */
(function () {
  const { sb, esc, qs, qsa, fmtDate, reveal } = window.CLTO;
  let posts = [], cat = '', shown = 9;

  function render() {
    const list = posts.filter((p) => !cat || (p.categories || []).includes(cat));
    qs('#news').innerHTML = list.slice(0, shown).map((p) => `<a class="news-card" href="article.html?a=${encodeURIComponent(p.slug)}" data-reveal>
      <div class="news-img">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : ''}</div>
      <div class="news-meta">${(p.categories || []).map((c) => `<span class="chip">${esc(c)}</span>`).join('')}<span>${fmtDate(p.date)}</span></div>
      <h3>${esc(p.title)}</h3><p>${esc(p.excerpt || '')}</p></a>`).join('') || '<p class="empty">Aucun article dans cette catégorie.</p>';
    qs('#more').hidden = list.length <= shown;
    qsa('#cats .filter-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === cat)));
    reveal(qs('#news'));
  }

  window.CLTO.ready.then(async () => {
    const { data } = await sb.from('clto_posts').select('slug,title,excerpt,cover,categories,date').eq('published', true).order('date', { ascending: false });
    posts = data || [];
    const cats = [...new Set(posts.flatMap((p) => p.categories || []))].sort();
    qs('#cats').innerHTML = ['', ...cats].map((c) => `<button class="filter-btn" type="button" data-c="${esc(c)}" aria-pressed="false">${c ? esc(c) : 'Toutes'}</button>`).join('');
    qsa('#cats .filter-btn').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.c; shown = 9; render(); }));
    qs('#more').addEventListener('click', () => { shown += 9; render(); });
    render();
  });
})();
