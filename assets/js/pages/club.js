/* Page « Le club » : chiffres, labels, frise, palmarès, organigramme */
(function () {
  const { sb, esc, qs, S, initials, parseDate, reveal, reduceMotion } = window.CLTO;

  function stats() {
    const st = (S('stats') || {}).main || [];
    qs('#club-stats').innerHTML = st.map((s) => `<div class="score"><div class="score-num"><span class="cnt" data-to="${esc(s.value)}">${esc(s.value)}</span>${s.suffix ? `<small>${esc(s.suffix)}</small>` : ''}</div><div class="score-label">${esc(s.label)}</div></div>`).join('');
    if (window.gsap && !reduceMotion) {
      qs('#club-stats').querySelectorAll('.cnt').forEach((el) => {
        const o = { v: 0 }; const end = parseFloat(el.dataset.to) || 0; el.textContent = '0';
        window.gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
      });
    }
    const labels = (S('labels') || {}).items || [];
    qs('#club-labels').innerHTML = labels.map((l) => `<div class="label-item" style="color:rgba(255,255,255,.8)"><img src="${esc(l.image)}" alt="" loading="lazy" style="background:#fff;border-radius:50%;padding:8px"><span>${esc(l.name)}</span></div>`).join('');
  }

  async function timeline() {
    const { data } = await sb.from('clto_timeline').select('*').order('date', { ascending: true });
    const hist = (data || []).filter((t) => t.kind !== 'palmares');
    const pal = (data || []).filter((t) => t.kind === 'palmares').reverse();
    qs('#timeline').innerHTML = hist.map((t) => `<div class="tl-item" data-reveal><div class="tl-year">${t.date_label ? esc(t.date_label) : parseDate(t.date).getFullYear()}</div><div><h3>${esc(t.title)}</h3>${t.text ? `<p>${esc(t.text)}</p>` : ''}</div></div>`).join('') || '<p class="empty">La frise arrive bientôt.</p>';
    qs('#medals').innerHTML = pal.map((t) => `<div class="medal"><span class="yr">${parseDate(t.date).getFullYear()}</span><h3>${esc(t.title)}</h3><p>${esc(t.text || '')}</p></div>`).join('');
    /* la ligne de la frise se remplit au défilement */
    if (window.gsap && !reduceMotion) {
      window.gsap.fromTo('#timeline', { '--tl': 0 }, { '--tl': 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 70%', scrub: true } });
    }
    reveal(document);
  }

  async function people() {
    const { data } = await sb.from('clto_people').select('*').order('position');
    const order = ["Conseil d'administration", 'Commissions', 'Salariés', 'Services civiques', 'Entraîneurs bénévoles', 'Ouvreurs'];
    const groups = {};
    (data || []).forEach((p) => { (groups[p.grp] = groups[p.grp] || []).push(p); });
    const rank = (g) => { const i = order.indexOf(g); return i < 0 ? 50 : i; };
    const names = Object.keys(groups).sort((a, b) => rank(a) - rank(b));
    qs('#people').innerHTML = names.map((g) => {
      const list = groups[g];
      if (g === 'Ouvreurs') {
        return `<div class="people-group" data-reveal><h3>${esc(g)}</h3><div class="chips-list">${list.map((p) => `<span>${esc(p.name)}</span>`).join('')}</div></div>`;
      }
      return `<div class="people-group" data-reveal><h3>${esc(g)}</h3><div class="people">${list.map((p) => `<div class="person"><span class="avatar">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : initials(p.name)}</span><div><b>${esc(p.name)}</b><small>${esc(p.role || '')}</small></div></div>`).join('')}</div></div>`;
    }).join('');
    reveal(qs('#people'));
  }

  window.CLTO.ready.then(() => { stats(); timeline(); people(); });
})();
