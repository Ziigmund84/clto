/* Page « S'inscrire » : parcours, tarifs, documents */
(function () {
  const { sb, esc, qs, qsa, I, reveal } = window.CLTO;

  function quiz() {
    qsa('[data-q]').forEach((b) => b.addEventListener('click', () => {
      qsa('[data-q]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      qs('#q-oui').hidden = b.dataset.q !== 'oui';
      qs('#q-non').hidden = b.dataset.q !== 'non';
      const shown = qs('#q-' + b.dataset.q);
      if (window.gsap && !window.CLTO.reduceMotion) window.gsap.from(shown, { y: 14, opacity: 0, duration: 0.5, ease: 'power2.out' });
    }));
  }

  async function prices() {
    const { data } = await sb.from('clto_prices').select('*').order('position');
    const all = data || [];
    const lic = all.filter((p) => p.category === 'Licences');
    qs('#licences').innerHTML = lic.map((p, i) => `<div class="price-card${i < 3 ? ' is-main' : ''}"><h3>${esc(p.label)}</h3><div class="amount">${esc(p.price)}</div>${p.details ? `<p>${esc(p.details)}</p>` : ''}</div>`).join('');
    const cats = [...new Set(all.filter((p) => p.category !== 'Licences').map((p) => p.category))];
    qs('#price-tables').innerHTML = cats.map((c) => `<table class="price-table"><caption>${esc(c)}</caption><tbody>${all.filter((p) => p.category === c).map((p) => `<tr><td>${esc(p.label)}${p.details ? `<small>${esc(p.details)}</small>` : ''}</td><td>${esc(p.price)}</td></tr>`).join('')}</tbody></table>`).join('');
  }

  async function docs() {
    const { data } = await sb.from('clto_documents').select('*').order('position');
    qs('#docs').innerHTML = (data || []).map((d) => `<a class="doc" href="${esc(d.url)}" target="_blank" rel="noopener">${I.doc}<span><b>${esc(d.title)}</b><small>Télécharger${d.category ? ' · ' + esc(d.category) : ''}</small></span></a>`).join('') || '<p class="empty">Aucun document pour le moment.</p>';
  }

  window.CLTO.ready.then(async () => { quiz(); await Promise.all([prices(), docs()]); reveal(document); });
})();
