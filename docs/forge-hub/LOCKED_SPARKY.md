# LOCKED — Sparky (2026-09-14)

## Files
- `public/forge-hub/sparky/LOCKED_SPARKY.png` — canonical concept (SHA in `public/forge-hub/SHA256SUMS`)
- `docs/sparky/SPARKY-CHARACTER-SPEC.md` — master spec for modelling, rigging, animation, face, outfits, behaviour

## Product role
Sparky is the kid's companion inside the Hologram-Forge Hub. A fully rigged 3D character who lives on the desk the SF emitter sits on, walks between desk spots, looks at and points to the hologram the kid is using, reacts to games, wears outfits by season and occasion, and talks through a small hologram projected from the module on top of his head. On tablets, phones, and no-GPU desktops he appears as 2D stills rendered from the same model.

## Locked visual language
- **Chibi humanoid robot.** Head about a third of total height. Rounded shell parts over black ball joints. Five-fingered hands. Rounded boots.
- **Palette.** Coral shell. Black joints and inner mechanics. Cyan for everything that emits: face screen, chest badge, head dome, ear discs, boot lights. Yellow lightning-bolt decals on shoulders, forearms, hips, and boots.
- **Face.** Black rounded screen with dot-matrix cyan eyes and smile. The face is a screen and is driven as a live texture; the nine expressions are redrawn in LED-dot style.
- **Head dome.** Translucent cyan module with a sparkle inside, on the crown. It is the emitter for the chat hologram (`HoloBubble`, plan §2.8b). **Nothing may cover the dome.** Hats and hoods are rings or have a cutout.
- **Chest badge.** Cyan "S" on a rounded plate. Emissive; pulses on cheer, dims when sleepy; an outfit swap zone.
- **Decals.** Bolts and the "S" plate are material slots; outfits re-theme them (bats, snowflakes, stars) without new geometry.
- **Warmth.** Coral sits in the rose-gold and cream room; cyan matches the holograms. Sparky reads as part of the forge, not a sticker on it.

## Obsolete
- Chrome robot orb (`SparkyCore.tsx` drawing, `sparky-reference.jpeg`, Rive spec §1) — superseded; see `public/forge-hub/sparky/LOCKED.md`.
- ForgeSpark mascot variant (Concept 10 §11) — superseded by this lock; the `forgespark.riv` asset is never authored.
- Cockpit-era guide avatar concepts (`src/components/3d/_SUPERSEDED/GuideAvatar3D.tsx`: Orb, Fox, Drone, Spark, Nova) — archived.

## Decisions carried
- Rive `SparkyMachine` contract (`comboTier`, `celebrate`, `encourage`, `thinking`) is unchanged for the in-game 72 px mount so the 42 games never wait on the character.
- Chat is text-only in v1; synthesized voice is a later option that would play from the dome.
- Year-one outfit catalog: `docs/forge-hub/TRANSITION_ACTION_PLAN.md` §6b.
