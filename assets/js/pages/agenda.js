/* Page « Agenda » : liste filtrable puis fiches détaillées */
(function () {
  const { sb, esc, qs, qsa, I, MONTHS, parseDate, fmtRange, slugKind, reveal, todayISO } = window.CLTO;
  let events = [];
  let filter = new URLSearchParams(location.search).get('type') || '';

  function render() {
    const today = todayISO();
    const isPast = (e) => (e.date_end || e.date_start) < today;
    let list = filter === 'past' ? events.filter(isPast).reverse() : events.filter((e) => !isPast(e) && (!filter || e.kind === filter));
    qsa('#filters .filter-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === filter)));
    qs('#agenda-list').innerHTML = list.map((e) => {
      const d = parseDate(e.date_start);
      return `<a class="agenda-item" href="#ev-${e.id}"><div class="date-tile k-${slugKind(e.kind)}"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
        <div><span class="chip chip-gold">${esc(e.kind)}</span><h3 style="margin-top:6px">${esc(e.title)}</h3>
        <div class="meta"><span>${esc(fmtRange(e.date_start, e.date_end))}</span>${e.location ? `<span>${I.pin}${esc(e.location)}</span>` : ''}${e.time_text ? `<span>${I.clock}${esc(e.time_text)}</span>` : ''}</div></div>
        <span class="link-arrow">Détails</span></a>`;
    }).join('') || '<p class="empty">Aucun rendez-vous dans cette catégorie pour le moment.</p>';
    qs('#agenda-details').innerHTML = list.map((e) => `<article class="event-detail" id="ev-${e.id}" data-reveal>
        <div>${e.image ? `<img src="${esc(e.image)}" alt="Affiche : ${esc(e.title)}" loading="lazy">` : ''}</div>
        <div>
          <span class="chip chip-gold">${esc(e.kind)}</span>
          <h2 style="font-size:clamp(2rem,4vw,3rem);margin-top:10px">${esc(e.title)}</h2>
          <div class="event-facts">
            <span class="fact">${I.clock}${esc(fmtRange(e.date_start, e.date_end))}${e.time_text ? ' · ' + esc(e.time_text) : ''}</span>
            ${e.location ? `<span class="fact">${I.pin}${esc(e.location)}</span>` : ''}
            ${e.audience ? `<span class="fact">${I.users}${esc(e.audience)}</span>` : ''}
            ${e.price ? `<span class="fact">${I.euro}${esc(e.price)}</span>` : ''}
          </div>
          <div class="prose">${e.description || ''}</div>
          ${e.link ? `<a class="btn" href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.cta_label || 'En savoir plus')}</a>` : ''}
        </div></article>`).join('');
    reveal(document);
  }

  window.CLTO.ready.then(async () => {
    const { data } = await sb.from('clto_events').select('*').eq('published', true).order('date_start');
    events = data || [];
    qsa('#filters .filter-btn').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.k; render(); }));
    render();
    if (location.hash) { const t = qs(location.hash); if (t) setTimeout(() => (window.__lenis ? window.__lenis.scrollTo(t, { offset: -100 }) : t.scrollIntoView()), 300); }
    qs('#agenda-list').addEventListener('click', (ev) => {
      const a = ev.target.closest('a[href^="#ev-"]'); if (!a) return;
      ev.preventDefault(); const t = qs(a.getAttribute('href'));
      if (t) (window.__lenis ? window.__lenis.scrollTo(t, { offset: -100 }) : t.scrollIntoView({ behavior: 'smooth' }));
    });
  });
})();
