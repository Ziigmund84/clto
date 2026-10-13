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

  /* Volant de badminton (motif récurrent) */
  const SHUTTLE = `<svg class="shuttle" viewBox="0 0 120 120" aria-hidden="true">
    <defs><linearGradient id="fth" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe9f6"/></linearGradient></defs>
    <g transform="rotate(-35 60 60)">
      <path d="M38 18 L82 18 L72 74 L48 74 Z" fill="url(#fth)" stroke="#0a2457" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M48 18 L54 74 M60 18 L60 74 M72 18 L66 74" stroke="#9fb5d4" stroke-width="2"/>
      <path d="M40 34 H80 M43 50 H77" stroke="#9fb5d4" stroke-width="2"/>
      <rect x="47" y="72" width="26" height="8" rx="2" fill="#e3a21a" stroke="#0a2457" stroke-width="2.5"/>
      <path d="M47 80 Q47 102 60 102 Q73 102 73 80 Z" fill="#ffffff" stroke="#0a2457" stroke-width="2.5"/>
    </g></svg>`;
  const SHUTTLE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><g transform="rotate(-30 12 12)"><path d="M7 3h10l-2 11H9z"/><path d="M9 14h6v2H9z"/><path d="M9 16q0 5 3 5t3-5"/></g></svg>';

  /* Terrain de badminton en plan, dessiné en lignes (proportions officielles 13,40 × 6,10 m) */
  const COURT = `<svg class="court-svg" viewBox="0 0 1340 610" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(670 305) rotate(-14) scale(1.25) translate(-670 -305)">
      <rect class="ln" x="0" y="0" width="1340" height="610"/>
      <line class="ln" x1="0" y1="46" x2="1340" y2="46"/><line class="ln" x1="0" y1="564" x2="1340" y2="564"/>
      <line class="ln" x1="76" y1="0" x2="76" y2="610"/><line class="ln" x1="1264" y1="0" x2="1264" y2="610"/>
      <line class="ln" x1="472" y1="0" x2="472" y2="610"/><line class="ln" x1="868" y1="0" x2="868" y2="610"/>
      <line class="ln" x1="0" y1="305" x2="472" y2="305"/><line class="ln" x1="868" y1="305" x2="1340" y2="305"/>
      <line class="ln ln-net" x1="670" y1="-40" x2="670" y2="650"/>
    </g></svg>`;

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
        el.innerHTML = `<div class="alert-band" role="status"><div class="wrap">${I.alert}<div><strong>${esc(alert.title || 'Information')}</strong> — ${esc(alert.text)}</div></div></div>`;
      }
    });
  }

  /* ---------- décors ---------- */
  function decorate() {
    qsa('[data-court]').forEach((el) => el.insertAdjacentHTML('afterbegin', COURT));
    qsa('[data-shuttle]').forEach((el) => el.insertAdjacentHTML('beforeend', SHUTTLE));
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

    /* lignes du terrain qui se tracent */
    qsa('.court-svg').forEach((svg) => {
      const lines = qsa('.ln', svg);
      lines.forEach((l) => { const len = l.getTotalLength ? l.getTotalLength() : 1500; l.style.strokeDasharray = l.classList.contains('ln-net') ? '' : len; l.style.strokeDashoffset = l.classList.contains('ln-net') ? 0 : len; });
      gsap.to(lines.filter((l) => !l.classList.contains('ln-net')), { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.08, delay: 0.2 });
      gsap.from(svg.querySelector('.ln-net'), { opacity: 0, duration: 1, delay: 1.4 });
    });

    /* titre d'en-tête de page : lettres qui rebondissent */
    qsa('.page-hero h1, [data-split]').forEach((h) => {
      if (h.closest('.hero')) return;
      const words = h.textContent.trim().split(/\s+/);
      h.innerHTML = words.map((w) => `<span style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.06em"><span class="w" style="display:inline-block">${esc(w)}</span></span>`).join(' ');
      gsap.from(qsa('.w', h), { yPercent: 110, rotate: 6, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.1 });
    });
    qsa('.page-hero .lead, .page-hero .btn-row').forEach((el, i) => gsap.from(el, { y: 24, opacity: 0, duration: 0.8, delay: 0.45 + i * 0.1, ease: 'power3.out' }));
    qsa('.page-hero .shuttle').forEach((s) => {
      gsap.fromTo(s, { x: -600, y: 160, rotate: -80, opacity: 0 }, { x: 0, y: 0, rotate: 0, opacity: 1, duration: 1.6, ease: 'power3.out', delay: 0.3 });
      gsap.to(s, { y: -18, rotate: 8, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.9 });
    });

    /* apparitions */
    document.documentElement.classList.add('reveal-ready');
    window.CLTO.reveal(document);

    /* compteurs */
    qsa('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count) || 0;
      const obj = { v: 0 };
      gsap.to(obj, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onUpdate: () => { el.textContent = Math.round(obj.v); } });
    });

    /* volant du bandeau d'appel */
    qsa('.cta-band .shuttle').forEach((s) => {
      gsap.fromTo(s, { x: -500, y: -200, rotate: -120 }, { x: 0, y: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: s.closest('.cta-band'), start: 'top bottom', end: 'center center', scrub: 1 } });
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
  window.CLTO = { sb, esc, fmtDate, fmtRange, parseDate, MONTHS, MONTHS_LONG, DAYS, initials, slugKind, qs, qsa, I, SHUTTLE, SHUTTLE_ICON, COURT, S, settings, reveal, reduceMotion, todayISO, MEDIA };

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
    scrollspy();
  })();
  window.CLTO.ready = ready;
})();
