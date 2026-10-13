/* Page article : ?a=slug */
(function () {
  const { sb, esc, qs, fmtDate, reveal } = window.CLTO;
  const slug = new URLSearchParams(location.search).get('a');

  window.CLTO.ready.then(async () => {
    const { data: p } = slug ? await sb.from('clto_posts').select('*').eq('slug', slug).maybeSingle() : { data: null };
    if (!p) {
      qs('#a-title').textContent = 'Article introuvable';
      qs('#a-body').innerHTML = '<p>Cet article n\'existe pas ou n\'est plus en ligne. <a href="actualites.html">Voir toutes les actualités</a>.</p>';
      return;
    }
    document.title = `${p.title} — CLTO Badminton Orléans`;
    const md = document.querySelector('meta[name="description"]'); if (md && p.excerpt) md.content = p.excerpt;
    qs('#a-title').textContent = p.title;
    qs('#a-meta').innerHTML = (p.categories || []).map((c) => `<span class="chip">${esc(c)}</span>`).join('') + `<span>Publié le ${fmtDate(p.date)}</span>`;
    qs('#a-cover').innerHTML = p.cover ? `<img src="${esc(p.cover)}" alt="">` : '';
    qs('#a-body').innerHTML = p.content || '';
    qs('#a-body').querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    if (window.gsap && !window.CLTO.reduceMotion) {
      window.gsap.from('#a-title', { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out' });
      window.gsap.from('#a-cover img', { y: 60, scale: 0.96, opacity: 0, duration: 1.1, ease: 'expo.out', delay: 0.15 });
    }
    const { data: rel } = await sb.from('clto_posts').select('slug,title,excerpt,cover,categories,date').eq('published', true).neq('slug', slug).order('date', { ascending: false }).limit(3);
    qs('#related').innerHTML = (rel || []).map((r) => `<a class="news-card" href="article.html?a=${encodeURIComponent(r.slug)}" data-reveal><div class="news-img">${r.cover ? `<img src="${esc(r.cover)}" alt="" loading="lazy">` : ''}</div><div class="news-meta"><span>${fmtDate(r.date)}</span></div><h3>${esc(r.title)}</h3></a>`).join('');
    reveal(document);
  });
})();
