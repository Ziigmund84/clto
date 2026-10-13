/* Page d'accueil */
(function () {
  const { sb, esc, qs, qsa, S, I, fmtDate, parseDate, MONTHS, slugKind, reveal, reduceMotion, todayISO, SHUTTLE_ICON, initials } = window.CLTO;

  /* Bandeau défilant (rempli tout de suite pour éviter un saut) */
  const words = ['Jeu libre', 'Cours encadrés', 'Stages', 'Interclubs', 'Baby-Bad', 'Tournois', 'Vieilles Plumes', 'Convivialité'];
  const run = words.map((w) => `<span>${w}${SHUTTLE_ICON}</span>`).join('');
  qs('#ticker').innerHTML = run + run;

  /* Animation d'ouverture : les lignes du titre montent, le volant traverse l'écran */
  function heroIntro() {
    if (!window.gsap || reduceMotion) return;
    const { gsap } = window;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('#hero-title .line > span', { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.11 }, 0.15)
      .from('.hero-badge', { y: -20, opacity: 0, duration: 0.8 }, 0.1)
      .from('.hero .lead', { y: 30, opacity: 0, duration: 0.9 }, 0.55)
      .from('.hero-ctas > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.65)
      .from('.hero-photo.p1', { y: 120, rotate: -14, opacity: 0, duration: 1.3 }, 0.35)
      .from('.hero-photo.p2', { x: 140, rotate: 22, opacity: 0, duration: 1.3 }, 0.5)
      .from('.hero-photo.p3', { x: -100, rotate: -10, opacity: 0, duration: 1.3 }, 0.6)
      .from('.hero-tag', { scale: 0, rotate: -40, duration: 0.9, ease: 'back.out(2.2)' }, 1.1);

    const shuttle = qs('#hero-shuttle .shuttle');
    if (shuttle && window.MotionPathPlugin) {
      const W = window.innerWidth, H = window.innerHeight;
      /* trajectoire d'un dégagé : on part hors écran à gauche, on monte, on retombe près des photos */
      tl.fromTo(shuttle, { opacity: 1 }, {
        duration: 2.1, ease: 'power1.inOut',
        motionPath: { path: [{ x: 0, y: H * 0.25 }, { x: W * 0.32, y: -H * 0.18 }, { x: W * 0.62, y: -H * 0.05 }, { x: W * 0.8, y: H * 0.18 }], curviness: 1.4, autoRotate: 90 }
      }, 0.2);
      tl.to(shuttle, { y: '-=14', rotate: '+=10', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      /* au défilement, le volant poursuit sa course vers le tableau d'affichage */
      gsap.to('#hero-shuttle', { y: () => window.innerHeight * 0.9, x: () => -window.innerWidth * 0.35, rotate: 140, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    }
    /* parallaxe des photos */
    gsap.to('.hero-photo.p1', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-photo.p2', { yPercent: -28, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-photo.p3', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-grid', { opacity: 0.25, y: 80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });
  }

  /* Panneaux des publics : défilement horizontal épinglé sur grand écran */
  function publicsScroll() {
    if (!window.gsap || reduceMotion || window.innerWidth < 761) return;
    const { gsap } = window;
    const track = qs('#publics-track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '#publics', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    qsa('.pub-card img', track).forEach((img) => gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '#publics', start: 'top top', end: () => '+=' + distance(), scrub: true } }));
  }

  function hero() {
    const h = S('hero') || {};
    if (h.title) {
      const lines = String(h.title).split('|').map((s) => s.trim()).filter(Boolean);
      if (lines.length > 1) {
        qs('#hero-title').setAttribute('aria-label', lines.join(' '));
        qs('#hero-title').innerHTML = lines.map((l, i) => `<span class="line"><span${i === lines.length - 1 ? ' class="gold"' : ''}>${esc(l)}</span></span>`).join('');
      }
    }
    if (h.text) qs('[data-hero-text]').textContent = h.text;
    ['image', 'image2', 'image3'].forEach((k) => { if (h[k]) qs(`[data-hero-img="${k}"]`).src = h[k]; });
  }

  function scoreboard() {
    const st = S('stats') || {};
    const main = st.main || [];
    qs('#scoreboard').innerHTML = main.map((s) => `<div class="score"><div class="score-num"><span data-count="${esc(s.value)}">${esc(s.value)}</span>${s.suffix ? `<small>${esc(s.suffix)}</small>` : ''}</div><div class="score-label">${esc(s.label)}</div></div>`).join('');
    qs('#score-more').innerHTML = (st.more || []).map((s) => `<span><b>${esc(s.value)}</b>${esc(s.label)}</span>`).join('');
    if (window.gsap && !reduceMotion) {
      qsa('#scoreboard [data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count) || 0; const o = { v: 0 }; el.textContent = '0';
        window.gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
      });
    }
  }

  async function news() {
    const { data } = await sb.from('clto_posts').select('slug,title,excerpt,cover,categories,date,featured').eq('published', true).order('featured', { ascending: false }).order('date', { ascending: false }).limit(3);
    const box = qs('#home-news');
    if (!data || !data.length) { box.innerHTML = '<p class="empty">Aucune actualité pour le moment.</p>'; return; }
    box.innerHTML = data.map((p) => `<a class="news-card" href="article.html?a=${encodeURIComponent(p.slug)}" data-reveal>
      <div class="news-img">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : ''}</div>
      <div class="news-meta">${(p.categories || []).slice(0, 2).map((c) => `<span class="chip">${esc(c)}</span>`).join('')}<span>${fmtDate(p.date)}</span></div>
      <h3>${esc(p.title)}</h3><p>${esc(p.excerpt || '')}</p></a>`).join('');
    reveal(box);
  }

  async function agenda() {
    const { data } = await sb.from('clto_events').select('*').eq('published', true).or(`date_end.gte.${todayISO()},and(date_end.is.null,date_start.gte.${todayISO()})`).order('date_start').limit(4);
    const box = qs('#home-agenda');
    if (!data || !data.length) { box.innerHTML = '<p class="empty">Le prochain programme arrive bientôt.</p>'; return; }
    box.innerHTML = data.map((e) => {
      const d = parseDate(e.date_start);
      return `<a class="agenda-item" href="agenda.html#ev-${e.id}" data-reveal>
        <div class="date-tile k-${slugKind(e.kind)}"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
        <div><span class="chip chip-gold">${esc(e.kind)}</span><h3 style="margin-top:6px">${esc(e.title)}</h3>
        <div class="meta">${e.location ? `<span>${I.pin}${esc(e.location)}</span>` : ''}${e.time_text ? `<span>${I.clock}${esc(e.time_text)}</span>` : ''}</div></div>
        <span class="link-arrow" aria-hidden="true"></span></a>`;
    }).join('');
    reveal(box);
  }

  async function teams() {
    const { data } = await sb.from('clto_teams').select('*').order('position');
    const abbr = (d) => { const s = String(d || '').toLowerCase(); if (s.startsWith('nationale')) return 'N' + (s.match(/\d/) || [''])[0]; if (s.startsWith('pré')) return 'PN'; if (s.startsWith('régionale')) return 'R' + (s.match(/\d/) || [''])[0]; if (s.startsWith('départementale')) return 'D' + (s.match(/\d/) || [''])[0]; return '•'; };
    qs('#home-ladder').innerHTML = (data || []).map((t) => `<a class="rung" href="interclubs.html"><span class="lvl">${abbr(t.division)}</span><div><b>${esc(t.name)}</b><small>${esc(t.division || '')}</small></div><span aria-hidden="true">${I.arrow.replace('<svg', '<svg width="22" height="22"')}</span></a>`).join('');
    const first = (data || []).find((t) => t.image);
    if (first) qs('#home-team-img').src = first.image;
    reveal(qs('#home-ladder').parentElement);
  }

  function president() {
    const p = S('president') || {};
    if (p.message) qs('#president-msg').innerHTML = p.message;
    if (p.name) { qs('#president-name').textContent = p.name; qs('#president-avatar').textContent = initials(p.name); }
    if (p.role) qs('#president-role').textContent = p.role;
    if (p.photo) qs('#president-avatar').innerHTML = `<img src="${esc(p.photo)}" alt="">`;
    const btn = qs('#president-more'); const body = qs('#president-msg');
    btn.addEventListener('click', () => {
      const open = body.classList.toggle('is-clamped');
      btn.setAttribute('aria-expanded', String(!open));
      btn.textContent = open ? 'Lire tout le message' : 'Réduire';
      window.ScrollTrigger && window.ScrollTrigger.refresh();
    });
    const labels = (S('labels') || {}).items || [];
    qs('#home-labels').innerHTML = labels.map((l) => `<div class="label-item"><img src="${esc(l.image)}" alt="" loading="lazy"><span>${esc(l.name)}</span></div>`).join('');
  }

  async function partners() {
    const { data } = await sb.from('clto_partners').select('name,logo,url').order('kind').order('position');
    const items = (data || []).filter((p) => p.logo).map((p) => `<img src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy">`).join('');
    qs('#logo-track').innerHTML = items + items.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');
  }

  window.CLTO.ready.then(async () => {
    hero();
    heroIntro();
    scoreboard();
    president();
    publicsScroll();
    await Promise.all([news(), agenda(), teams(), partners()]);
    reveal(document);
  });
})();
