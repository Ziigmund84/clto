/* CLTO Badminton — socle commun à toutes les pages publiques
   - client Supabase et petites fonctions utilitaires
   - en-tête, menu mobile et pied de page
   - blocs de texte modifiables depuis l'administration (attribut data-cms)
   - animations au défilement (GSAP + ScrollTrigger + Lenis) */
(function () {
  'use strict';
  const cfg = window.CLTO_CONFIG;
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MEDIA = cfg.supabaseUrl + '/storage/v1/object/public/' + cfg.bucket + '/import/';

  /* ---------- utilitaires ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const DAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const parseDate = (d) => { if (!d) return null; const [y, m, dd] = String(d).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, dd); };
  const fmtDate = (d) => { const x = parseDate(d); return x ? `${x.getDate()} ${MONTHS_LONG[x.getMonth()]} ${x.getFullYear()}` : ''; };
  const fmtRange = (a, b) => {
    const x = parseDate(a), y = parseDate(b);
    if (!y || +x === +y) return fmtDate(a);
    if (x.getMonth() === y.getMonth() && x.getFullYear() === y.getFullYear()) return `Du ${x.getDate()} au ${y.getDate()} ${MONTHS_LONG[y.getMonth()]} ${y.getFullYear()}`;
    return `Du ${x.getDate()} ${MONTHS_LONG[x.getMonth()]} au ${fmtDate(b)}`;
  };
  const initials = (n) => String(n || '').split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const slugKind = (k) => String(k || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '');
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  /* ---------- icônes ---------- */
  const I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h10M4 14h10"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 8.5h3V20H5zM6.5 3.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10 8.5h2.9v1.6c.4-.8 1.4-1.8 3.1-1.8 3.2 0 3.8 2.1 3.8 4.9V20h-3v-6.1c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V20h-3z"/></svg>',
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16l-1.5 12a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>'
  };

  /* Terrain de badminton (dimensions officielles en cm : 1340 × 610), incliné de 14° et zoomé,
     en fond de l'en-tête. Les lignes sont dessinées sans « non-scaling-stroke » : la longueur
     des tirets d'animation correspond ainsi exactement à celle des lignes, qui se tracent en entier. */
  function courtSVG(vertical) {
    /* en portrait (mobile), le terrain est dessiné debout pour rester lisible */
    const P = (x, y) => (vertical ? [y, x] : [x, y]);
    const ln = (x1, y1, x2, y2, cls = 'ln') => { const [a, b] = P(x1, y1), [c, d] = P(x2, y2); return `<line class="${cls}" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; };
    const [w, h] = vertical ? [610, 1340] : [1340, 610];
    return `<svg class="court-svg ${vertical ? 'court-v' : 'court-h'}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(${w / 2} ${h / 2}) rotate(-14) scale(${vertical ? 1.08 : 1.25}) translate(${-w / 2} ${-h / 2})">
      <rect class="ln" x="0" y="0" width="${w}" height="${h}"/>
      ${ln(0, 46, 1340, 46)}${ln(0, 564, 1340, 564)}
      ${ln(76, 0, 76, 610)}${ln(1264, 0, 1264, 610)}
      ${ln(472, 0, 472, 610)}${ln(868, 0, 868, 610)}
      ${ln(0, 305, 472, 305)}${ln(868, 305, 1340, 305)}
      ${ln(670, -40, 670, 650, 'ln-net')}
      <g class="court-life" data-v="${vertical ? 1 : 0}"></g>
    </g></svg>`;
  }
  const COURT = `<div class="court" aria-hidden="true">${courtSVG(false)}${courtSVG(true)}</div>`;

  /* ---------- navigation ---------- */
  const NAV = [
    ['club.html', 'Le club'],
    ['pratiquer.html', 'Créneaux'],
    ['publics.html', 'Nos publics'],
    ['interclubs.html', 'Interclubs'],
    ['agenda.html', 'Agenda'],
    ['actualites.html', 'Actus'],
    ['galerie.html', 'Galerie'],
    ['contact.html', 'Contact']
  ];
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isCurrent = (href) => href === current || (current === 'article.html' && href === 'actualites.html');

  const settings = {};
  async function loadSettings() {
    try {
      const { data } = await sb.from('clto_settings').select('key,value');
      (data || []).forEach((r) => { settings[r.key] = r.value; });
    } catch (e) { /* le site reste utilisable sans réglages */ }
    return settings;
  }
  const S = (path, fallback) => path.split('.').reduce((o, k) => (o && o[k] !== undefined && o[k] !== null ? o[k] : undefined), settings) ?? fallback;
  const logo = () => S('club.logo', MEDIA + 'logo-android-chrome-512x512.webp');

  function renderHeader() {
    const lightPage = document.body.dataset.header === 'light';
    const links = NAV.map(([h, l]) => `<li><a href="${h}"${isCurrent(h) ? ' aria-current="page"' : ''}>${l}</a></li>`).join('');
    const header = document.createElement('header');
    header.className = 'site-header' + (lightPage ? ' on-light' : '');
    header.innerHTML = `<div class="wrap">
      <a class="brand" href="index.html" aria-label="CLTO Badminton, accueil"><img src="${esc(logo())}" alt="" width="52" height="52"><span class="brand-name">CLTO Badminton<small>Orléans · depuis 1992</small></span></a>
      <nav class="main-nav" aria-label="Navigation principale"><ul>${links}</ul></nav>
      <div class="header-cta">
        <a class="btn btn-gold btn-small" href="adherer.html">S'inscrire</a>
        <a class="btn btn-ghost btn-small" data-link="helloasso" href="https://www.helloasso.com/associations/clto-badminton" target="_blank" rel="noopener">${I.shop} Boutique</a>
      </div>
      <button class="nav-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
    </div>`;
    const menu = document.createElement('div');
    menu.className = 'mobile-menu'; menu.id = 'mobile-menu';
    menu.innerHTML = `<nav aria-label="Menu mobile"><ul>${NAV.map(([h, l]) => `<li><a href="${h}"${isCurrent(h) ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}<li><a href="partenaires.html">Partenaires</a></li><li><a href="benevolat.html">S'engager</a></li></ul></nav>
      <div class="btn-row"><a class="btn btn-gold" href="adherer.html">S'inscrire au club</a><a class="btn btn-ghost" data-link="helloasso" href="https://www.helloasso.com/associations/clto-badminton" target="_blank" rel="noopener">Boutique</a></div>`;
    document.body.prepend(menu);
    document.body.prepend(header);
    const skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#main'; skip.textContent = 'Aller au contenu';
    document.body.prepend(skip);

    const toggle = qs('.nav-toggle', header);
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-solid', y > 40 || lightPage);
      const hide = y > 400 && y > lastY && !document.body.classList.contains('menu-open');
      header.classList.toggle('is-hidden', hide);
      document.body.classList.toggle('header-hidden', hide);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function renderFooter() {
    const f = document.createElement('footer');
    f.className = 'site-footer';
    const L = (k, d) => esc(S('links.' + k, d));
    f.innerHTML = `<div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="${esc(logo())}" alt="Logo du CLTO Badminton" width="84" height="84" loading="lazy">
          <p><strong style="color:#fff">${esc(S('club.fullname', 'Cercle Laïque des Tourelles Orléans Badminton'))}</strong><br>${esc(S('club.address', '1 Boulevard de Québec, 45000 Orléans'))}</p>
          <p><a href="tel:${esc(S('club.phone', '').replace(/\s/g, ''))}">${esc(S('club.phone', '06 65 29 63 72'))}</a><br><a href="mailto:${esc(S('club.email', 'contact@cltobadminton.fr'))}">${esc(S('club.email', 'contact@cltobadminton.fr'))}</a></p>
          <div class="socials">
            <a href="${L('facebook', '#')}" target="_blank" rel="noopener" aria-label="Facebook">${I.facebook}</a>
            <a href="${L('instagram', '#')}" target="_blank" rel="noopener" aria-label="Instagram">${I.instagram}</a>
            <a href="${L('linkedin', '#')}" target="_blank" rel="noopener" aria-label="LinkedIn">${I.linkedin}</a>
          </div>
        </div>
        <div><h3>Le club</h3><ul>
          <li><a href="club.html">Présentation</a></li><li><a href="club.html#histoire">Notre histoire</a></li><li><a href="club.html#palmares">Palmarès</a></li>
          <li><a href="club.html#equipe">Organigramme</a></li><li><a href="partenaires.html">Partenaires</a></li><li><a href="benevolat.html">Bénévolat et formations</a></li></ul></div>
        <div><h3>Jouer</h3><ul>
          <li><a href="pratiquer.html">Créneaux et gymnases</a></li><li><a href="publics.html">Jeunes, adultes, 60 ans et +</a></li><li><a href="agenda.html">Stages et événements</a></li>
          <li><a href="interclubs.html">Interclubs</a></li><li><a href="adherer.html">S'inscrire et tarifs</a></li><li><a href="adherer.html#documents">Documents</a></li></ul></div>
        <div><h3>Liens utiles</h3><ul>
          <li><a href="${L('compte_joueur', '#')}" target="_blank" rel="noopener">Compte joueur</a></li><li><a href="${L('helloasso', '#')}" target="_blank" rel="noopener">Boutique HelloAsso</a></li>
          <li><a href="${L('myffbad', '#')}" target="_blank" rel="noopener">MyFFBaD</a></li><li><a href="contact.html#faq">Questions fréquentes</a></li><li><a href="contact.html#avis">Donner votre avis</a></li></ul></div>
      </div>
      <div class="footer-word" aria-hidden="true">Allez le CLTO</div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} CLTO Badminton Orléans</span>
        <nav aria-label="Informations légales"><a href="mentions.html">Mentions légales</a><a href="mentions.html#confidentialite">Confidentialité</a><a href="admin/">Espace admin</a></nav></div>
    </div>`;
    document.body.append(f);
  }

  /* ---------- blocs de texte éditables ---------- */
  async function loadBlocks() {
    const els = qsa('[data-cms]');
    if (!els.length) return;
    const keys = [...new Set(els.map((e) => e.dataset.cms))];
    try {
      const { data } = await sb.from('clto_pages').select('slug,content').in('slug', keys);
      const map = Object.fromEntries((data || []).map((r) => [r.slug, r.content]));
      els.forEach((el) => { if (map[el.dataset.cms] != null && map[el.dataset.cms] !== '') el.innerHTML = map[el.dataset.cms]; });
    } catch (e) { /* on garde le texte par défaut */ }
  }

  /* Champs simples alimentés par les réglages : data-setting="club.phone" */
  function applySettings() {
    qsa('[data-setting]').forEach((el) => {
      const v = S(el.dataset.setting);
      if (v == null) return;
      if (el.dataset.settingAttr) el.setAttribute(el.dataset.settingAttr, (el.dataset.settingPrefix || '') + v);
      else if (el.dataset.settingHtml !== undefined) el.innerHTML = v;
      else el.textContent = v;
    });
    const alert = S('alert');
    qsa('[data-alert]').forEach((el) => {
      if (alert && alert.enabled && alert.text) {
        let closed = false; try { closed = sessionStorage.getItem('clto-alert') === alert.text; } catch (e) { /* stockage indisponible */ }
        if (closed) return;
        const onPlanning = current === 'pratiquer.html';
        el.innerHTML = `<div class="wrap"><div class="notice" role="status">
          <span class="notice-ico" aria-hidden="true">!</span>
          <div class="notice-body"><b>${esc(alert.title || 'Information')}</b><p class="is-clamped">${esc(alert.text)}</p><button class="notice-more" type="button" aria-expanded="false">Lire la suite</button></div>
          ${onPlanning ? '' : '<a class="btn btn-small" href="pratiquer.html#planning">Voir les créneaux</a>'}
          <button class="notice-close" type="button" aria-label="Masquer ce message">×</button></div></div>`;
        const more = el.querySelector('.notice-more'), para = el.querySelector('.notice-body p');
        requestAnimationFrame(() => { if (para.scrollHeight <= para.clientHeight + 2) more.hidden = true; });
        more.addEventListener('click', () => { const open = para.classList.toggle('is-clamped') === false; more.setAttribute('aria-expanded', String(open)); more.textContent = open ? 'Réduire' : 'Lire la suite'; window.ScrollTrigger && window.ScrollTrigger.refresh(); });
        el.querySelector('.notice-close').addEventListener('click', () => { try { sessionStorage.setItem('clto-alert', alert.text); } catch (e) { /* rien */ } el.innerHTML = ''; window.ScrollTrigger && window.ScrollTrigger.refresh(); });
      }
    });
  }

  /* ---------- décors ---------- */
  function decorate() {
    qsa('[data-court]').forEach((el) => el.insertAdjacentHTML('afterbegin', COURT));
  }

  /* ---------- animations ---------- */
  function animations() {
    if (!window.gsap || reduceMotion) {
      qsa('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
      return;
    }
    const { gsap } = window;
    gsap.registerPlugin(window.ScrollTrigger);
    if (window.MotionPathPlugin) gsap.registerPlugin(window.MotionPathPlugin);

    if (window.Lenis) {
      const lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', window.ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      qsa('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1 && qs(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -90 }); }
      }));
    }

    /* lignes du terrain qui se tracent, puis le filet apparaît */
    qsa('.court-svg').forEach((svg) => {
      const lines = qsa('.ln', svg);
      const lenOf = (l) => { const n = (k) => parseFloat(l.getAttribute(k)) || 0; return l.tagName === 'rect' ? 2 * (n('width') + n('height')) : Math.hypot(n('x2') - n('x1'), n('y2') - n('y1')); };
      lines.forEach((l) => { const len = lenOf(l) + 2; l.style.strokeDasharray = len; l.style.strokeDashoffset = len; });
      gsap.to(lines, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.08, delay: 0.2 });
      gsap.from(svg.querySelector('.ln-net'), { opacity: 0, duration: 1, delay: 1.4 });
    });

    /* titre d'en-tête de page : lettres qui rebondissent */
    qsa('.page-hero h1, [data-split]').forEach((h) => {
      if (h.closest('.hero')) return;
      const words = h.textContent.trim().split(/\s+/);
      h.innerHTML = words.map((w) => `<span class="split-word"><span class="w" style="display:inline-block">${esc(w)}</span></span>`).join(' ');
      gsap.from(qsa('.w', h), { yPercent: 110, rotate: 6, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.1 });
    });
    qsa('.page-hero .lead, .page-hero .btn-row').forEach((el, i) => gsap.from(el, { y: 24, opacity: 0, duration: 0.8, delay: 0.45 + i * 0.1, ease: 'power3.out' }));

    /* apparitions */
    document.documentElement.classList.add('reveal-ready');
    window.CLTO.reveal(document);

    /* compteurs */
    qsa('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count) || 0;
      const obj = { v: 0 };
      gsap.to(obj, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onUpdate: () => { el.textContent = Math.round(obj.v); } });
    });
  }

  /* Vie sur le terrain : un échange simulé. Les volants tombent d'un côté puis de l'autre ;
     un volant dehors est marqué « OUT ». Un petit tableau tient le score d'un match en 15 points,
     que le CLTO finit toujours par gagner. */
  function courtLife() {
    if (reduceMotion) return;
    const NS = 'http://www.w3.org/2000/svg';
    qsa('[data-court-life]').forEach((host) => {
      const board = document.createElement('div');
      board.className = 'match-board';
      board.setAttribute('aria-hidden', 'true');
      board.innerHTML = '<span class="mb-team">CLTO</span><b class="mb-a">0</b><i>–</i><b class="mb-b">0</b><span class="mb-team">Visiteur</span><em class="mb-msg"></em>';
      host.appendChild(board);
      const A = board.querySelector('.mb-a'), B = board.querySelector('.mb-b'), MSG = board.querySelector('.mb-msg');
      const layers = qsa('.court-life', host);
      const layer = () => layers.find((l) => l.closest('svg').getBoundingClientRect().width > 0);
      const wait = (ms) => new Promise((res) => setTimeout(res, ms));
      const rnd = (a, b) => a + Math.random() * (b - a);
      /* coordonnées du terrain (cm) -> point SVG, selon l'orientation */
      const P = (l, x, y) => (l.dataset.v === '1' ? [y, x] : [x, y]);
      /* le point est-il visible à l'écran (le terrain est zoomé et déborde) ? */
      const onScreen = (l, x, y) => {
        const svg = l.closest('svg'), m = l.getScreenCTM(); if (!m) return false;
        const [px, py] = P(l, x, y); const pt = svg.createSVGPoint(); pt.x = px; pt.y = py;
        const q = pt.matrixTransform(m), r = host.getBoundingClientRect();
        return q.x > r.left + 30 && q.x < r.right - 30 && q.y > r.top + 90 && q.y < r.bottom - 60;
      };
      const pick = (l, gen) => { for (let i = 0; i < 30; i++) { const c = gen(); if (onScreen(l, c[0], c[1])) return c; } return null; };
      const add = (l, html, life) => { const g = document.createElementNS(NS, 'g'); g.innerHTML = html; const el = g.firstElementChild; l.appendChild(el); setTimeout(() => el.remove(), life); };
      const impact = (l, x, y, out) => {
        const [px, py] = P(l, x, y);
        add(l, `<g class="impact${out ? ' is-out' : ''}" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><circle class="imp-ring" r="11"/><circle class="imp-dot" r="4"/>${out ? '<text class="imp-out" x="16" y="6">OUT</text>' : ''}</g>`, out ? 2600 : 1700);
      };
      /* côté 0 = CLTO (gauche, x < 670), côté 1 = visiteur (droite) */
      const inside = (side) => () => [side ? rnd(720, 1240) : rnd(100, 620), rnd(70, 540)];
      const outside = (side) => () => {
        const k = Math.random();
        const x = side ? rnd(760, 1220) : rnd(120, 580);
        if (k < 0.5) return [x, Math.random() < 0.5 ? rnd(-55, -18) : rnd(628, 665)];   /* sur le côté */
        return [side ? rnd(1355, 1400) : rnd(-60, -15), rnd(80, 530)];                   /* trop long */
      };
      let a = 0, b = 0;
      const show = () => { A.textContent = a; B.textContent = b; };
      const point = (toClto) => {
        if (toClto) a++; else b++;
        show();
        board.classList.remove('is-flash'); void board.offsetWidth; board.classList.add('is-flash');
      };
      (async () => {
        await wait(2400);
        let server = 0;
        for (;;) {
          const l = layer();
          if (!l || document.hidden || host.getBoundingClientRect().bottom < 0) { await wait(1000); continue; }
          /* le CLTO gagne toujours : on garde un avantage et on ne laisse jamais le visiteur atteindre 15 */
          let cltoWins = Math.random() < (b >= a ? 0.68 : 0.55);
          if (b === 14 || (b >= 12 && a < b)) cltoWins = true;
          const shots = 3 + Math.floor(Math.random() * 7);
          const outEnd = Math.random() < 0.4;
          let side = 1 - server;        /* le service part de chez le serveur et tombe en face */
          for (let i = 0; i < shots; i++) {
            const last = i === shots - 1;
            if (last) {
              /* dernier volant : gagnant chez le perdant, ou dehors côté du gagnant (faute du perdant) */
              const loser = cltoWins ? 1 : 0;
              const c = outEnd ? pick(l, outside(1 - loser)) : pick(l, inside(loser));
              if (c) impact(l, c[0], c[1], outEnd); else { const d = pick(l, inside(loser)); if (d) impact(l, d[0], d[1], false); }
              break;
            }
            const c = pick(l, inside(side)); if (c) impact(l, c[0], c[1], false);
            side = 1 - side;
            await wait(rnd(650, 950));
          }
          await wait(700);
          point(cltoWins);
          server = cltoWins ? 0 : 1;
          if (a >= 15) {
            MSG.textContent = `Victoire du CLTO ${a}–${b} !`;
            board.classList.add('is-win');
            await wait(4200);
            board.classList.remove('is-win'); MSG.textContent = '';
            a = 0; b = 0; show(); server = 0;
          }
          await wait(rnd(1300, 2000));
        }
      })();
    });
  }

  /* Révélation des éléments marqués data-reveal (aussi appelée après un rendu dynamique) */
  function reveal(root) {
    if (!window.gsap || reduceMotion) { qsa('[data-reveal]', root).forEach((el) => { el.style.opacity = 1; }); return; }
    const { gsap } = window;
    qsa('[data-reveal]:not(.is-revealed)', root).forEach((el) => {
      const type = el.dataset.reveal;
      if (type === 'stagger' && !el.children.length) return; /* contenu pas encore chargé */
      el.classList.add('is-revealed');
      const from = type === 'left' ? { x: -60 } : type === 'right' ? { x: 60 } : type === 'zoom' ? { scale: 0.92 } : { y: 46 };
      if (type === 'stagger') {
        gsap.set(el, { opacity: 1 });
        gsap.from(el.children, { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      } else {
        gsap.fromTo(el, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      }
    });
    window.ScrollTrigger && window.ScrollTrigger.refresh();
  }

  /* Sous-navigation : surligne la section visible */
  function scrollspy() {
    const links = qsa('.subnav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((l) => l.classList.remove('is-active'));
          const a = map.get(en.target.id);
          if (a) { a.classList.add('is-active'); a.scrollIntoView({ block: 'nearest', inline: 'center' }); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* Accès public aux fonctions communes */
  window.CLTO = { sb, esc, fmtDate, fmtRange, parseDate, MONTHS, MONTHS_LONG, DAYS, initials, slugKind, qs, qsa, I, COURT, S, settings, reveal, reduceMotion, todayISO, MEDIA };

  /* Démarrage */
  const ready = (async () => {
    decorate();
    renderHeader();
    await loadSettings();
    renderFooter();
    qsa('.site-header .brand img, .mobile-menu img').forEach((i) => { i.src = logo(); });
    qsa('a[data-link]').forEach((a) => { const v = S('links.' + a.dataset.link); if (v) a.href = v; });
    applySettings();
    await loadBlocks();
    animations();
    courtLife();
    scrollspy();
  })();
  window.CLTO.ready = ready;
})();
