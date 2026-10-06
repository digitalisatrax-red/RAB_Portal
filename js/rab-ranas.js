/* Ranas amenazadas como centro del visor: íconos por categoría UICN, corte por predio y cruces con zona y cobertura.
   Depende de RABDATA (portal-datos.js) y RABICON (iconos.js). No altera el resto del tablero. */
(function () {
  'use strict';
  if (!window.RABDATA || !window.RABICON) return;
  const D = RABDATA, T = D.reg.t, AM = (u) => ['CR', 'EN', 'VU'].includes(u);
  const F = (n, d = 1) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: d });
  const regs = D.reg.r.map((r) => ({ lon: r[0], lat: r[1], e: T.e[r[2]], c: T.c[r[3]], u: T.u[r[4]], a: !!r[5], n: r[6], z: T.z[r[7]] || 'Sin zona', p: T.p[r[8]], k: T.k[r[9]] || 'Sin dato' }));
  const amen = regs.filter((r) => AM(r.u) || r.a);
  const ico = (u, a) => RABICON.dataUri(a ? RABICON.COL.ANDI : RABICON.COL[u] || RABICON.COL.NT, a ? '#5a3418' : null, a);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let sel = '', modo = 'z', ver = true, m;

  const css = document.createElement('style');
  css.textContent = `#cardRanas{margin:12px 0}#cardRanas .rr{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0}
#cardRanas select{padding:7px 8px;border-radius:8px;border:1px solid var(--edge);background:var(--card);color:var(--ink);font-size:12px}
#cardRanas .lg{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;margin:6px 0}#cardRanas .lg img{width:20px;height:20px;vertical-align:middle;margin-right:5px}
#cardRanas table{width:100%;border-collapse:collapse;font-size:12px}#cardRanas th,#cardRanas td{padding:6px 8px;border-bottom:1px solid var(--edge);text-align:left}
#cardRanas th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}#cardRanas td.n,#cardRanas th.n{text-align:right;font-variant-numeric:tabular-nums}
#cardRanas td.h{text-align:center}#cardRanas .sc{max-height:420px;overflow:auto}#cardRanas .res{font-size:13px;margin:6px 0 2px}
#cardRanas .tg{display:flex;gap:6px;margin:8px 0}#cardRanas .tg button{padding:5px 11px;font-size:11px}`;
  document.head.appendChild(css);

  const card = document.createElement('section');
  card.className = 'card'; card.id = 'cardRanas'; card.setAttribute('aria-label', 'Ranas amenazadas');
  card.innerHTML = `<div class="card-head"><div><h2>RANAS AMENAZADAS | CORTE POR PREDIO</h2><small id="rrSub">—</small></div></div>
  <div class="rr"><label for="rrPredio" class="sr-only">Predio</label><select id="rrPredio"><option value="">Toda la reserva</option></select>
  <label><input type="checkbox" id="rrVer" checked> Mostrar ranas en el mapa</label></div>
  <div class="lg"><span><img src="${ico('EN', true)}">Andinobates (EN)</span><span><img src="${ico('CR')}">En Peligro Crítico</span><span><img src="${ico('EN')}">En Peligro</span><span><img src="${ico('VU')}">Vulnerable</span></div>
  <div class="res" id="rrRes"></div>
  <div class="tg" id="rrTg" role="group" aria-label="Cruce"><button class="btn" data-m="z" aria-pressed="true">Zona de manejo</button><button class="btn" data-m="k" aria-pressed="false">Cobertura (SIG)</button></div>
  <div class="sc"><table><thead id="rrH"></thead><tbody id="rrB"></tbody></table></div>
  <p class="fuente">Fuente: BD Herpetos RAB 2025 (FCV), cruzada con el límite, la zonificación y las coberturas de la RAB; categorías UICN 2025-1. Un registro es una observación, no abundancia. El corte usa el polígono individual del predio (vértices FCV); los predios de compra 2025 están fuera del límite y no tienen registros. Sin propietarios ni datos catastrales.</p>`;
  const anchor = document.querySelector('.lower-grid') || document.querySelector('main');
  anchor.parentNode.insertBefore(card, anchor);
  const $ = (s) => card.querySelector(s);
  D.predios.features.slice().sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre)).forEach((f) => $('#rrPredio').insertAdjacentHTML('beforeend', `<option value="${f.properties.id}">${esc(f.properties.nombre)} · ${f.properties.estado}</option>`));

  const ring = (f) => f.geometry.coordinates;
  function pip(pt, rings) { let ins = false; for (const r of rings) { for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0]) ins = !ins; } } return ins; }
  const predio = () => D.predios.features.find((f) => f.properties.id === sel);
  const seleccion = () => { const f = predio(); return f ? amen.filter((r) => pip([r.lon, r.lat], ring(f))) : amen; };
  const todosSel = () => { const f = predio(); return f ? regs.filter((r) => pip([r.lon, r.lat], ring(f))) : regs; };
  const pts = (fn) => ({ type: 'FeatureCollection', features: seleccion().filter(fn).map((r) => ({ type: 'Feature', properties: { e: r.e, c: r.c || '', u: r.u, n: r.n, p: r.p || '', z: r.z, k: r.k }, geometry: { type: 'Point', coordinates: [r.lon, r.lat] } })) });

  function tabla() {
    const rs = seleccion(), all = todosSel(), f = predio();
    const sp = {}; rs.forEach((r) => { const o = sp[r.e] = sp[r.e] || { e: r.e, u: r.u, a: r.a, c: r.c, n: 0, x: {} }; o.n += r.n; o.x[r[modo]] = (o.x[r[modo]] || 0) + r.n; });
    const cols = [...new Set(rs.map((r) => r[modo]))].sort((a, b) => rs.filter((r) => r[modo] === b).reduce((s, r) => s + r.n, 0) - rs.filter((r) => r[modo] === a).reduce((s, r) => s + r.n, 0));
    const ord = { CR: 0, EN: 1, VU: 2 }, filas = Object.values(sp).sort((a, b) => (b.a - a.a) || (ord[a.u] - ord[b.u]) || b.n - a.n);
    const mx = Math.max(1, ...filas.flatMap((o) => Object.values(o.x)));
    $('#rrH').innerHTML = `<tr><th></th><th>Especie</th><th>UICN</th><th class="n">Reg.</th>${cols.map((c) => `<th class="n">${esc(c.replace('Zona de ', ''))}</th>`).join('')}</tr>`;
    $('#rrB').innerHTML = filas.length ? filas.map((o) => `<tr><td><img src="${ico(o.u, o.a)}" width="20" height="20" alt=""></td><td><i>${esc(o.e)}</i>${o.c ? `<br><small>${esc(o.c)}</small>` : ''}</td><td>${o.u}</td><td class="n">${o.n}</td>${cols.map((c) => { const v = o.x[c] || 0; return `<td class="n h" style="background:rgba(224,53,31,${v ? 0.08 + 0.55 * v / mx : 0})">${v || ''}</td>`; }).join('')}</tr>`).join('') : `<tr><td colspan="9">Sin registros de ranas amenazadas en este polígono (puede no haber sido muestreado).</td></tr>`;
    const nA = rs.filter((r) => r.a).reduce((s, r) => s + r.n, 0), nAm = rs.reduce((s, r) => s + r.n, 0), nT = all.reduce((s, r) => s + r.n, 0);
    $('#rrRes').innerHTML = f ? `<b>${esc(f.properties.nombre)}</b> · ${esc(f.properties.estado)} · ${F(f.properties.area_vertices_ha)} ha (${F(f.properties.pct_en_rab)} % dentro de la RAB). Dentro del polígono: ${nT} registros de herpetofauna, ${nAm} de especies amenazadas o <i>Andinobates</i> (${Object.keys(sp).length} taxones), ${nA} de <i>Andinobates</i>.` : `<b>Toda la reserva</b>: ${nAm} registros de ${Object.keys(sp).length} taxones amenazados o <i>Andinobates</i>; ${nA} son de <i>Andinobates daleswansoni</i>.`;
    $('#rrSub').textContent = f ? f.properties.nombre : 'Toda la reserva';
  }
  function mapa() {
    if (!m || !m.getSource('rr-a')) return;
    m.getSource('rr-a').setData(pts((r) => r.a)); m.getSource('rr-o').setData(pts((r) => !r.a));
    const f = predio(), W = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
    m.getSource('rr-m').setData(f ? { type: 'Feature', geometry: { type: 'Polygon', coordinates: [W, ...ring(f)] } } : { type: 'FeatureCollection', features: [] });
    m.getSource('rr-s').setData(f ? { type: 'Feature', geometry: f.geometry } : { type: 'FeatureCollection', features: [] });
    if (f) { const b = [999, 999, -999, -999]; ring(f)[0].forEach((p) => { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 60, maxZoom: 17, duration: 800 }); }
    else if (window.RAB && RAB.datos && RAB.datos.zonas) RAB.mapa.aZona && RAB.mapa.aZona('toda');
  }
  function vis() { ['rr-oi', 'rr-ai'].forEach((l) => m.getLayer(l) && m.setLayoutProperty(l, 'visibility', ver ? 'visible' : 'none')); }
  async function montar() {
    await RABICON.registrar(m);
    const vacio = { type: 'FeatureCollection', features: [] };
    ['rr-a', 'rr-o', 'rr-m', 'rr-s'].forEach((s) => m.addSource(s, { type: 'geojson', data: vacio }));
    m.addSource('rr-p', { type: 'geojson', data: D.predios });
    m.addLayer({ id: 'rr-pl', type: 'line', source: 'rr-p', paint: { 'line-color': '#fff', 'line-width': 1, 'line-dasharray': [3, 2], 'line-opacity': 0.8 } });
    m.addLayer({ id: 'rr-mk', type: 'fill', source: 'rr-m', paint: { 'fill-color': '#0d1712', 'fill-opacity': 0.55 } });
    m.addLayer({ id: 'rr-sl', type: 'line', source: 'rr-s', paint: { 'line-color': '#f2c14e', 'line-width': 3 } });
    m.addLayer({ id: 'rr-oi', type: 'symbol', source: 'rr-o', layout: { 'icon-image': ['concat', 'rana-', ['get', 'u']], 'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.7, 17, 1.25], 'icon-allow-overlap': true } });
    m.addLayer({ id: 'rr-ai', type: 'symbol', source: 'rr-a', layout: { 'icon-image': 'rana-andi', 'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.95, 17, 1.6], 'icon-allow-overlap': true } });
    ['rr-oi', 'rr-ai'].forEach((l) => { m.on('click', l, (e) => { const p = e.features[0].properties; e.originalEvent.__rr = 1; new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<b><i>${esc(p.e)}</i></b><br>${p.c ? esc(p.c) + '<br>' : ''}UICN: ${p.u} · ${p.n} registro(s)<br>Zona: ${esc(p.z)}<br>Cobertura: ${esc(p.k)}<br>Predio: ${esc(p.p) || '—'}`).addTo(m); }); m.on('mouseenter', l, () => m.getCanvas().style.cursor = 'pointer'); m.on('mouseleave', l, () => m.getCanvas().style.cursor = ''); });
    mapa(); vis(); tabla();
    setInterval(() => { const L = m.getStyle().layers; if (L[L.length - 1].id !== 'rr-ai') ['rr-pl', 'rr-mk', 'rr-sl', 'rr-oi', 'rr-ai'].forEach((l) => m.getLayer(l) && m.moveLayer(l)); }, 1200);
  }
  $('#rrPredio').onchange = (e) => { sel = e.target.value; mapa(); tabla(); };
  $('#rrVer').onchange = (e) => { ver = e.target.checked; vis(); };
  $('#rrTg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; modo = b.dataset.m; $('#rrTg').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); tabla(); };
  tabla();
  const t = setInterval(() => { const mp = window.RAB && RAB.mapa && RAB.mapa.listo && RAB.mapa.map; if (mp && mp.isStyleLoaded()) { clearInterval(t); m = mp; montar(); } }, 400);
})();
