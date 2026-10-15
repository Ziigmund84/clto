/* Page d'accueil */
(function () {
  const { sb, esc, qs, qsa, S, I, fmtDate, parseDate, MONTHS, slugKind, reveal, reduceMotion, todayISO, initials } = window.CLTO;

  /* Bandeau défilant (rempli tout de suite pour éviter un saut) */
  const words = ['Jeu libre', 'Cours encadrés', 'Stages', 'Interclubs', 'Baby-Bad', 'Tournois', 'Vieilles Plumes', 'Convivialité'];
  const run = words.map((w) => `<span>${w}<i class="tick-dot"></i></span>`).join('');
  qs('#ticker').innerHTML = run + run;

  /* Animation d'ouverture : les lignes du titre montent, le diaporama s'ouvre en balayage */
  function heroIntro() {
    if (!window.gsap || reduceMotion) return;
    const { gsap } = window;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('#hero-title .line > span', { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.11 }, 0.15)
      .from('.hero-ctas > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.65)
      .from('#show-frame .slide', { x: 260, y: 40, rotate: 18, opacity: 0, duration: 1.2, stagger: { each: 0.12, from: 'end' }, clearProps: 'transform,opacity' }, 0.45)
      .from('.show-ctrl', { opacity: 0, y: 14, duration: 0.7 }, 1.3);
    gsap.to('.hero-show', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-grid', { opacity: 0.25, y: 80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });
  }

  /* Diaporama du héros : un paquet de cartes photo. La carte de devant s'envole,
     la suivante avance ; défilement automatique, flèches, barres, glisser du doigt. */
  const DELAY = 6000;
  function slideshow() {
    const frame = qs('#show-frame'), bars = qs('#show-bars');
    const h = S('hero') || {};
    let slides = Array.isArray(h.slides) ? h.slides.filter((x) => x && x.image) : [];
    if (!slides.length) slides = ['image', 'image2', 'image3'].filter((k) => h[k]).map((k) => ({ image: h[k] }));
    if (slides.length) {
      frame.innerHTML = slides.map((sl, i) => `<figure class="slide" aria-roledescription="diapositive" aria-label="${i + 1} sur ${slides.length}">
        <img src="${esc(sl.image)}" alt="" ${i > 1 ? 'loading="lazy"' : ''}>
        ${sl.title || sl.label ? `<figcaption>${sl.label ? `<span class="slide-label">${esc(sl.label)}</span>` : ''}${sl.title ? (sl.link ? `<a href="${esc(sl.link)}">${esc(sl.title)}</a>` : `<b>${esc(sl.title)}</b>`) : ''}</figcaption>` : ''}</figure>`).join('');
    }
    const figs = qsa('.slide', frame);
    const N = figs.length;
    const ctrl = qs('.show-ctrl');
    if (N < 2) { if (ctrl) ctrl.hidden = true; figs.forEach((f) => { f.dataset.pos = 0; }); return; }
    bars.innerHTML = figs.map((_, i) => `<button type="button" aria-label="Voir la photo ${i + 1}"><i></i></button>`).join('');
    const btns = qsa('button', bars);
    const count = qs('#show-count');
    const glow = qs('#show-glow');
    let cur = 0, timer = null, paused = false, startedAt = 0, remaining = DELAY;

    const layout = (leaving = -1, dir = 1) => {
      figs.forEach((f, i) => {
        const rel = (i - cur + N) % N;
        f.dataset.pos = rel < 3 ? rel : 'hidden';
        f.classList.toggle('is-front', rel === 0);
        f.setAttribute('aria-hidden', String(rel !== 0));
        f.querySelectorAll('a').forEach((a) => { a.tabIndex = rel === 0 ? 0 : -1; });
        f.classList.remove('is-leaving', 'is-leaving-back');
      });
      if (leaving >= 0) {
        const lf = figs[leaving];
        lf.classList.add(dir > 0 ? 'is-leaving' : 'is-leaving-back');
        setTimeout(() => lf.classList.remove('is-leaving', 'is-leaving-back'), 750);
      }
      btns.forEach((b, i) => { b.classList.toggle('is-active', i === cur); b.classList.toggle('is-done', i < cur); });
      if (count) count.innerHTML = `<b>${String(cur + 1).padStart(2, '0')}</b> / ${String(N).padStart(2, '0')}`;
      if (glow) glow.style.backgroundImage = `url("${figs[cur].querySelector('img').src}")`;
    };
    const show = (n, dir) => {
      const next = (n + N) % N;
      if (next === cur) return;
      const prev = cur; cur = next;
      layout(prev, dir ?? (n > prev ? 1 : -1));
      restart();
    };
    const tick = () => show(cur + 1, 1);
    const restart = () => { clearTimeout(timer); remaining = DELAY; startedAt = Date.now(); bars.style.setProperty('--dur', DELAY + 'ms'); bars.classList.remove('is-paused'); const a = bars.querySelector('.is-active i'); if (a) { a.style.animation = 'none'; void a.offsetWidth; a.style.animation = ''; } if (!paused && !reduceMotion) timer = setTimeout(tick, DELAY); };
    const pause = () => { if (paused) return; paused = true; clearTimeout(timer); remaining -= Date.now() - startedAt; bars.classList.add('is-paused'); };
    const resume = () => { if (!paused) return; paused = false; startedAt = Date.now(); bars.classList.remove('is-paused'); if (!reduceMotion) timer = setTimeout(tick, Math.max(300, remaining)); };

    btns.forEach((b, i) => b.addEventListener('click', () => show(i)));
    qs('#show-prev').addEventListener('click', () => show(cur - 1, -1));
    qs('#show-next').addEventListener('click', () => show(cur + 1, 1));
    frame.addEventListener('click', (e) => { const f = e.target.closest('.slide'); if (f && !f.classList.contains('is-front') && !e.target.closest('a')) show(figs.indexOf(f), 1); });
    const box = qs('#hero-show');
    box.addEventListener('mouseenter', pause); box.addEventListener('mouseleave', resume);
    box.addEventListener('focusin', pause); box.addEventListener('focusout', resume);
    box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1, 1); if (e.key === 'ArrowLeft') show(cur - 1, -1); });
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

    /* la carte de devant suit légèrement la souris */
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
      frame.addEventListener('mousemove', (e) => {
        const r = frame.getBoundingClientRect();
        frame.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg');
        frame.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + 'deg');
      });
      frame.addEventListener('mouseleave', () => { frame.style.setProperty('--rx', '0deg'); frame.style.setProperty('--ry', '0deg'); });
    }
    /* glisser du doigt : la carte suit le doigt puis s'envole */
    let x0 = null, dx = 0;
    frame.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; dx = 0; pause(); }, { passive: true });
    frame.addEventListener('touchmove', (e) => { if (x0 == null) return; dx = e.touches[0].clientX - x0; figs[cur].style.setProperty('--drag', dx + 'px'); }, { passive: true });
    frame.addEventListener('touchend', () => {
      if (x0 == null) return;
      figs[cur].style.removeProperty('--drag');
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      x0 = null; resume();
    });
    if (reduceMotion) bars.classList.add('is-paused');
    layout();
    restart();
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
    slideshow();
    heroIntro();
    scoreboard();
    president();
    publicsScroll();
    await Promise.all([news(), agenda(), teams(), partners()]);
    reveal(document);
  });
})();
