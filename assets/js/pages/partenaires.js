/* Page « Partenaires » */
(function () {
  const { sb, esc, qs, S, reveal } = window.CLTO;
  window.CLTO.ready.then(async () => {
    const { data } = await sb.from('clto_partners').select('*').order('position');
    const order = ['Partenaires sportifs', 'Partenaires privés', 'Partenaires institutionnels', 'Partenaires associatifs'];
    const kinds = [...new Set((data || []).map((p) => p.kind))].sort((a, b) => (order.indexOf(a) + 10) % 10 - (order.indexOf(b) + 10) % 10);
    qs('#partners').innerHTML = kinds.map((k) => `<div style="margin-bottom:44px" data-reveal><h3>${esc(k)}</h3><div class="partner-grid">${(data || []).filter((p) => p.kind === k).map((p) => {
      const tag = p.url ? 'a' : 'div';
      return `<${tag} class="partner" ${p.url ? `href="${esc(p.url)}" target="_blank" rel="noopener"` : ''} title="${esc(p.name)}">${p.logo ? `<img src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy">` : `<b>${esc(p.name)}</b>`}</${tag}>`;
    }).join('')}</div></div>`).join('');
    const st = (S('stats') || {}).main || [];
    qs('#p-stats').innerHTML = st.map((s) => `<div class="score" style="background:rgba(255,255,255,.06)"><div class="score-num">${esc(s.value)}${s.suffix ? `<small>${esc(s.suffix)}</small>` : ''}</div><div class="score-label">${esc(s.label)}</div></div>`).join('');
    reveal(document);
  });
})();
