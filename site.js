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
