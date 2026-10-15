/* CLTO Badminton — espace d'administration
   Connexion Supabase Auth ; seules les personnes inscrites dans clto_admins peuvent modifier les données (règles RLS). */
(function () {
  'use strict';
  const cfg = window.CLTO_CONFIG;
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const BUCKET = cfg.bucket;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (d) => { if (!d) return ''; const [y, m, j] = String(d).slice(0, 10).split('-'); return `${j}/${m}/${y}`; };
  const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const strip = (h) => { const d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  const DAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(t._h); t._h = setTimeout(() => { t.className = 'toast'; }, err ? 5000 : 2600);
  }

  /* =====================================================================
     Définition des collections gérées
  ===================================================================== */
  const KINDS = ['Stage', 'Événement', 'Tournoi', 'Interclubs', 'Compétition'];
  const COL = {
    posts: {
      table: 'clto_posts', label: 'Actualités', one: 'un article', group: 'Contenus', order: [['date', false]], search: ['title'],
      defaults: () => ({ published: true, date: today(), categories: [] }),
      columns: [['cover', '', 'img'], ['title', 'Titre'], ['categories', 'Catégories', 'tags'], ['date', 'Date', 'date'], ['featured', 'À la une', 'bool'], ['published', 'En ligne', 'bool']],
      fields: [
        { k: 'title', l: 'Titre', req: true },
        { row: [{ k: 'date', l: 'Date de publication', t: 'date' }, { k: 'categories', l: 'Catégories', t: 'tags', hint: 'Séparées par des virgules : Vie du club, Compétitions, Stages, Événements, Créneaux' }] },
        { k: 'cover', l: 'Image de couverture', t: 'image' },
        { k: 'excerpt', l: 'Résumé', t: 'textarea', hint: 'Affiché dans les listes. Laissez vide pour le générer depuis le texte.' },
        { k: 'content', l: 'Texte de l\'article', t: 'html' },
        { row: [{ k: 'featured', l: 'Mettre à la une', t: 'bool' }, { k: 'published', l: 'Publié sur le site', t: 'bool' }] },
        { k: 'slug', l: 'Adresse de la page (slug)', hint: 'Généré automatiquement depuis le titre si vide.' }
      ],
      before: (v) => { if (!v.slug) v.slug = slugify(v.title) + '-' + Date.now().toString(36).slice(-4); if (!v.excerpt) v.excerpt = strip(v.content).slice(0, 220); }
    },
    events: {
      table: 'clto_events', label: 'Agenda et stages', one: 'un rendez-vous', group: 'Contenus', order: [['date_start', false]], search: ['title', 'location'],
      defaults: () => ({ published: true, kind: 'Événement', date_start: today() }),
      filter: { k: 'kind', l: 'Tous les types', options: KINDS },
      columns: [['image', '', 'img'], ['title', 'Titre'], ['kind', 'Type', 'pill'], ['date_start', 'Début', 'date'], ['location', 'Lieu'], ['published', 'En ligne', 'bool']],
      fields: [
        { k: 'title', l: 'Titre', req: true },
        { row: [{ k: 'kind', l: 'Type', t: 'select', options: KINDS }, { k: 'audience', l: 'Public', hint: 'Ex. : Adultes, tous niveaux' }] },
        { row: [{ k: 'date_start', l: 'Date de début', t: 'date', req: true }, { k: 'date_end', l: 'Date de fin', t: 'date', hint: 'Facultatif' }] },
        { row: [{ k: 'time_text', l: 'Horaires', hint: 'Ex. : 19h – 22h' }, { k: 'location', l: 'Lieu' }] },
        { k: 'price', l: 'Tarif', hint: 'Ex. : 15 € – 35 €' },
        { k: 'image', l: 'Affiche ou visuel', t: 'image' },
        { k: 'description', l: 'Description', t: 'html' },
        { row: [{ k: 'link', l: 'Lien (inscription, bénévoles…)', t: 'url' }, { k: 'cta_label', l: 'Texte du bouton', hint: 'Ex. : S\'inscrire sur HelloAsso' }] },
        { k: 'published', l: 'Publié sur le site', t: 'bool' }
      ]
    },
    slots: {
      table: 'clto_slots', label: 'Créneaux', one: 'un créneau', group: 'Le club', order: [['day', true], ['start_time', true]], search: ['label', 'gym'],
      defaults: () => ({ day: 1, kind: 'Entraînement', audience: 'Adultes', start_time: '18:00', end_time: '20:00' }),
      filter: { k: 'day', l: 'Tous les jours', options: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ v: d, l: DAYS[d] })) },
      columns: [['day', 'Jour', 'day'], ['start_time', 'Début', 'time'], ['end_time', 'Fin', 'time'], ['label', 'Intitulé'], ['gym', 'Gymnase'], ['kind', 'Type', 'pill'], ['is_full', 'Complet', 'bool']],
      fields: [
        { k: 'label', l: 'Intitulé', req: true, hint: 'Ex. : Entraînement Adultes Perfectionnement' },
        { row: [{ k: 'day', l: 'Jour', t: 'select', options: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ v: d, l: DAYS[d] })), num: true }, { k: 'start_time', l: 'Début', t: 'time', req: true }, { k: 'end_time', l: 'Fin', t: 'time', req: true }], cls: 'f-row3' },
        { row: [{ k: 'gym', l: 'Gymnase', t: 'select', source: 'gyms' }, { k: 'kind', l: 'Type de séance', t: 'select', options: ['Entraînement', 'Jeu libre'] }] },
        { row: [{ k: 'audience', l: 'Public', t: 'select', options: ['Jeunes', 'Adultes', 'Compétiteurs', 'Tous'] }, { k: 'level', l: 'Niveau', t: 'select', options: ['', 'Débutant', 'Intermédiaire', 'Perfectionnement', 'Élite'] }] },
        { k: 'coach', l: 'Entraîneur', hint: 'Facultatif' },
        { k: 'notes', l: 'Remarque affichée', hint: 'Ex. : Annulé le 11 novembre' },
        { k: 'is_full', l: 'Créneau complet', t: 'bool' }
      ]
    },
    gyms: {
      table: 'clto_gyms', label: 'Gymnases', one: 'un gymnase', group: 'Le club', order: [['position', true]], sortable: true,
      columns: [['name', 'Nom'], ['address', 'Adresse'], ['city', 'Ville'], ['courts', 'Terrains']],
      fields: [
        { k: 'name', l: 'Nom', req: true },
        { row: [{ k: 'address', l: 'Adresse' }, { k: 'city', l: 'Code postal et ville' }] },
        { row: [{ k: 'courts', l: 'Nombre de terrains', t: 'number' }, { k: 'lat', l: 'Latitude', t: 'number', step: 'any' }, { k: 'lng', l: 'Longitude', t: 'number', step: 'any' }], cls: 'f-row3' },
        { k: 'geo', l: '', t: 'geocode' },
        { k: 'image', l: 'Photo', t: 'image' }
      ]
    },
    prices: {
      table: 'clto_prices', label: 'Tarifs', one: 'un tarif', group: 'Le club', order: [['category', true], ['position', true]], sortable: true, sortGroup: 'category',
      columns: [['category', 'Catégorie', 'pill'], ['label', 'Formule'], ['price', 'Prix'], ['details', 'Détails']],
      fields: [
        { k: 'category', l: 'Catégorie', req: true, hint: 'Ex. : Licences, Cours collectifs Jeunes, Cours collectifs Adultes, Cours individuels' },
        { row: [{ k: 'label', l: 'Formule', req: true }, { k: 'price', l: 'Prix', hint: 'Ex. : 195 € ou + 100 €' }] },
        { k: 'details', l: 'Détails' }
      ]
    },
    teams: {
      table: 'clto_teams', label: 'Équipes interclubs', one: 'une équipe', group: 'Le club', order: [['position', true]], sortable: true,
      columns: [['image', '', 'img'], ['name', 'Équipe'], ['division', 'Division'], ['captain', 'Capitaine']],
      fields: [
        { row: [{ k: 'name', l: 'Nom', req: true }, { k: 'division', l: 'Division et poule', hint: 'Ex. : Nationale 2 – Poule 3' }] },
        { row: [{ k: 'captain', l: 'Capitaine' }, { k: 'link', l: 'Lien résultats (Icbad)', t: 'url' }] },
        { k: 'image', l: 'Photo d\'équipe', t: 'image' },
        { k: 'description', l: 'Présentation', t: 'textarea' }
      ]
    },
    people: {
      table: 'clto_people', label: 'Organigramme', one: 'une personne', group: 'Le club', order: [['grp', true], ['position', true]], sortable: true, sortGroup: 'grp', search: ['name', 'role'],
      filter: { k: 'grp', l: 'Tous les groupes', options: ["Conseil d'administration", 'Commissions', 'Salariés', 'Services civiques', 'Entraîneurs bénévoles', 'Ouvreurs'] },
      columns: [['photo', '', 'img'], ['name', 'Nom'], ['role', 'Rôle'], ['grp', 'Groupe', 'pill']],
      fields: [
        { row: [{ k: 'name', l: 'Nom', req: true }, { k: 'role', l: 'Rôle' }] },
        { k: 'grp', l: 'Groupe', t: 'select', options: ["Conseil d'administration", 'Commissions', 'Salariés', 'Services civiques', 'Entraîneurs bénévoles', 'Ouvreurs'], free: true },
        { k: 'photo', l: 'Photo', t: 'image' }
      ]
    },
    partners: {
      table: 'clto_partners', label: 'Partenaires', one: 'un partenaire', group: 'Le club', order: [['kind', true], ['position', true]], sortable: true, sortGroup: 'kind',
      columns: [['logo', '', 'img'], ['name', 'Nom'], ['kind', 'Catégorie', 'pill'], ['url', 'Site']],
      fields: [
        { k: 'name', l: 'Nom', req: true },
        { k: 'kind', l: 'Catégorie', t: 'select', options: ['Partenaires sportifs', 'Partenaires privés', 'Partenaires institutionnels', 'Partenaires associatifs'] },
        { k: 'logo', l: 'Logo', t: 'image' },
        { k: 'url', l: 'Site internet', t: 'url' }
      ]
    },
    gallery: {
      table: 'clto_gallery', label: 'Galerie', one: 'un album', group: 'Contenus', order: [['date', false]],
      columns: [['cover', '', 'img'], ['title', 'Album'], ['category', 'Catégorie', 'pill'], ['date', 'Date', 'date']],
      fields: [
        { k: 'title', l: 'Titre de l\'album', req: true },
        { row: [{ k: 'date', l: 'Date', t: 'date' }, { k: 'category', l: 'Catégorie', hint: 'Ex. : Interclubs, Championnat, Vieilles Plumes' }] },
        { k: 'cover', l: 'Photo de couverture', t: 'image' },
        { k: 'url_album', l: 'Lien de l\'album (Flickr, Google Photos…)', t: 'url', hint: 'Si vide, les photos ci-dessous s\'ouvrent directement sur le site.' },
        { k: 'images', l: 'Photos hébergées sur le site', t: 'images' }
      ]
    },
    documents: {
      table: 'clto_documents', label: 'Documents', one: 'un document', group: 'Contenus', order: [['position', true]], sortable: true,
      columns: [['title', 'Titre'], ['category', 'Catégorie', 'pill'], ['url', 'Fichier']],
      fields: [
        { k: 'title', l: 'Titre', req: true },
        { k: 'category', l: 'Catégorie', hint: 'Ex. : Inscription, Compétition, Bénévoles' },
        { k: 'url', l: 'Fichier (PDF…)', t: 'file' },
        { k: 'description', l: 'Description', t: 'textarea' }
      ]
    },
    timeline: {
      table: 'clto_timeline', label: 'Histoire et palmarès', one: 'une date', group: 'Contenus', order: [['date', false]],
      filter: { k: 'kind', l: 'Histoire et palmarès', options: [{ v: 'histoire', l: 'Histoire' }, { v: 'palmares', l: 'Palmarès' }] },
      defaults: () => ({ kind: 'histoire' }),
      columns: [['date', 'Date', 'date'], ['title', 'Titre'], ['kind', 'Rubrique', 'pill']],
      fields: [
        { row: [{ k: 'date', l: 'Date', t: 'date', req: true }, { k: 'kind', l: 'Rubrique', t: 'select', options: [{ v: 'histoire', l: 'Histoire du club' }, { v: 'palmares', l: 'Palmarès' }] }] },
        { k: 'title', l: 'Titre', req: true },
        { k: 'text', l: 'Texte', t: 'textarea' }
      ]
    },
    faq: {
      table: 'clto_faq', label: 'Questions fréquentes', one: 'une question', group: 'Contenus', order: [['position', true]], sortable: true,
      columns: [['question', 'Question'], ['category', 'Catégorie', 'pill']],
      fields: [
        { k: 'question', l: 'Question', req: true },
        { k: 'category', l: 'Catégorie', hint: 'Ex. : Inscription, Pratique, Compétition, Vie du club' },
        { k: 'answer', l: 'Réponse', t: 'html' }
      ]
    }
  };

  /* Réglages généraux (table clto_settings, une ligne par clé) */
  const SETTINGS = {
    club: { label: 'Coordonnées du club', fields: [
      { row: [{ k: 'name', l: 'Nom court' }, { k: 'season', l: 'Saison en cours', hint: 'Ex. : 2026-2027' }] },
      { k: 'fullname', l: 'Nom complet' },
      { k: 'address', l: 'Adresse du siège' },
      { row: [{ k: 'phone', l: 'Téléphone' }, { k: 'email', l: 'E-mail', t: 'email' }] },
      { k: 'hours', l: 'Horaires du secrétariat', t: 'html' },
      { k: 'logo', l: 'Logo', t: 'image' },
      { row: [{ k: 'lat', l: 'Latitude du siège', t: 'number', step: 'any' }, { k: 'lng', l: 'Longitude du siège', t: 'number', step: 'any' }] }
    ] },
    hero: { label: 'Accueil : grand titre et diaporama', fields: [
      { k: 'title', l: 'Grand titre', hint: 'Séparez les lignes avec | ; la dernière ligne s\'affiche en or. Ex. : Le bad|à Orléans,|pour tous.' },
      { k: 'text', l: 'Texte d\'introduction', t: 'textarea' },
      { k: 'slides', l: 'Photos du diaporama', t: 'list', hint: 'Elles défilent toutes les 6 secondes. Format conseillé : portrait ou carré.', sub: [{ k: 'image', l: 'Photo', t: 'image' }, { k: 'title', l: 'Légende' }, { k: 'link', l: 'Lien (facultatif)', hint: 'Ex. : interclubs.html' }] }
    ] },
    alert: { label: 'Bandeau d\'information', fields: [
      { k: 'enabled', l: 'Afficher le bandeau (accueil, créneaux, inscription)', t: 'bool' },
      { k: 'title', l: 'Titre' },
      { k: 'text', l: 'Message', t: 'textarea' }
    ] },
    stats: { label: 'Chiffres du club', fields: [
      { k: 'main', l: 'Chiffres principaux (tableau d\'affichage)', t: 'list', sub: [{ k: 'value', l: 'Nombre' }, { k: 'suffix', l: 'Unité', hint: 'ex. h' }, { k: 'label', l: 'Libellé' }] },
      { k: 'more', l: 'Autres chiffres', t: 'list', sub: [{ k: 'value', l: 'Nombre' }, { k: 'label', l: 'Libellé' }] }
    ] },
    president: { label: 'Mot du président', fields: [
      { row: [{ k: 'name', l: 'Nom' }, { k: 'role', l: 'Fonction' }] },
      { k: 'photo', l: 'Portrait', t: 'image' },
      { k: 'message', l: 'Message', t: 'html' }
    ] },
    labels: { label: 'Labels du club', fields: [
      { k: 'items', l: 'Labels', t: 'list', sub: [{ k: 'name', l: 'Nom du label' }, { k: 'image', l: 'Logo', t: 'image' }] }
    ] },
    links: { label: 'Liens et réseaux sociaux', fields: [
      { row: [{ k: 'helloasso', l: 'Boutique / HelloAsso', t: 'url' }, { k: 'compte_joueur', l: 'Compte joueur', t: 'url' }] },
      { row: [{ k: 'myffbad', l: 'MyFFBaD', t: 'url' }, { k: 'icbad', l: 'Résultats Icbad', t: 'url' }] },
      { row: [{ k: 'facebook', l: 'Facebook', t: 'url' }, { k: 'instagram', l: 'Instagram', t: 'url' }] },
      { row: [{ k: 'linkedin', l: 'LinkedIn', t: 'url' }, { k: 'flickr', l: 'Flickr', t: 'url' }] }
    ] }
  };

  /* Pages publiques dont les textes sont modifiables */
  const PAGES = [
    ['index.html', 'Accueil'], ['club.html', 'Le club'], ['pratiquer.html', 'Créneaux et gymnases'], ['publics.html', 'Nos publics'],
    ['interclubs.html', 'Interclubs'], ['agenda.html', 'Agenda'], ['actualites.html', 'Actualités'], ['galerie.html', 'Galerie'],
    ['adherer.html', 'S\'inscrire'], ['partenaires.html', 'Partenaires'], ['benevolat.html', 'S\'engager'], ['contact.html', 'Contact'], ['mentions.html', 'Mentions légales']
  ];

  /* =====================================================================
     Navigation
  ===================================================================== */
  const NAV = [
    ['Général', [['dashboard', 'Tableau de bord'], ['messages', 'Messages']]],
    ['Contenus', [['posts', 'Actualités'], ['events', 'Agenda et stages'], ['gallery', 'Galerie'], ['documents', 'Documents'], ['faq', 'Questions fréquentes'], ['timeline', 'Histoire et palmarès']]],
    ['Le club', [['slots', 'Créneaux'], ['gyms', 'Gymnases'], ['prices', 'Tarifs'], ['teams', 'Équipes interclubs'], ['people', 'Organigramme'], ['partners', 'Partenaires']]],
    ['Site', [['blocks', 'Textes des pages'], ['settings', 'Réglages'], ['media', 'Médiathèque']]]
  ];
  let currentView = 'dashboard';

  function renderNav() {
    $('#side-nav').innerHTML = NAV.map(([g, items]) => `<div class="grp">${g}</div>` + items.map(([k, l]) => `<button type="button" data-v="${k}"${k === currentView ? ' aria-current="page"' : ''}>${l}${k === 'messages' ? '<span class="badge" id="msg-badge" hidden></span>' : ''}</button>`).join('')).join('');
    $$('#side-nav button').forEach((b) => b.addEventListener('click', () => { go(b.dataset.v); document.body.classList.remove('nav-open'); }));
    refreshBadge();
  }
  async function refreshBadge() {
    const { count } = await sb.from('clto_messages').select('id', { count: 'exact', head: true }).eq('status', 'nouveau');
    const b = $('#msg-badge'); if (!b) return;
    b.hidden = !count; b.textContent = count || '';
  }
  function go(view) {
    currentView = view;
    location.hash = view;
    $$('#side-nav button').forEach((b) => b.toggleAttribute('aria-current', b.dataset.v === view));
    $('#top-actions').innerHTML = '';
    $('#view').onclick = null;
    $('#view').innerHTML = '<p class="muted">Chargement…</p>';
    if (COL[view]) return viewCollection(view);
    ({ dashboard: viewDashboard, messages: viewMessages, blocks: viewBlocks, settings: viewSettings, media: viewMedia }[view] || viewDashboard)();
  }

  /* =====================================================================
     Formulaires génériques
  ===================================================================== */
  const sources = {};
  async function loadSource(name) {
    if (name === 'gyms') { const { data } = await sb.from('clto_gyms').select('name').order('position'); sources.gyms = (data || []).map((g) => g.name); }
  }

  function fieldHTML(f, v, path) {
    const id = 'f_' + path.replace(/[^a-z0-9_]/gi, '_');
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const lab = f.l ? `<label for="${id}">${esc(f.l)}${f.req ? ' *' : ''}</label>` : '';
    const t = f.t || 'text';
    if (t === 'bool') return `<div class="f"><label class="check"><input type="checkbox" id="${id}" data-path="${path}" data-type="bool"${v ? ' checked' : ''}> ${esc(f.l)}</label>${hint}</div>`;
    if (t === 'textarea') return `<div class="f">${lab}<textarea id="${id}" data-path="${path}">${esc(v)}</textarea>${hint}</div>`;
    if (t === 'code') return `<div class="f">${lab}<textarea class="code" id="${id}" data-path="${path}">${esc(v)}</textarea>${hint}</div>`;
    if (t === 'html') return `<div class="f">${lab}<div class="rte" data-path="${path}" data-type="html"></div>${hint}</div>`;
    if (t === 'select') {
      let opts = f.source ? (sources[f.source] || []) : f.options;
      opts = opts.map((o) => (typeof o === 'object' ? o : { v: o, l: o || '—' }));
      if (v != null && v !== '' && !opts.some((o) => String(o.v) === String(v))) opts = [...opts, { v, l: v }];
      const sel = `<select id="${id}" data-path="${path}" data-type="${f.num ? 'int' : 'text'}">${f.source ? '<option value="">—</option>' : ''}${opts.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(v ?? '') ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
      return `<div class="f">${lab}${sel}${hint}</div>`;
    }
    if (t === 'tags') return `<div class="f">${lab}<input id="${id}" data-path="${path}" data-type="tags" value="${esc((v || []).join(', '))}">${hint}</div>`;
    if (t === 'image' || t === 'file') {
      const isImg = t === 'image';
      return `<div class="f">${lab}<div class="img-field" data-kind="${t}">
        <div class="preview">${v ? (isImg ? `<img src="${esc(v)}" alt="">` : 'Fichier') : 'Aucun'}</div>
        <div class="ctrls"><input id="${id}" data-path="${path}" data-type="text" value="${esc(v)}" placeholder="Adresse du fichier">
          <div class="btns"><label class="btn btn-small">Téléverser<input type="file" hidden ${isImg ? 'accept="image/*"' : ''}></label>${isImg ? '<button class="btn btn-small btn-ghost" type="button" data-pick>Médiathèque</button>' : ''}${v ? `<a class="btn btn-small btn-ghost" href="${esc(v)}" target="_blank" rel="noopener">Ouvrir</a>` : ''}<button class="btn btn-small btn-ghost" type="button" data-clear>Retirer</button></div></div>
      </div>${hint}</div>`;
    }
    if (t === 'images') {
      const arr = Array.isArray(v) ? v : [];
      return `<div class="f">${lab}<div class="media-grid" data-images="${path}">${arr.map((u) => `<div class="media" data-url="${esc(u)}"><div class="m-img" style="background-image:url('${esc(u)}')"></div><div class="m-body"><div><button class="btn btn-small btn-danger" type="button" data-rm>Retirer</button></div></div></div>`).join('')}</div>
        <div class="btns" style="display:flex;gap:8px"><label class="btn btn-small">Ajouter des photos<input type="file" accept="image/*" multiple hidden data-multi="${path}"></label></div>${hint}</div>`;
    }
    if (t === 'list') {
      const arr = Array.isArray(v) ? v : [];
      return `<div class="f">${lab}<div class="repeater" data-list="${path}" data-sub='${esc(JSON.stringify(f.sub))}'>${arr.map((it, i) => repItem(f.sub, it, path, i)).join('')}</div><button class="btn btn-small btn-ghost" type="button" data-add-item="${path}">Ajouter</button>${hint}</div>`;
    }
    if (t === 'geocode') return `<div class="f"><button class="btn btn-small btn-ghost" type="button" data-geocode>Trouver les coordonnées depuis l'adresse</button></div>`;
    const typ = { date: 'date', time: 'time', number: 'number', url: 'url', email: 'email' }[t] || 'text';
    return `<div class="f">${lab}<input id="${id}" type="${typ}"${f.step ? ` step="${f.step}"` : ''} data-path="${path}" data-type="${t === 'number' ? 'num' : 'text'}" value="${esc(t === 'time' && v ? String(v).slice(0, 5) : v)}"${f.req ? ' required' : ''}>${hint}</div>`;
  }
  function repItem(sub, it, path, i) {
    return `<div class="rep-item"><div class="rep-head"><span>N° ${i + 1}</span><span><button class="btn btn-small btn-ghost" type="button" data-up>↑</button> <button class="btn btn-small btn-danger" type="button" data-rm-item>Supprimer</button></span></div>
      <div class="f-row">${sub.map((sf) => fieldHTML(sf, (it || {})[sf.k], `${path}.${i}.${sf.k}`)).join('')}</div></div>`;
  }
  function buildFields(fields, values) {
    return fields.map((f) => (f.row ? `<div class="${f.cls || 'f-row'}">${f.row.map((x) => fieldHTML(x, values[x.k], x.k)).join('')}</div>` : fieldHTML(f, values[f.k], f.k))).join('');
  }

  const editors = new Map();
  function wireForm(form, fields, values) {
    editors.clear();
    const flat = fields.flatMap((f) => f.row || [f]);
    $$('.rte', form).forEach((el) => {
      const path = el.dataset.path;
      const q = new window.Quill(el, { theme: 'snow', modules: { toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image', 'blockquote'], ['clean']] } });
      const val = path.split('.').reduce((o, k) => (o ? o[k] : undefined), values);
      if (val) q.clipboard.dangerouslyPasteHTML(val);
      q.getModule('toolbar').addHandler('image', async () => {
        const url = await pickFile('image/*'); if (!url) return;
        const r = q.getSelection(true); q.insertEmbed(r.index, 'image', url, 'user');
      });
      editors.set(path, q);
    });
    /* upload d'image / fichier */
    form.addEventListener('change', async (e) => {
      const inp = e.target;
      if (inp.type === 'file' && inp.closest('.img-field')) {
        const file = inp.files[0]; if (!file) return;
        const box = inp.closest('.img-field');
        const url = await upload(file); if (!url) return;
        setImgField(box, url);
      }
      if (inp.dataset.multi) {
        const grid = $(`[data-images="${inp.dataset.multi}"]`, form);
        for (const file of inp.files) {
          const url = await upload(file); if (!url) continue;
          grid.insertAdjacentHTML('beforeend', `<div class="media" data-url="${esc(url)}"><div class="m-img" style="background-image:url('${esc(url)}')"></div><div class="m-body"><div><button class="btn btn-small btn-danger" type="button" data-rm>Retirer</button></div></div></div>`);
        }
        inp.value = '';
      }
    });
    form.addEventListener('input', (e) => { const box = e.target.closest('.img-field'); if (box && e.target.dataset.path) { const pv = $('.preview', box); const v = e.target.value; pv.innerHTML = v ? (box.dataset.kind === 'image' ? `<img src="${esc(v)}" alt="">` : 'Fichier') : 'Aucun'; } });
    form.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-clear')) setImgField(b.closest('.img-field'), '');
      if (b.hasAttribute('data-pick')) { const url = await mediaPicker(); if (url) setImgField(b.closest('.img-field'), url); }
      if (b.hasAttribute('data-rm')) b.closest('.media').remove();
      if (b.dataset.addItem) {
        const rep = $(`[data-list="${b.dataset.addItem}"]`, form); const sub = JSON.parse(rep.dataset.sub);
        rep.insertAdjacentHTML('beforeend', repItem(sub, {}, b.dataset.addItem, rep.children.length));
      }
      if (b.hasAttribute('data-rm-item')) { const rep = b.closest('.repeater'); b.closest('.rep-item').remove(); renumber(rep); }
      if (b.hasAttribute('data-up')) { const it = b.closest('.rep-item'); if (it.previousElementSibling) { it.parentNode.insertBefore(it, it.previousElementSibling); renumber(it.parentNode); } }
      if (b.hasAttribute('data-geocode')) geocode(form);
    });
    return () => collect(form, flat);
  }
  function renumber(rep) {
    const base = rep.dataset.list;
    [...rep.children].forEach((item, i) => {
      $('.rep-head span', item).textContent = 'N° ' + (i + 1);
      $$('[data-path]', item).forEach((inp) => { inp.dataset.path = inp.dataset.path.replace(new RegExp('^' + base + '\\.\\d+\\.'), `${base}.${i}.`); });
    });
  }
  function setImgField(box, url) {
    const inp = $('input[data-path]', box); inp.value = url;
    $('.preview', box).innerHTML = url ? (box.dataset.kind === 'image' ? `<img src="${esc(url)}" alt="">` : 'Fichier') : 'Aucun';
  }
  function collect(form, flat) {
    const out = {};
    $$('[data-path]', form).forEach((el) => {
      if (el.classList.contains('rte')) return;
      const path = el.dataset.path; const type = el.dataset.type;
      let v;
      if (type === 'bool') v = el.checked;
      else if (type === 'num') v = el.value === '' ? null : Number(el.value);
      else if (type === 'int') v = el.value === '' ? null : parseInt(el.value, 10);
      else if (type === 'tags') v = el.value.split(',').map((s) => s.trim()).filter(Boolean);
      else v = el.value.trim() === '' ? null : el.value.trim();
      setPath(out, path, v);
    });
    editors.forEach((q, path) => { const html = q.root.innerHTML; setPath(out, path, html === '<p><br></p>' ? null : html); });
    $$('[data-images]', form).forEach((g) => setPath(out, g.dataset.images, $$('.media', g).map((m) => m.dataset.url)));
    $$('[data-list]', form).forEach((rep) => { if (!getPath(out, rep.dataset.list)) setPath(out, rep.dataset.list, []); });
    /* nettoyage des listes (repeater) */
    Object.keys(out).forEach((k) => { if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) && Object.keys(out[k]).every((x) => /^\d+$/.test(x))) out[k] = Object.keys(out[k]).sort((a, b) => a - b).map((i) => out[k][i]); });
    const missing = flat.filter((f) => f.req && (out[f.k] == null || out[f.k] === '')).map((f) => f.l);
    return { values: out, missing };
  }
  const setPath = (o, path, v) => { const ks = path.split('.'); let cur = o; ks.slice(0, -1).forEach((k) => { cur[k] = cur[k] || {}; cur = cur[k]; }); cur[ks[ks.length - 1]] = v; };
  const getPath = (o, path) => path.split('.').reduce((a, k) => (a ? a[k] : undefined), o);

  async function geocode(form) {
    const addr = [$('[data-path="address"]', form)?.value, $('[data-path="city"]', form)?.value].filter(Boolean).join(', ');
    if (!addr) return toast('Renseignez d\'abord l\'adresse.', true);
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(addr));
      const j = await r.json();
      if (!j[0]) return toast('Adresse introuvable sur la carte.', true);
      $('[data-path="lat"]', form).value = (+j[0].lat).toFixed(6); $('[data-path="lng"]', form).value = (+j[0].lon).toFixed(6);
      toast('Coordonnées trouvées.');
    } catch (e) { toast('Service de carte indisponible.', true); }
  }

  /* =====================================================================
     Fichiers (Supabase Storage)
  ===================================================================== */
  async function upload(file) {
    if (file.size > 15 * 1024 * 1024) { toast('Fichier trop lourd (15 Mo maximum).', true); return null; }
    const name = `uploads/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${(file.name.split('.').pop() || 'bin').toLowerCase()}`;
    toast('Envoi du fichier…');
    const { error } = await sb.storage.from(BUCKET).upload(name, file, { cacheControl: '31536000', contentType: file.type || undefined });
    if (error) { toast('Envoi impossible : ' + error.message, true); return null; }
    toast('Fichier envoyé.');
    return sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }
  function pickFile(accept) {
    return new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = async () => res(i.files[0] ? await upload(i.files[0]) : null); i.click(); });
  }
  async function listMedia() {
    const out = [];
    for (const folder of ['uploads', 'import']) {
      const { data } = await sb.storage.from(BUCKET).list(folder, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
      (data || []).filter((f) => f.id).forEach((f) => out.push({ path: `${folder}/${f.name}`, name: f.name, size: f.metadata?.size || 0, type: f.metadata?.mimetype || '', url: sb.storage.from(BUCKET).getPublicUrl(`${folder}/${f.name}`).data.publicUrl }));
    }
    return out;
  }
  function mediaPicker() {
    return new Promise(async (resolve) => {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(7,26,64,.6);display:grid;place-items:center;padding:20px';
      ov.innerHTML = `<div class="panel" style="width:min(980px,100%);max-height:86vh;overflow:auto;margin:0"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>Choisir une image</h2><button class="icon-btn" type="button">✕</button></div><div class="media-grid picker-grid"><p class="muted">Chargement…</p></div></div>`;
      document.body.append(ov);
      const close = (v) => { ov.remove(); resolve(v); };
      $('.icon-btn', ov).onclick = () => close(null);
      ov.addEventListener('click', (e) => { if (e.target === ov) close(null); });
      const files = (await listMedia()).filter((f) => f.type.startsWith('image/'));
      $('.picker-grid', ov).innerHTML = files.map((f) => `<div class="media" data-u="${esc(f.url)}"><div class="m-img" style="background-image:url('${esc(f.url)}')"></div><div class="m-body">${esc(f.name.slice(0, 40))}</div></div>`).join('') || '<p class="muted">Aucune image.</p>';
      $$('.picker-grid .media', ov).forEach((m) => m.addEventListener('click', () => close(m.dataset.u)));
    });
  }

  /* =====================================================================
     Panneau d'édition
  ===================================================================== */
  let drawerState = null;
  function openDrawer({ title, fields, values, onSave, onDelete, raw }) {
    const old = $('#drawer-form');
    const form = old.cloneNode(false); /* repart d'un formulaire vierge, sans anciens écouteurs */
    old.replaceWith(form);
    form.innerHTML = raw || buildFields(fields, values || {});
    const getter = raw ? null : wireForm(form, fields, values || {});
    drawerState = { getter, onSave, onDelete, form };
    $('#drawer-title').textContent = title;
    $('#drawer-delete').hidden = !onDelete;
    $('#drawer-delete').textContent = 'Supprimer';
    $('#drawer-save').hidden = !onSave;
    $('#drawer-bg').hidden = false;
    $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false');
    setTimeout(() => { const f = $('input,textarea,select', form); f && f.focus(); }, 300);
    return form;
  }
  function closeDrawer() {
    $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#drawer-bg').hidden = true; drawerState = null;
  }
  $('#drawer-close').onclick = closeDrawer; $('#drawer-cancel').onclick = closeDrawer; $('#drawer-bg').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawerState) closeDrawer(); });
  $('#drawer-save').onclick = async () => {
    if (!drawerState) return;
    const btn = $('#drawer-save'); btn.disabled = true;
    try {
      const res = drawerState.getter ? drawerState.getter() : { values: null, missing: [] };
      if (res.missing.length) { toast('À remplir : ' + res.missing.join(', '), true); return; }
      const ok = await drawerState.onSave(res.values, drawerState.form);
      if (ok !== false) closeDrawer();
    } finally { btn.disabled = false; }
  };
  $('#drawer-delete').onclick = async () => {
    if (!drawerState || !confirm('Supprimer définitivement cet élément ?')) return;
    const ok = await drawerState.onDelete(); if (ok !== false) closeDrawer();
  };

  /* =====================================================================
     Vue : collection
  ===================================================================== */
  async function viewCollection(name) {
    const c = COL[name];
    $('#view-title').textContent = c.label;
    $('#top-actions').innerHTML = `<button class="btn btn-gold" type="button" id="add-btn">Ajouter ${c.one}</button>`;
    if (c.fields.some((f) => (f.row || [f]).some((x) => x.source))) await loadSource('gyms');
    let q = sb.from(c.table).select('*');
    c.order.forEach(([k, asc]) => { q = q.order(k, { ascending: asc, nullsFirst: false }); });
    const { data, error } = await q;
    if (error) { $('#view').innerHTML = `<p class="status err">${esc(error.message)}</p>`; return; }
    let rows = data || [];
    let search = '', filterV = '';
    const view = $('#view');
    view.innerHTML = `<div class="toolbar">${c.search ? '<input type="search" id="search" placeholder="Rechercher…" aria-label="Rechercher">' : ''}
      ${c.filter ? `<select id="filter" aria-label="Filtrer"><option value="">${esc(c.filter.l)}</option>${c.filter.options.map((o) => (typeof o === 'object' ? o : { v: o, l: o })).map((o) => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')}</select>` : ''}
      <span class="muted" id="count"></span></div><div class="table-wrap"><table class="list"><thead><tr>${c.columns.map(([, l]) => `<th>${esc(l)}</th>`).join('')}${c.sortable ? '<th>Ordre</th>' : ''}</tr></thead><tbody id="rows"></tbody></table></div>`;
    const cell = (r, [k, , t]) => {
      const v = r[k];
      if (t === 'img') return v ? `<img class="thumb" src="${esc(v)}" alt="" loading="lazy">` : '<span class="thumb"></span>';
      if (t === 'date') return fmtDate(v);
      if (t === 'bool') return v ? '<span class="pill ok">Oui</span>' : '<span class="pill off">Non</span>';
      if (t === 'tags') return (v || []).map((x) => `<span class="pill">${esc(x)}</span>`).join(' ');
      if (t === 'pill') return v ? `<span class="pill">${esc(v)}</span>` : '';
      if (t === 'day') return DAYS[v] || '';
      if (t === 'time') return esc(String(v || '').slice(0, 5));
      const s = String(v ?? ''); return esc(s.length > 70 ? s.slice(0, 70) + '…' : s);
    };
    const draw = () => {
      const list = rows.filter((r) => (!search || c.search.some((k) => String(r[k] || '').toLowerCase().includes(search))) && (!filterV || String(r[c.filter.k]) === filterV));
      $('#rows').innerHTML = list.map((r) => `<tr data-id="${r.id}">${c.columns.map((col) => `<td>${cell(r, col)}</td>`).join('')}${c.sortable ? `<td><span class="order-btns"><button type="button" data-mv="-1" aria-label="Monter">↑</button><button type="button" data-mv="1" aria-label="Descendre">↓</button></span></td>` : ''}</tr>`).join('') || `<tr><td colspan="9" class="empty">Rien pour l'instant. Cliquez sur « Ajouter ${c.one} ».</td></tr>`;
      $('#count').textContent = `${list.length} élément${list.length > 1 ? 's' : ''}`;
    };
    draw();
    if ($('#search')) $('#search').addEventListener('input', (e) => { search = e.target.value.toLowerCase(); draw(); });
    if ($('#filter')) $('#filter').addEventListener('change', (e) => { filterV = e.target.value; draw(); });

    const reload = () => viewCollection(name);
    const edit = (row) => openDrawer({
      title: row ? 'Modifier ' + c.one.replace(/^(un|une) /, '') : 'Ajouter ' + c.one,
      fields: c.fields, values: row || (c.defaults ? c.defaults() : {}),
      onSave: async (v) => {
        if (c.before) c.before(v);
        delete v.geo;
        if (!row && c.sortable) { const same = rows.filter((r) => !c.sortGroup || r[c.sortGroup] === v[c.sortGroup]); v.position = same.reduce((m, r) => Math.max(m, r.position || 0), 0) + 1; }
        const { error: err } = row ? await sb.from(c.table).update(v).eq('id', row.id) : await sb.from(c.table).insert(v);
        if (err) { toast('Erreur : ' + err.message, true); return false; }
        toast(row ? 'Modifications enregistrées.' : 'Ajouté.'); reload();
      },
      onDelete: row ? async () => { const { error: err } = await sb.from(c.table).delete().eq('id', row.id); if (err) { toast('Erreur : ' + err.message, true); return false; } toast('Supprimé.'); reload(); } : null
    });
    $('#add-btn').onclick = () => edit(null);
    $('#rows').addEventListener('click', async (e) => {
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const row = rows.find((r) => String(r.id) === tr.dataset.id);
      const mv = e.target.closest('[data-mv]');
      if (mv) {
        e.stopPropagation();
        const group = rows.filter((r) => !c.sortGroup || r[c.sortGroup] === row[c.sortGroup]).sort((a, b) => (a.position || 0) - (b.position || 0));
        const i = group.indexOf(row); const j = i + Number(mv.dataset.mv);
        if (j < 0 || j >= group.length) return;
        [group[i], group[j]] = [group[j], group[i]];
        await Promise.all(group.map((r, idx) => (r.position !== idx + 1 ? sb.from(c.table).update({ position: idx + 1 }).eq('id', r.id) : null)).filter(Boolean));
        reload(); return;
      }
      edit(row);
    });
  }

  /* =====================================================================
     Vue : tableau de bord
  ===================================================================== */
  async function viewDashboard() {
    $('#view-title').textContent = 'Tableau de bord';
    $('#top-actions').innerHTML = '<a class="btn btn-ghost" href="../index.html" target="_blank" rel="noopener">Voir le site</a>';
    const tables = [['posts', 'clto_posts'], ['events', 'clto_events'], ['slots', 'clto_slots'], ['people', 'clto_people'], ['partners', 'clto_partners'], ['gallery', 'clto_gallery']];
    const counts = await Promise.all(tables.map(([, t]) => sb.from(t).select('id', { count: 'exact', head: true })));
    const { count: newMsg } = await sb.from('clto_messages').select('id', { count: 'exact', head: true }).eq('status', 'nouveau');
    const { data: next } = await sb.from('clto_events').select('id,title,date_start,kind').gte('date_start', today()).order('date_start').limit(5);
    $('#view').innerHTML = `<div class="help">Bienvenue ! Choisissez une rubrique à gauche. Chaque modification enregistrée est visible immédiatement sur le site (pensez à recharger la page).</div>
      <div class="cards">
        <button class="card" data-go="messages" type="button"><b>${newMsg || 0}</b>message${newMsg > 1 ? 's' : ''} non lu${newMsg > 1 ? 's' : ''}</button>
        ${tables.map(([k], i) => `<button class="card" data-go="${k}" type="button"><b>${counts[i].count ?? '–'}</b>${esc(COL[k].label)}</button>`).join('')}
      </div>
      <div class="panel"><h2>Prochains rendez-vous</h2>${(next || []).map((e) => `<p style="margin:6px 0"><span class="pill">${esc(e.kind)}</span> <b>${fmtDate(e.date_start)}</b> · ${esc(e.title)}</p>`).join('') || '<p class="muted">Aucun événement à venir. <button class="linklike" data-go="events" type="button">Ajouter un rendez-vous</button></p>'}</div>
      <div class="panel"><h2>Raccourcis</h2><div class="toolbar"><button class="btn" data-go="posts" type="button">Écrire une actualité</button><button class="btn btn-ghost" data-go="settings" type="button">Bandeau d'information</button><button class="btn btn-ghost" data-go="blocks" type="button">Modifier les textes des pages</button><button class="btn btn-ghost" data-go="slots" type="button">Mettre à jour les créneaux</button></div></div>`;
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  }

  /* =====================================================================
     Vue : messages
  ===================================================================== */
  async function viewMessages() {
    $('#view-title').textContent = 'Messages';
    const { data, error } = await sb.from('clto_messages').select('*').order('created_at', { ascending: false });
    if (error) { $('#view').innerHTML = `<p class="status err">${esc(error.message)}</p>`; return; }
    const st = { nouveau: ['Nouveau', 'new'], lu: ['Lu', ''], traite: ['Traité', 'ok'] };
    $('#view').innerHTML = `<div class="help">Les messages envoyés depuis les formulaires « Contact » et « Votre avis » du site arrivent ici.</div>` + ((data || []).map((m) => `<article class="msg${m.status === 'nouveau' ? ' is-new' : ''}" data-id="${m.id}">
      <header><span class="pill ${st[m.status]?.[1] || ''}">${st[m.status]?.[0] || esc(m.status)}</span><b>${esc(m.name)}</b>${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}${m.phone ? `<span>${esc(m.phone)}</span>` : ''}<span class="pill">${esc(m.subject || '')}</span><span class="muted">${new Date(m.created_at).toLocaleString('fr-FR')}</span></header>
      <p>${esc(m.message)}</p>
      <div class="actions">${m.email ? `<a class="btn btn-small" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re : ' + (m.subject || 'votre message au CLTO Badminton'))}">Répondre par e-mail</a>` : ''}
        <button class="btn btn-small btn-ghost" type="button" data-st="lu">Marquer lu</button><button class="btn btn-small btn-ghost" type="button" data-st="traite">Marquer traité</button><button class="btn btn-small btn-danger" type="button" data-del>Supprimer</button></div></article>`).join('') || '<p class="empty">Aucun message pour le moment.</p>');
    $('#view').onclick = async (e) => {
      const art = e.target.closest('.msg'); if (!art) return;
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.st) await sb.from('clto_messages').update({ status: b.dataset.st }).eq('id', art.dataset.id);
      if (b.hasAttribute('data-del')) { if (!confirm('Supprimer ce message ?')) return; await sb.from('clto_messages').delete().eq('id', art.dataset.id); }
      refreshBadge(); viewMessages();
    };
  }

  /* =====================================================================
     Vue : textes des pages (blocs data-cms découverts dans les pages)
  ===================================================================== */
  async function viewBlocks() {
    $('#view-title').textContent = 'Textes des pages';
    const { data: rows } = await sb.from('clto_pages').select('*');
    const saved = Object.fromEntries((rows || []).map((r) => [r.slug, r]));
    const groups = [];
    for (const [file, label] of PAGES) {
      try {
        const html = await (await fetch('../' + file, { cache: 'no-store' })).text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const blocks = $$('[data-cms]', doc).map((el) => {
          const sec = el.closest('section');
          const card = el.closest('.pub-card,.pillar,.callout,.price-card,.tl-item,.f,.cta-band');
          const local = card && card.querySelector('h3,h2');
          const heading = (local && local !== el ? local.textContent : '') || (sec ? (sec.querySelector('h1,h2') || {}).textContent : '');
          const tag = el.tagName;
          const complex = /<(div|table|section|figure)/i.test(el.innerHTML);
          const mode = ['H1', 'H2', 'H3', 'H4', 'P', 'SPAN'].includes(tag) ? 'text' : complex ? 'code' : 'html';
          return { key: el.dataset.cms, def: el.innerHTML.trim(), mode, where: (heading || '').trim().replace(/\s+/g, ' '), tag };
        });
        if (blocks.length) groups.push({ file, label, blocks });
      } catch (e) { /* page indisponible */ }
    }
    const all = groups.flatMap((g) => g.blocks.map((b) => ({ ...b, page: g.label })));
    $('#view').innerHTML = `<div class="help">Ici, vous modifiez les textes fixes des pages. Les listes (actualités, créneaux, tarifs…) se gèrent dans leurs rubriques. Un texte modifié affiche la mention « personnalisé » ; vous pouvez toujours revenir au texte d'origine.</div>` +
      groups.map((g) => `<div class="block-group"><h2>${esc(g.label)}</h2>${g.blocks.map((b) => `<div class="block" data-key="${esc(b.key)}" tabindex="0" role="button"><div><small>${esc(b.where || b.key)}${saved[b.key] ? ' · <b style="color:#127a3e">personnalisé</b>' : ''}</small><div class="excerpt">${esc(strip(saved[b.key]?.content ?? b.def).slice(0, 220))}</div></div><span class="btn btn-small btn-ghost">Modifier</span></div>`).join('')}</div>`).join('');
    const open = (key) => {
      const b = all.find((x) => x.key === key); const cur = saved[key]?.content ?? b.def;
      const field = b.mode === 'text' ? { k: 'content', l: 'Texte', t: 'textarea' } : b.mode === 'code' ? { k: 'content', l: 'Contenu (HTML)', t: 'code', hint: 'Ce bloc contient une mise en page : modifiez les textes entre les balises sans toucher aux balises.' } : { k: 'content', l: 'Texte', t: 'html' };
      const value = b.mode === 'text' ? strip(cur) : cur;
      openDrawer({
        title: `${b.page} · ${b.where || key}`, fields: [field], values: { content: value },
        onSave: async (v) => {
          let content = v.content || '';
          if (b.mode === 'text') content = esc(content);
          const { error } = await sb.from('clto_pages').upsert({ slug: key, title: b.where || key, subtitle: b.page, content });
          if (error) { toast('Erreur : ' + error.message, true); return false; }
          toast('Texte enregistré.'); viewBlocks();
        },
        onDelete: saved[key] ? async () => { await sb.from('clto_pages').delete().eq('slug', key); toast('Texte d\'origine rétabli.'); viewBlocks(); } : null
      });
      $('#drawer-delete').textContent = 'Rétablir le texte d\'origine';
    };
    $$('.block').forEach((el) => { el.addEventListener('click', () => open(el.dataset.key)); el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(el.dataset.key); }); });
  }

  /* =====================================================================
     Vue : réglages
  ===================================================================== */
  async function viewSettings() {
    $('#view-title').textContent = 'Réglages';
    const { data } = await sb.from('clto_settings').select('*');
    const vals = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    $('#view').innerHTML = Object.entries(SETTINGS).map(([k, s]) => `<div class="block" data-k="${k}" tabindex="0" role="button"><div><b>${esc(s.label)}</b><small>${k === 'alert' ? (vals.alert?.enabled ? 'Bandeau affiché' : 'Bandeau masqué') : ''}</small></div><span class="btn btn-small btn-ghost">Modifier</span></div>`).join('');
    const open = (k) => openDrawer({
      title: SETTINGS[k].label, fields: SETTINGS[k].fields, values: vals[k] || {},
      onSave: async (v) => {
        const { error } = await sb.from('clto_settings').upsert({ key: k, value: { ...(vals[k] || {}), ...v } });
        if (error) { toast('Erreur : ' + error.message, true); return false; }
        toast('Réglages enregistrés.'); viewSettings();
      }
    });
    $$('.block[data-k]').forEach((el) => { el.addEventListener('click', () => open(el.dataset.k)); el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(el.dataset.k); }); });
  }

  /* =====================================================================
     Vue : médiathèque
  ===================================================================== */
  async function viewMedia() {
    $('#view-title').textContent = 'Médiathèque';
    $('#top-actions').innerHTML = '<label class="btn btn-gold">Téléverser des fichiers<input type="file" multiple hidden id="media-up"></label>';
    $('#media-up').onchange = async (e) => { for (const f of e.target.files) await upload(f); viewMedia(); };
    const files = await listMedia();
    $('#view').innerHTML = `<div class="help">Images et documents du site. Copiez l'adresse d'un fichier pour l'utiliser ailleurs. Attention : supprimer un fichier encore utilisé le fera disparaître du site.</div><div class="media-grid">${files.map((f) => `<div class="media" data-path="${esc(f.path)}" data-url="${esc(f.url)}">
      <div class="m-img" ${f.type.startsWith('image/') ? `style="background-image:url('${esc(f.url)}')"` : ''}>${f.type.startsWith('image/') ? '' : esc((f.name.split('.').pop() || '').toUpperCase())}</div>
      <div class="m-body"><span>${esc(f.name.slice(0, 48))}</span><span class="muted">${(f.size / 1024).toFixed(0)} Ko</span><div><button class="btn btn-small btn-ghost" type="button" data-copy>Copier l'adresse</button><button class="btn btn-small btn-danger" type="button" data-del aria-label="Supprimer">✕</button></div></div></div>`).join('') || '<p class="empty">Aucun fichier.</p>'}</div>`;
    $('#view').onclick = async (e) => {
      const m = e.target.closest('.media'); const b = e.target.closest('button'); if (!m || !b) return;
      if (b.hasAttribute('data-copy')) { await navigator.clipboard.writeText(m.dataset.url); toast('Adresse copiée.'); }
      if (b.hasAttribute('data-del')) { if (!confirm('Supprimer ce fichier ?')) return; const { error } = await sb.storage.from(BUCKET).remove([m.dataset.path]); if (error) return toast(error.message, true); toast('Fichier supprimé.'); viewMedia(); }
    };
  }

  /* =====================================================================
     Authentification
  ===================================================================== */
  function showLogin(msg, err) {
    $('#app').hidden = true; $('#login-view').hidden = false;
    $('#login-form').hidden = false; $('#reset-form').hidden = true;
    const s = $('#login-status'); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : msg ? ' ok' : '');
  }
  async function enter(session) {
    const { data: isAdmin, error } = await sb.rpc('clto_is_admin');
    if (error || !isAdmin) { await sb.auth.signOut(); showLogin('Ce compte n\'a pas accès à l\'administration du CLTO.', true); return; }
    $('#login-view').hidden = true; $('#app').hidden = false;
    $('#who').textContent = session.user.email;
    renderNav();
    go(location.hash.slice(1) || 'dashboard');
  }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const s = $('#login-status'); s.className = 'status'; s.textContent = 'Connexion…';
    const { data, error } = await sb.auth.signInWithPassword({ email: $('#login-email').value.trim(), password: $('#login-pass').value });
    if (error) { s.className = 'status err'; s.textContent = error.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : error.message; return; }
    enter(data.session);
  });
  $('#forgot').addEventListener('click', async () => {
    const email = $('#login-email').value.trim();
    const s = $('#login-status');
    if (!email) { s.className = 'status err'; s.textContent = 'Saisissez d\'abord votre e-mail.'; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    s.className = 'status ' + (error ? 'err' : 'ok');
    s.textContent = error ? error.message : 'Un e-mail de réinitialisation vient d\'être envoyé.';
  });
  $('#reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const s = $('#reset-status');
    const { error } = await sb.auth.updateUser({ password: $('#reset-pass').value });
    s.className = 'status ' + (error ? 'err' : 'ok'); s.textContent = error ? error.message : 'Mot de passe modifié.';
    if (!error) { const { data } = await sb.auth.getSession(); setTimeout(() => enter(data.session), 800); }
  });
  $('#logout').addEventListener('click', async () => { await sb.auth.signOut(); location.hash = ''; showLogin('Vous êtes déconnecté.'); });
  $('#menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== currentView && !$('#app').hidden) go(v); });

  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') { $('#app').hidden = true; $('#login-view').hidden = false; $('#login-form').hidden = true; $('#reset-form').hidden = false; }
  });
  (async () => {
    if (/type=recovery/.test(location.hash)) return; /* géré par onAuthStateChange */
    const { data } = await sb.auth.getSession();
    if (data.session) enter(data.session); else showLogin();
  })();
})();
