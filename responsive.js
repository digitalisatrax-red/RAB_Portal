(function(){
 function closeAll(){var h=document.querySelector('header.top');if(h){h.classList.remove('open');var b=h.querySelector('.mb');if(b)b.setAttribute('aria-expanded','false');}}
 document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('header.top .mb');
  if(b){var h=b.closest('header.top');var o=h.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');return;}
  if(e.target.closest&&e.target.closest('header.top nav a'))closeAll();
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});
})();
