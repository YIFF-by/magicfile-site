// Keep the native control semantics; motion only enhances fine-pointer interaction.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
const surfaces = [...document.querySelectorAll('.motion-surface')];
const resets = [];
for (const surface of surfaces) {
  let frame = 0, pending = null, bounds = null;
  const reset = () => {
    cancelAnimationFrame(frame); frame = 0; pending = null; bounds = null;
    for (const name of ['--move-x','--move-y','--tilt-x','--tilt-y','--surface-scale','--glow-x','--glow-y']) surface.style.removeProperty(name);
    delete surface.dataset.motionActive;
  };
  resets.push(reset);
  surface.addEventListener('pointerenter', () => {
    if (reduced.matches || !pointer.matches) return;
    bounds = surface.getBoundingClientRect();
  });
  surface.addEventListener('pointermove', event => {
    if (reduced.matches || !pointer.matches || !bounds) return;
    pending = {x:event.clientX,y:event.clientY};
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!pending || !bounds) return;
      const x = Math.max(-.5,Math.min(.5,(pending.x-bounds.left)/bounds.width-.5));
      const y = Math.max(-.5,Math.min(.5,(pending.y-bounds.top)/bounds.height-.5));
      surface.style.setProperty('--move-x',`${x*4}px`);
      surface.style.setProperty('--move-y',`${y*4}px`);
      surface.style.setProperty('--tilt-x',`${-y*3}deg`);
      surface.style.setProperty('--tilt-y',`${x*3}deg`);
      surface.style.setProperty('--surface-scale','1.015');
      surface.style.setProperty('--glow-x',`${(x+.5)*100}%`);
      surface.style.setProperty('--glow-y',`${(y+.5)*100}%`);
      surface.dataset.motionActive='true';
    });
  },{passive:true});
  for (const event of ['pointerleave','pointercancel','blur']) surface.addEventListener(event,reset);
}
for (const query of [reduced,pointer]) query.addEventListener('change',()=>resets.forEach(reset=>reset()));
addEventListener('resize',()=>resets.forEach(reset=>reset()),{passive:true});
document.addEventListener('visibilitychange',()=>{
  document.documentElement.classList.toggle('page-hidden',document.hidden);
  if(document.hidden)resets.forEach(reset=>reset());
});

// One shared highlight keeps the navigation a single surface.
const navigation = document.querySelector('.masthead nav');
if (navigation) {
  const links = [...navigation.querySelectorAll('a')];
  let hovered = null;
  const updateHighlight = () => {
    const focused = links.includes(document.activeElement) ? document.activeElement : null;
    const active = links.find(link => link.hash === location.hash);
    for (const link of links) {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    const target = hovered || focused || active;
    if (!target) { delete navigation.dataset.highlight; return; }
    navigation.style.setProperty('--nav-x', `${target.offsetLeft}px`);
    navigation.style.setProperty('--nav-width', `${target.offsetWidth}px`);
    navigation.dataset.highlight = 'true';
  };
  for (const link of links) {
    link.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch' || !pointer.matches) return;
      hovered = link; updateHighlight();
    });
  }
  const clearHover = () => { hovered = null; updateHighlight(); };
  navigation.addEventListener('pointerleave', clearHover);
  navigation.addEventListener('pointercancel', clearHover);
  navigation.addEventListener('focusin', updateHighlight);
  navigation.addEventListener('focusout', () => requestAnimationFrame(updateHighlight));
  addEventListener('hashchange', updateHighlight);
  addEventListener('resize', clearHover, {passive:true});
  pointer.addEventListener('change', clearHover);
  document.addEventListener('visibilitychange', clearHover);
  document.fonts.ready.then(updateHighlight);
  updateHighlight();
}
