/* Page « Créneaux et gymnases » : planning filtrable, carte des gymnases, prochains stages */
(function () {
  const { sb, esc, qs, qsa, DAYS, I, MONTHS, parseDate, fmtRange, reveal, reduceMotion, todayISO } = window.CLTO;
  let slots = [];
  let gyms = [];

  function renderWeek() {
    const a = qs('#f-audience').value, k = qs('#f-kind').value, g = qs('#f-gym').value;
    const list = slots.filter((s) => (!a || s.audience === a || (a !== 'Tous' && s.audience === 'Tous')) && (!k || s.kind === k) && (!g || s.gym === g));
    const today = ((new Date().getDay() + 6) % 7) + 1;
    let html = '';
    for (let d = 1; d <= 7; d++) {
      const day = list.filter((s) => s.day === d).sort((x, y) => x.start_time.localeCompare(y.start_time));
      if (!day.length && (d >= 6)) continue;
      html += `<div class="day-col${d === today ? ' is-today' : ''}"><h3>${DAYS[d]}<small>${day.length ? day.length + ' créneau' + (day.length > 1 ? 'x' : '') : ''}</small></h3>
        ${day.map((s) => `<div class="slot ${s.kind === 'Jeu libre' ? 'k-libre' : ''}${s.is_full ? ' is-full' : ''}">
          <span class="t">${esc(s.start_time.slice(0, 5))} – ${esc(s.end_time.slice(0, 5))}</span>
          <b>${esc(s.label)}</b><span class="g">${esc(s.gym || '')}${s.audience && s.audience !== 'Tous' ? ' · ' + esc(s.audience) : ''}</span>
          ${s.is_full ? '<span class="full">Complet</span>' : ''}${s.notes ? `<div class="g" style="margin-top:4px">${esc(s.notes)}</div>` : ''}</div>`).join('') || '<p class="muted" style="margin:4px">Pas de créneau</p>'}
      </div>`;
    }
    qs('#week').innerHTML = html;
    qs('#slot-count').textContent = `${list.length} créneau${list.length > 1 ? 'x' : ''} affiché${list.length > 1 ? 's' : ''}`;
    if (window.gsap && !reduceMotion) window.gsap.from('#week .slot', { y: 16, opacity: 0, duration: 0.45, stagger: 0.015, ease: 'power2.out' });
  }

  async function planning() {
    const { data } = await sb.from('clto_slots').select('*').order('day').order('start_time');
    slots = data || [];
    const gymNames = [...new Set(slots.map((s) => s.gym).filter(Boolean))].sort();
    qs('#f-gym').insertAdjacentHTML('beforeend', gymNames.map((g) => `<option>${esc(g)}</option>`).join(''));
    const params = new URLSearchParams(location.search);
    if (params.get('public')) qs('#f-audience').value = params.get('public');
    ['#f-audience', '#f-kind', '#f-gym'].forEach((id) => qs(id).addEventListener('change', renderWeek));
    renderWeek();
  }

  async function gymMap() {
    const { data } = await sb.from('clto_gyms').select('*').order('position');
    gyms = data || [];
    qs('#gym-total').textContent = gyms.reduce((n, g) => n + (g.courts || 0), 0);
    qs('#gym-list').innerHTML = gyms.map((g, i) => `<button class="gym" type="button" data-i="${i}"><span class="pin">${i + 1}</span><span><b>${esc(g.name)}</b><small>${esc(g.address || '')}, ${esc(g.city || '')}</small></span><span class="courts">${g.courts || '–'}<small>terrains</small></span></button>`).join('');
    if (!window.L) return;
    const map = window.L.map('gym-map', { scrollWheelZoom: false }).setView([47.902, 1.91], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    const markers = gyms.map((g, i) => {
      if (g.lat == null) return null;
      const icon = window.L.divIcon({ className: '', html: `<div class="map-pin"><span>${i + 1}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 34] });
      const dest = encodeURIComponent(`${g.address}, ${g.city}`);
      return window.L.marker([g.lat, g.lng], { icon }).addTo(map).bindPopup(`<b>Gymnase ${esc(g.name)}</b><br>${esc(g.address || '')}<br>${esc(g.city || '')}<br><a href="https://www.google.com/maps/dir/?api=1&destination=${dest}" target="_blank" rel="noopener">Itinéraire</a>`);
    });
    const pts = markers.filter(Boolean).map((m) => m.getLatLng());
    if (pts.length) map.fitBounds(window.L.latLngBounds(pts).pad(0.15));
    qsa('.gym').forEach((b) => b.addEventListener('click', () => {
      qsa('.gym').forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      const m = markers[+b.dataset.i];
      if (m) { map.flyTo(m.getLatLng(), 16, { duration: 1 }); m.openPopup(); }
    }));
  }

  async function stages() {
    const { data } = await sb.from('clto_events').select('*').eq('published', true).eq('kind', 'Stage').gte('date_start', todayISO()).order('date_start').limit(3);
    const box = qs('#next-stages');
    box.innerHTML = (data || []).map((e) => {
      const d = parseDate(e.date_start);
      return `<a class="agenda-item" href="agenda.html#ev-${e.id}" data-reveal><div class="date-tile k-stage"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div>
        <div><h3>${esc(e.title)}</h3><div class="meta"><span>${esc(fmtRange(e.date_start, e.date_end))}</span>${e.price ? `<span>${I.euro}${esc(e.price)}</span>` : ''}</div></div><span></span></a>`;
    }).join('') || '<p class="empty">Les prochains stages seront bientôt annoncés.</p>';
    reveal(box);
  }

  window.CLTO.ready.then(() => { planning(); gymMap(); stages(); });
})();
