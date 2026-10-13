/* Page « Interclubs » */
(function () {
  const { sb, esc, qs, I, MONTHS, parseDate, reveal, todayISO } = window.CLTO;
  const abbr = (d) => { const s = String(d || '').toLowerCase(); const n = (s.match(/\d/) || [''])[0]; if (s.startsWith('nationale')) return 'N' + n; if (s.startsWith('pré')) return 'PN'; if (s.startsWith('régionale')) return 'R' + n; if (s.startsWith('départementale')) return 'D' + n; return '•'; };

  window.CLTO.ready.then(async () => {
    const [{ data: teams }, { data: matches }] = await Promise.all([
      sb.from('clto_teams').select('*').order('position'),
      sb.from('clto_events').select('*').eq('published', true).eq('kind', 'Interclubs').gte('date_start', todayISO()).order('date_start')
    ]);
    qs('#ladder').innerHTML = (teams || []).map((t) => `<a class="rung" href="${esc(t.link || 'https://icbad.ffbad.org/')}" target="_blank" rel="noopener"><span class="lvl">${abbr(t.division)}</span><div><b>${esc(t.name)}</b><small>${esc(t.division || '')}${t.captain ? ' · capitaine ' + esc(t.captain) : ''}</small></div><span class="muted" style="font-size:.85rem;font-weight:700">Résultats</span></a>`).join('');
    qs('#team-cards').innerHTML = (teams || []).filter((t) => t.image || t.description).map((t) => `<figure class="split-media" style="margin:0" data-reveal="right">${t.image ? `<img src="${esc(t.image)}" alt="Équipe ${esc(t.name)}" loading="lazy">` : ''}<figcaption style="padding:18px 22px;background:#fff"><b>${esc(t.name)} · ${esc(t.division || '')}</b>${t.description ? `<p class="muted" style="margin:6px 0 0">${esc(t.description)}</p>` : ''}</figcaption></figure>`).join('');
    qs('#home-matches').innerHTML = (matches || []).map((e) => { const d = parseDate(e.date_start); return `<a class="agenda-item" href="agenda.html#ev-${e.id}" data-reveal><div class="date-tile k-interclubs"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div><div><h3>${esc(e.title)}</h3><div class="meta">${e.location ? `<span>${I.pin}${esc(e.location)}</span>` : ''}${e.time_text ? `<span>${I.clock}${esc(e.time_text)}</span>` : ''}</div></div>${e.link ? `<span class="btn btn-gold btn-small">${esc(e.cta_label || 'En savoir plus')}</span>` : '<span></span>'}</a>`; }).join('') || '<p class="empty" style="background:rgba(255,255,255,.06);color:#fff">Le calendrier des rencontres à domicile sera publié prochainement.</p>';
    reveal(document);
  });
})();
