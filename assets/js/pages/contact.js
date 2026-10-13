/* Page « Contact » : formulaires, FAQ, carte */
(function () {
  const { sb, esc, qs, qsa, S, reveal } = window.CLTO;

  async function send(form, status, payload) {
    if (form.elements['website'].value) return; /* robot */
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; status.className = 'form-status'; status.textContent = 'Envoi…';
    const { error } = await sb.from('clto_messages').insert({ ...payload, status: 'nouveau' });
    btn.disabled = false;
    if (error) { status.className = 'form-status err'; status.textContent = 'L\'envoi a échoué. Réessayez ou écrivez-nous par e-mail.'; return; }
    form.reset(); status.className = 'form-status ok'; status.textContent = 'Message envoyé, merci ! Nous vous répondons rapidement.';
  }

  function forms() {
    const subject = new URLSearchParams(location.search).get('sujet');
    if (subject) qs('#c-subject').value = subject;
    const cf = qs('#contact-form');
    cf.addEventListener('submit', (e) => {
      e.preventDefault();
      const st = qs('#c-status');
      if (!cf.checkValidity()) { st.className = 'form-status err'; st.textContent = 'Merci de remplir les champs marqués d\'un astérisque, avec un e-mail valide.'; cf.reportValidity(); return; }
      send(cf, st, { name: cf.elements['name'].value.trim(), email: cf.elements['email'].value.trim(), phone: cf.elements['phone'].value.trim() || null, subject: cf.elements['subject'].value, message: cf.elements['message'].value.trim() });
    });
    const af = qs('#avis-form');
    af.addEventListener('submit', (e) => {
      e.preventDefault();
      const st = qs('#a-status');
      if (!af.elements['message'].value.trim()) { st.className = 'form-status err'; st.textContent = 'Écrivez votre avis avant d\'envoyer.'; return; }
      send(af, st, { name: af.elements['name'].value.trim() || 'Anonyme', email: af.elements['email'].value.trim() || '', subject: 'Avis / suggestion', message: af.elements['message'].value.trim() });
    });
  }

  async function faq() {
    const { data } = await sb.from('clto_faq').select('*').order('position');
    const items = data || [];
    const cats = [...new Set(items.map((f) => f.category).filter(Boolean))];
    let cat = '';
    const render = () => {
      qs('#faq-list').innerHTML = items.filter((f) => !cat || f.category === cat).map((f) => `<details><summary>${esc(f.question)}</summary><div class="answer">${f.answer || ''}</div></details>`).join('');
      qsa('#faq-cats .filter-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === cat)));
      window.ScrollTrigger && window.ScrollTrigger.refresh();
    };
    qs('#faq-cats').innerHTML = ['', ...cats].map((c) => `<button class="filter-btn" type="button" data-c="${esc(c)}">${c ? esc(c) : 'Toutes'}</button>`).join('');
    qsa('#faq-cats .filter-btn').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.c; render(); }));
    render();
    qs('#faq-list').addEventListener('toggle', () => window.ScrollTrigger && window.ScrollTrigger.refresh(), true);
  }

  function map() {
    const email = S('club.email'); if (email) qs('#c-mail').href = 'mailto:' + email;
    const tel = S('club.phone'); if (tel) qs('#c-tel').href = 'tel:' + tel.replace(/\s/g, '');
    if (!window.L) return;
    const lat = S('club.lat', 47.9148747), lng = S('club.lng', 1.9024581);
    const m = window.L.map('hq-map', { scrollWheelZoom: false }).setView([lat, lng], 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(m);
    const icon = window.L.divIcon({ className: '', html: '<div class="map-pin"><span>★</span></div>', iconSize: [34, 34], iconAnchor: [17, 34] });
    window.L.marker([lat, lng], { icon }).addTo(m).bindPopup(`<b>CLTO Badminton</b><br>${esc(S('club.address', ''))}`);
  }

  window.CLTO.ready.then(() => { forms(); faq(); map(); reveal(document); });
})();
