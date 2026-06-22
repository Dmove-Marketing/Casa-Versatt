/* ---- nav scroll state ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });

/* ---- reveal on scroll ---- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---- carousel ---- */
document.querySelectorAll('[data-carousel]').forEach(c => {
  const slides = [...c.querySelectorAll('.carousel__slide')];
  const dotsEl = c.querySelector('.carousel__dots');
  let idx = 0, timer;

  slides.forEach((_, n) => {
    const d = document.createElement('span');
    if (n === 0) d.className = 'active';
    d.onclick = () => go(n);
    dotsEl.appendChild(d);
  });

  const ds = [...dotsEl.children];

  function go(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    ds.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  c.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { go(idx + +b.dataset.dir); reset(); });

  function reset() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 5000); }
  if (slides.length > 1) reset();
});

/* ---- lightbox ---- */
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lbImg');
if (lb && lbImg) {
  const tiles = [...document.querySelectorAll('.tile')];
  const lbImages = tiles.map(t => t.querySelector('img')?.src || '');
  let lbIdx = 0;

  function openLb(i) { lbIdx = i; showLb(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function showLb() { lbImg.src = lbImages[lbIdx]; }

  tiles.forEach((tile, i) => tile.addEventListener('click', () => openLb(i)));
  document.getElementById('lbClose').onclick = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  lb.addEventListener('click', e => { if (e.target === lb) { lb.classList.remove('open'); document.body.style.overflow = ''; } });
  document.querySelectorAll('[data-lb]').forEach(b => b.onclick = () => { lbIdx = (lbIdx + +b.dataset.lb + lbImages.length) % lbImages.length; showLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') { lb.classList.remove('open'); document.body.style.overflow = ''; }
    if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbImages.length) % lbImages.length; showLb(); }
    if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbImages.length; showLb(); }
  });
}
