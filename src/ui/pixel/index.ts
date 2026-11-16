// Pixel-art battle view for Unwritten Tapper (layout C). Public API only; see the other files for the art.
//
//   const view = createBattleView(document.getElementById('battle')!);
//   view.setScene(scene)                          // every frame is fine; caches skip unchanged parts
//   view.strike(crit); view.foeHit(el, crit); view.namedHit(i, el); view.kill();
//   if (view.fairyHitTest(ev.clientX, ev.clientY)) ...
//   stripHost.innerHTML = namedStripHtml(named, unlocked);   // buttons: data-act="ally:i", data-long="namedinfo:i", data-act="tab:named"
//   style.css += PIXEL_CSS
export type { HeroLook } from './hero';
export type { FoeLook } from './foes';
export type { NamedLook } from './strip';
export type { PetLook, Scene, BattleView } from './view';
export { createBattleView } from './view';
export { namedStripHtml, PIXEL_CSS } from './strip';
export { spellIcon, itemIcon, petIcon, heroPortrait } from './icons';
/** Extra helpers that may be useful when wiring (not required by the brief). */
export { foeKind } from './foes';
export { PET_BODIES } from './allies';
