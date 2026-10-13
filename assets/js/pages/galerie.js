/* Page « Galerie » : albums (liens Flickr ou photos hébergées) */
(function () {
  const { sb, esc, qs, qsa, fmtDate, reveal } = window.CLTO;
  let albums = [], cat = '';

  function lightbox(album) {
    const imgs = album.images || [];
    const box = document.createElement('div');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', album.title);
    box.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(7,26,64,.96);display:grid;grid-template-rows:auto 1fr;padding:20px;gap:14px;overflow:auto';
    box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;color:#fff"><h2 style="font-size:2rem;margin:0">${esc(album.title)}</h2><button class="btn btn-gold btn-small" type="button">Fermer</button></div>
      <div style="columns:3 280px;gap:12px">${imgs.map((u) => `<img src="${esc(u)}" alt="" loading="lazy" style="width:100%;margin-bottom:12px;border-radius:10px">`).join('')}</div>`;
    const close = () => { box.remove(); window.__lenis && window.__lenis.start(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    box.querySelector('button').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.append(box); window.__lenis && window.__lenis.stop(); box.querySelector('button').focus();
  }

  function render() {
    const list = albums.filter((a) => !cat || a.category === cat);
    qs('#albums').innerHTML = list.map((a, i) => {
      const local = (a.images || []).length && !a.url_album;
      return `<a class="album" href="${local ? '#' : esc(a.url_album || '#')}" ${local ? `data-i="${albums.indexOf(a)}"` : 'target="_blank" rel="noopener"'} data-reveal="zoom">
        ${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy">` : ''}
        <div class="album-body">${a.category ? `<span class="chip chip-gold">${esc(a.category)}</span>` : ''}<h3>${esc(a.title)}</h3><small>${fmtDate(a.date)}</small></div></a>`;
    }).join('') || '<p class="empty" style="grid-column:span 12">Aucun album pour le moment.</p>';
    qsa('#gcats .filter-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === cat)));
    qsa('#albums a[data-i]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); lightbox(albums[+a.dataset.i]); }));
    reveal(qs('#albums'));
  }

  window.CLTO.ready.then(async () => {
    const { data } = await sb.from('clto_gallery').select('*').order('date', { ascending: false });
    albums = data || [];
    const cats = [...new Set(albums.map((a) => a.category).filter(Boolean))].sort();
    qs('#gcats').innerHTML = ['', ...cats].map((c) => `<button class="filter-btn" type="button" data-c="${esc(c)}" aria-pressed="false">${c ? esc(c) : 'Tous les albums'}</button>`).join('');
    qsa('#gcats .filter-btn').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.c; render(); }));
    render();
  });
})();
