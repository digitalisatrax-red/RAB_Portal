/* Íconos de ranas amenazadas (vista dorsal) para MapLibre. Color por categoría UICN. */
window.RABICON=(function(){
  var COL={ANDI:'#e5351f',CR:'#7a0f3d',EN:'#e0701a',VU:'#d9ae1c',NT:'#7d8a80',LC:'#7d8a80'};
  function svg(fill,leg,halo){
    var h=halo?'<circle cx="32" cy="34" r="30" fill="none" stroke="#f2c14e" stroke-width="3"/>':'';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">'+h+
    '<g fill="'+leg+'" stroke="#fff" stroke-width="2.4" stroke-linejoin="round">'+
    '<path d="M23 42 L8 53 L14 59 L29 49Z"/><path d="M41 42 L56 53 L50 59 L35 49Z"/>'+
    '<path d="M24 27 L10 22 L8 29 L24 35Z"/><path d="M40 27 L54 22 L56 29 L40 35Z"/></g>'+
    '<g fill="'+fill+'" stroke="#fff" stroke-width="2.4"><ellipse cx="32" cy="39" rx="11" ry="14"/><ellipse cx="32" cy="22" rx="10" ry="9"/></g>'+
    '<circle cx="26" cy="16" r="3.6" fill="#fff"/><circle cx="38" cy="16" r="3.6" fill="#fff"/><circle cx="26" cy="16" r="1.6" fill="#111"/><circle cx="38" cy="16" r="1.6" fill="#111"/></svg>';
  }
  function img(s){return new Promise(function(ok,no){var i=new Image(64,64);i.onload=function(){ok(i)};i.onerror=no;i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)})}
  async function registrar(map){
    var def={'rana-andi':svg(COL.ANDI,'#5a3418',true),'rana-CR':svg(COL.CR,COL.CR),'rana-EN':svg(COL.EN,COL.EN),'rana-VU':svg(COL.VU,COL.VU),'rana-NT':svg(COL.NT,COL.NT)};
    for(var k in def){if(!map.hasImage(k))map.addImage(k,await img(def[k]),{pixelRatio:2})}
  }
  return {COL:COL,svg:svg,registrar:registrar,dataUri:function(c,leg,halo){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(c,leg||c,halo))}};
})();
