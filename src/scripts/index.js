/* Scripts extraídos de index.html */

const nav=document.getElementById('nav');
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>40));

  // reveal on scroll
  const io=new IntersectionObserver((entries)=>{
    entries.forEach((e)=>{
      if(e.isIntersecting){
        const sibs=[...e.target.parentElement.querySelectorAll('.reveal')];
        e.target.style.transitionDelay=(sibs.indexOf(e.target)%6*90)+'ms';
        e.target.classList.add('in');io.unobserve(e.target);
      }
    });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // carousel
  const car=document.getElementById('carousel');
  const step=()=>Math.min(car.clientWidth*.6,580);
  document.getElementById('carNext').onclick=()=>car.scrollBy({left:step(),behavior:'smooth'});
  document.getElementById('carPrev').onclick=()=>car.scrollBy({left:-step(),behavior:'smooth'});