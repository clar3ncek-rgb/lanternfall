# Brief: hand-drawn 32 px icons for The Unwritten: Lanternfall

Project: `C:\AI Workspace\Hobby\Unwritten Tapper\` (TypeScript, Vite). A phone idle RPG with dark gothic pixel art (lanterns, bells, graves, ferrymen). Clarence approved the style of the samples and asked for **every icon hand-drawn, one unique picture each**.

## Your job
Fill ONE group file: `src/ui/pixel/icons/<group>.ts` (you are told which). Draw an icon for **every id** that `ICON_GROUPS.<group>()` in `src/ui/pixel/icon-list.ts` returns. Touch no other file (other helpers are editing the other group files at the same time). Do not run `npm run build` (it rewrites `dist/`, shared with others).

## How an icon is made
Read `src/ui/pixel/icon-kit.ts` (palette `P`, frame colours `FRAME`, `IconDef`) and `src/ui/pixel/core.ts` (class `Grid`: `px`, `rect`, `spans`, `ellipse`, `line`, `swap`, `stamp`). The approved samples are in `src/ui/pixel/icons32-samples.ts`: copy their quality and approach.

```ts
import type { IconDef } from '../icon-kit';
export const ICONS: Record<string, IconDef> = {
  // Twinfang: two fang-daggers crossed
  ro0: { frame: 'phys', art: (g) => { g.line(7, 19, 20, 6, 'n') /* ... */; } },
};
```
- The art grid is **28x28** (x, y from 0 to 27). It is outlined automatically in dark ('o') and drawn inside the frame. Keep 1 px clear at the edges so the outline fits.
- Use **light, mid and dark** of a colour for form (light top-left, dark bottom-right), a few `w`/`y` sparkle pixels, and a clear silhouette. Fill the space: the subject should span about 18 to 26 px.
- **Read it at 32 px on a phone**: one bold idea per icon, no tiny text, no letters, no numbers.
- `frame`: the element or kind that fits: `phys`, `magic`, `fire`, `cold`, `lightning`, `poison`, `gold`, `blood`, `holy`, `nature`, `shadow`, `stat`, `ult`. Ultimates use `'ult'` (gets a double rim). Emblems (class, subclass, race, form) use the colour that best fits who they are.
- Optional `pal` adds or replaces palette letters for one icon (for example a special colour).
- Every icon in your group must look **different from the others** in your group (different subject, not just recoloured). Base the picture on the name and text in icon-list (the item's `text` is the in-game description; open `src/rules/data.ts`, `src/rules/content.ts` or `src/rules/tiers-content.ts` if you need more).
- Gothic fantasy tone. No real brands, no copied art from other games.

## Check your work (required)
1. Start your own dev server in the background on your port: `npx vite --port <PORT> --strictPort` (from the project folder).
2. Type-check: `npx tsc --noEmit -p .` must show no errors in your file.
3. Screenshot your sheet with headless Edge (it may hang after writing the file; the `timeout` handles that):
   `timeout 100 "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --screenshot="C:\AI Workspace\Hobby\Unwritten Tapper\samples\icons-<group>.png" --window-size=900,1500 "http://localhost:<PORT>/?icons=<group>"`
   (raise the height if the sheet is cut off). The sheet shows each icon at 64 px and 32 px with its name; missing ones show a red "?".
4. Look at the PNG. Check every icon for: the subject reads clearly at 32 px, nothing broken or stray (lines that miss, holes, stripes), not muddy, all different. Fix and re-shoot. At least two passes.
5. Stop your dev server when done.

## Report back (short)
- The group, how many icons drawn of how many needed (must be all).
- The path of your final sheet PNG.
- Any icon you are unsure about, in one line each.
