/* Análisis por predio: selector de predio + selector de análisis. Datos: RABANA (ana-datos.js), calculados por intersección
   de los 28 polígonos individuales con las capas del visor (EPSG:9377). No altera el resto del tablero. */
(function(){
  if(!window.RABANA||!window.RABDATA) return;
  var A=RABANA, PR=RABDATA.predios.features.map(function(f){return f.properties});
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var f1=function(x){return (Math.round(x*10)/10).toLocaleString('es-CO')};
  var NAT=/Bosque denso|Vegetacion secundaria|Arbustal/;
  var ANA=[
   {k:'cobertura',t:'Cobertura de la tierra',g:'Ambiental',u:'ha',fu:'capa de cobertura de la cuenca del río Tenerife (Corpocaldas) recortada a la RAB en el visor FCV; escala regional, más gruesa que el inventario de campo.',
    ex:function(d,r){var nat=0,pas=0,mos=0,tot=0;d.forEach(function(x){tot+=x[1];if(NAT.test(x[0]))nat+=x[1];else if(/Pastos/.test(x[0]))pas+=x[1];else mos+=x[1]});
      return 'De '+f1(tot)+' ha cartografiadas, '+f1(nat)+' ha ('+Math.round(100*nat/tot)+'%) son cobertura natural densa o en transición, '+f1(mos)+' ha ('+Math.round(100*mos/tot)+'%) son mosaicos y bosque fragmentado con pastos y '+f1(pas)+' ha ('+Math.round(100*pas/tot)+'%) pastos. Esto marca el potencial de restauración: los mosaicos y pastos son las áreas donde la conexión de hábitat para anfibios gana más. La capa regional es más gruesa que el inventario de campo, por eso el bosque avanzado que reporta FCV (≈70%) aparece subestimado.'}},
   {k:'zona',t:'Zonificación de manejo',g:'Territorio',u:'ha',fu:'Plan de manejo de la RAB, zonificación vigente (FCV).',
    ex:function(d,r){var c=0,tot=0;d.forEach(function(x){tot+=x[1];if(/conserv/i.test(x[0]))c+=x[1]});return f1(c)+' ha ('+Math.round(100*c/tot)+'%) de lo que está dentro de la reserva en este predio es zona de conservación. Las zonas de restauración y de uso intensivo concentran las acciones de recuperación y los equipamientos; ahí se decide el equilibrio entre visitantes y hábitat.'}},
   {k:'uso',t:'Uso del suelo y vocación',g:'Territorio',u:'ha',fu:'Capa de uso y oferta ambiental de la RAB (visor FCV).',
    ex:function(d){var c=0,tot=0;d.forEach(function(x){tot+=x[1];if(/Conservaci/i.test(x[0]))c+=x[1]});return 'El '+Math.round(100*c/tot)+'% del predio está clasificado como área prioritaria para la conservación; el resto es protección–producción. Es la base técnica para argumentar ante donantes que la compra de este predio protege suelo con vocación de conservación.'}},
   {k:'geomorf',t:'Geomorfología',g:'Ambiental',u:'ha',fu:'geomorfología de la RAB (2012), visor FCV.',ex:function(d){return 'La unidad dominante es «'+d[0][0]+'» ('+f1(d[0][1])+' ha). Las laderas escarpadas condicionan la erosión, el acceso y la ubicación segura de senderos y edificaciones.'}},
   {k:'suelo',t:'Suelos (IGAC)',g:'Ambiental',u:'ha',fu:'capa de tipo de suelo IGAC de la cuenca del río Tenerife (Corpocaldas), recortada a la RAB en el visor FCV.',ex:function(d){return 'Predomina «'+d[0][0]+'» ('+f1(d[0][1])+' ha). Las tierras con pendiente mayor a 75% no son aptas para uso agropecuario: su mejor destino es la protección.'}},
   {k:'microcuenca',t:'Microcuencas (agua)',g:'Ambiental',u:'ha',fu:'Microcuencas La Honda, La Cristalina, Santa Rosa y Santa Teresa (FCV); subcuenca río Tenerife, cuenca río La Miel.',ex:function(d){return 'El predio aporta agua principalmente a la '+d[0][0]+' ('+f1(d[0][1])+' ha). Proteger estas laderas asegura caudal y calidad del agua para la vereda y para el río Tenerife aguas abajo.'}}
  ];
  var FIX=[
   {k:'hid',t:'Agua y accesos',g:'Territorio'},{k:'rie',t:'Riesgos y presiones',g:'Social'},
   {k:'aves',t:'Biodiversidad: aves',g:'Ambiental'},{k:'herpetos',t:'Biodiversidad: anfibios y reptiles',g:'Ambiental'},
   {k:'mamiferos',t:'Biodiversidad: mamíferos',g:'Ambiental'},{k:'mariposas',t:'Biodiversidad: mariposas y polillas',g:'Ambiental'},
   {k:'res',t:'Ficha resumen del predio',g:'Resumen'}];
  var RIE=[['deslizamientos','Deslizamientos'],['incendios','Incendios'],['minas','Minería'],['ingresos','Ingresos no autorizados'],['contaminacion','Contaminación'],['extraccion','Extracción']];
  var card=document.createElement('section');card.className='card';card.id='cardAna';
  card.innerHTML='<div class="card-head"><div><h2>ANÁLISIS POR PREDIO | CUALQUIER DIMENSIÓN</h2><small>Elija el predio y la pregunta; el resultado se explica abajo</small></div></div>'+
  '<style>#cardAna .ra{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}#cardAna select{flex:1 1 220px;padding:8px;border:1px solid var(--edge,#ccc);border-radius:6px;background:#fff;color:inherit;font:inherit}'+
  '#cardAna .bar{display:grid;grid-template-columns:minmax(120px,38%) 1fr 96px;gap:8px;align-items:center;font-size:.82rem;margin:5px 0}#cardAna .bar i{display:block;height:14px;border-radius:3px;background:#2f7d4f}'+
  '#cardAna .ex{background:rgba(47,125,79,.1);border-left:4px solid #2f7d4f;padding:10px 12px;margin:10px 0;font-size:.88rem;line-height:1.5}#cardAna .kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:8px 0}'+
  '#cardAna .kp div{border:1px solid var(--edge,#ccc);border-radius:8px;padding:8px;text-align:center}#cardAna .kp b{display:block;font-size:1.3rem;color:#2f7d4f}#cardAna .kp span{font-size:.72rem}#cardAna table{width:100%;border-collapse:collapse;font-size:.78rem}#cardAna td,#cardAna th{padding:4px 6px;border-bottom:1px solid var(--edge,#ddd);text-align:right}#cardAna td:first-child,#cardAna th:first-child{text-align:left}</style>'+
  '<div class="ra"><select id="anP" aria-label="Predio"><option value="_RAB">Toda la reserva (461,7 ha)</option>'+PR.map(function(p){return '<option value="'+p.id+'">'+esc(p.nombre)+' ('+f1(p.area_vertices_ha)+' ha)</option>'}).join('')+'</select>'+
  '<select id="anA" aria-label="Análisis">'+['Ambiental','Territorio','Social','Resumen'].map(function(g){return '<optgroup label="'+g+'">'+ANA.concat(FIX).filter(function(a){return a.g===g}).map(function(a){return '<option value="'+a.k+'">'+a.t+'</option>'}).join('')+'</optgroup>'}).join('')+'</select></div>'+
  '<div id="anOut"></div><details style="margin-top:10px"><summary style="cursor:pointer;font-size:.85rem"><b>Comparar los 28 predios</b> en este análisis</summary><div class="sc" id="anCmp" style="overflow:auto;max-height:420px"></div></details><p class="fuente" id="anF"></p>';
  function place(){var a=document.getElementById('cardRanas');if(a&&a.parentNode){a.parentNode.insertBefore(card,a.nextSibling);return true}return false}
  var t=setInterval(function(){if(place()){clearInterval(t);start()}},400);
  function $(s){return card.querySelector(s)}
  function bars(d,tot){return d.map(function(x){var p=100*x[1]/tot;return '<div class="bar"><span>'+esc(x[0])+'</span><i style="width:'+Math.max(p,1.5)+'%"></i><b>'+f1(x[1])+' ha · '+Math.round(p)+'%</b></div>'}).join('')}
  function kp(a){return '<div class="kp">'+a.map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('')+'</div>'}
  function render(){
    var id=$('#anP').value,k=$('#anA').value,r=A[id],nom=id==='_RAB'?'la Reserva Andinobates Boquerón':'el predio '+esc((PR.filter(function(p){return p.id===id})[0]||{}).nombre),h='',fu='';
    var def=ANA.filter(function(a){return a.k===k})[0];
    if(def){var d=r[k]||[],tot=d.reduce(function(s,x){return s+x[1]},0);
      h=d.length?kp([[f1(tot),'ha analizadas'],[d.length,'clases'],[f1(d[0][1]),esc(d[0][0])]])+bars(d,tot)+'<div class="ex">'+def.ex(d,r)+'</div>':'<p>Sin datos para esta capa en '+nom+'.</p>';fu=def.fu;
      cmp(function(q){var d=q[k]||[];return d.length?[d[0][0],f1(d[0][1])]:['—','—']},['Clase dominante','ha'])}
    else if(k==='hid'){h=kp([[r.hidro_km+' km','red hídrica dentro'],[r.vias_km+' km','vías y caminos'],[r.microcuenca&&r.microcuenca[0]?r.microcuenca[0][0].replace('Quebrada ','Q. '):'—','microcuenca principal']])+'<div class="ex">En '+nom+' hay '+r.hidro_km+' km de cauces y '+r.vias_km+' km de caminos. Donde senderos y quebradas se cruzan hay que cuidar vados y sedimentos: el agua que sale de aquí alimenta el río Tenerife y la cuenca del río La Miel.</div>';fu='Red hídrica y vías/caminos, visor FCV. Longitudes por intersección.';
      cmp(function(q){return [q.hidro_km,q.vias_km]},['Cauces km','Vías km'])}
    else if(k==='rie'){var s=RIE.reduce(function(a,x){return a+(r[x[0]]||0)},0);h=kp(RIE.map(function(x){return [r[x[0]]||0,x[1]]}))+'<div class="ex">'+(s?'En '+nom+' se registraron '+s+' puntos de presión o amenaza georreferenciados. Son la base para priorizar vigilancia, cercos vivos y restauración.':'En '+nom+' no hay puntos de amenaza georreferenciados en las capas del visor; esto no descarta riesgos aún no levantados.')+'</div>';fu='Capas de riesgos y presiones del visor FCV (puntos dentro del polígono).';
      cmp(function(q){return [RIE.reduce(function(a,x){return a+(q[x[0]]||0)},0),q.parcelas]},['Puntos de riesgo','Parcelas monitoreo'])}
    else if(['aves','herpetos','mamiferos','mariposas'].indexOf(k)>-1){var b=(r.bio||{})[k];
      h=b?kp([[b.reg,'registros'],[b.esp,'especies']])+'<table><tr><th>Especie más registrada</th><th>Individuos</th></tr>'+b.top.map(function(x){return '<tr><td><i>'+esc(x[0])+'</i></td><td>'+x[1]+'</td></tr>'}).join('')+'</table><div class="ex">Dentro de '+nom+' hay '+b.reg+' registros georreferenciados de '+b.esp+' especies. Cuantos más registros, más esfuerzo de muestreo: compare riqueza con cautela, porque un predio poco visitado no es necesariamente pobre en especies.</div>':'<p>Sin registros georreferenciados de este grupo en '+nom+'.</p>';
      fu='Registros georreferenciados de monitoreo FCV (biodiversidad.json). Para anfibios amenazados use la tarjeta superior.';
      cmp(function(q){var b=(q.bio||{})[k];return b?[b.reg,b.esp]:[0,0]},['Registros','Especies'])}
    else{var g=function(x){return (r.bio&&r.bio[x])?r.bio[x].esp:0},c=r.cobertura&&r.cobertura[0]?r.cobertura[0][0]:'—';
      h=kp([[f1(r.ha)+' ha','área'],[g('aves'),'aves'],[g('herpetos'),'anfibios y reptiles'],[g('mamiferos'),'mamíferos'],[g('mariposas'),'mariposas y polillas']])+
      '<div class="ex">'+nom.replace(/^./,function(c){return c.toUpperCase()})+' ocupa '+f1(r.ha)+' ha. Cobertura dominante: '+esc(c)+'. Zona principal: '+esc(r.zona&&r.zona[0]?r.zona[0][0]:'—')+'. Agua: '+esc(r.microcuenca&&r.microcuenca[0]?r.microcuenca[0][0]:'—')+'. Use el selector para profundizar en cada dimensión.</div>';fu='Síntesis de todas las capas anteriores.';
      cmp(function(q){return [f1(q.ha),(q.zona&&q.zona[0])?q.zona[0][0].replace('Zona de ',''):'—']},['ha','Zona principal'])}
    $('#anOut').innerHTML=h;$('#anF').textContent='Fuente: '+fu+' Cálculo propio en EPSG:9377; resultado preliminar, no sustituye levantamiento de campo.';
  }
  function cmp(fn,hd){var rows=PR.map(function(p){var v=fn(A[p.id]||{});return '<tr><td>'+esc(p.nombre)+'</td><td>'+v[0]+'</td><td>'+v[1]+'</td></tr>'}).join('');
    $('#anCmp').innerHTML='<table><tr><th>Predio</th><th>'+hd[0]+'</th><th>'+hd[1]+'</th></tr>'+rows+'</table>'}
  function start(){
    $('#anP').onchange=function(){var s=document.getElementById('rrPredio');if(s){s.value=this.value==='_RAB'?'':this.value;s.dispatchEvent(new Event('change'))}render()};
    $('#anA').onchange=render;
    var s=document.getElementById('rrPredio');if(s)s.addEventListener('change',function(){$('#anP').value=this.value||'_RAB';render()});
    render();
  }
})();
