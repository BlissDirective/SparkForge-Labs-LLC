# v0 Prompt — Floating Dock (Style 3: Holo-Deck Dashboard)

**Target:** v0.dev.
**Attach:** `../design-specs/style-3-cyberpunk-apple.json`
**Output target:** `<FloatingDock />` for `src/components/home/FloatingDock.tsx`. Persistent layer above all folds.

---

## Paste this into v0

Build the SparkForge `FloatingDock` — a **persistent, magnetic, pill-shaped glass dock** anchored to the bottom-center of the viewport. Replaces the cockpit's instrument cluster with an Apple-Mac-dock-inspired floating control. Always visible across all folds and routes. Iridescent ring border for the holo-aesthetic.

Use the attached `style-3-cyberpunk-apple.json` for ALL design tokens.

### Layout

- **Position:** `position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);`
- **Z-index:** 80 (above folds, below modals).
- **Size:** width `clamp(320px, 52vw, 540px)`, height 64 px.
- **Border-radius:** 9999px (full pill).
- **Background:**
  - Light: `rgba(255,255,255,0.78)` with `backdrop-filter: blur(28px) saturate(180%)`.
  - Dark: `rgba(11,15,30,0.62)` with `backdrop-filter: blur(28px) saturate(180%)`.
- **Iridescent ring border** (animated 8 s rotate, same trick as elsewhere).
- **Shadow:**
  - Light: `0 24px 56px -20px rgba(11,15,30,0.18), 0 0 0 1px rgba(11,15,30,0.04)`.
  - Dark: `0 24px 56px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(159,255,246,0.18)`.

### Internal layout

Flex row with 5 items, evenly spaced, padding 8 px:

```
┌─[home]──[labs]──[CONTINUE]──[arcade]──[profile]┐
            ↑           ↑
       icon button   primary FAB
                     (wider, labeled, lab-color)
```

The center item is a **primary FAB** (Floating Action Button) — wider, expandable, lab-colored. The other 4 are circular icon buttons.

### Icon button (4 of them: home, labs, arcade, profile)

```jsx
<button className={cn('dock-icon', { 'dock-icon-active': isActive })}>
  <Icon size={22} />
</button>
```

```css
.dock-icon {
  width: 48px; height: 48px; border-radius: 9999px;
  display: grid; place-items: center;
  color: var(--text-secondary);
  transition: transform 250ms cubic-bezier(0.32, 0.72, 0, 1), color 200ms;
}
.dock-icon:hover { color: var(--text-primary); transform: scale(1.18); }
.dock-icon-active {
  color: var(--lab-color); /* or fixed theme accent */
  box-shadow: 0 0 0 1px var(--lab-color), 0 0 16px color-mix(in srgb, var(--lab-color) 30%, transparent);
}
.dock-icon-active::after {
  content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
  width: 4px; height: 4px; border-radius: 50%; background: var(--lab-color);
}
```

The tiny dot below an active icon is the Apple-dock convention for "currently running".

### Primary FAB (continue button)

The middle slot. Wider — about 96 px wide × 48 px tall, but **expands on hover** to 160 px wide and reveals a label `Continue`.

```jsx
<button className="dock-fab" aria-label="Continue your current mission">
  <Play size={22} />
  <span className="dock-fab-label">Continue</span>
</button>
```

```css
.dock-fab {
  display: flex; align-items: center; gap: 8px;
  height: 48px; min-width: 48px; padding: 0 16px;
  border-radius: 9999px;
  background: var(--lab-color);
  color: white;
  transition: min-width 300ms cubic-bezier(0.32, 0.72, 0, 1), transform 250ms;
  overflow: hidden;
}
.dock-fab:hover { min-width: 160px; transform: translateY(-2px) scale(1.03); }
.dock-fab-label {
  opacity: 0; transform: translateX(-8px);
  transition: opacity 200ms 100ms, transform 250ms 100ms;
  font-family: var(--font-body); font-weight: 600; font-size: 14px;
  white-space: nowrap;
}
.dock-fab:hover .dock-fab-label { opacity: 1; transform: translateX(0); }
```

The FAB is the Continue Mission shortcut — clicking calls `onContinue()` prop.

### Magnetic-hover effect (Apple dock signature)

When the cursor hovers the dock, the icon CLOSEST to the cursor scales up most, with neighbors scaling smaller in a falloff. Implement in JS via rAF:

```ts
const handleMouseMove = (e: MouseEvent) => {
  const dockRect = dockRef.current!.getBoundingClientRect();
  const cursorX = e.clientX - dockRect.left;
  iconRefs.current.forEach((iconEl, idx) => {
    if (!iconEl) return;
    const iconCenter = iconEl.offsetLeft + iconEl.offsetWidth / 2;
    const distance = Math.abs(cursorX - iconCenter);
    const scale = Math.max(1, 1.18 - (distance / 100) * 0.18);
    iconEl.style.setProperty('--magnetic-scale', String(scale));
  });
};
```

```css
.dock-icon { transform: scale(var(--magnetic-scale, 1)); }
```

Throttle with rAF; reset all scales to 1 on `mouseleave`. Disable on `(pointer: coarse)`.

### Hide on scroll-down (optional)

When the user scrolls down quickly, the dock can slide-down out of view (translateY(120%)) and re-appear when they scroll up. Use `useScrollDirection()` hook with debounce. Toggleable via Settings prop `hideOnScroll` (default `true`).

### Profile menu (anchor-positioned)

Clicking the profile icon opens a small anchor-positioned menu:

```css
.profile-menu {
  position: absolute;
  position-anchor: --dock-profile-icon;
  bottom: anchor(top); right: anchor(center);
  margin-bottom: 12px; transform: translateX(50%);
}
```

Menu contents: `Profile`, `Switch Child`, `Settings`, `Sign Out` — 240 px wide glass card.

### Props

```ts
interface FloatingDockProps {
  currentRoute: '/home' | '/labs' | '/arcade' | '/profile';
  labColorHex: string;            // Continue FAB + active icon glow
  onContinue: () => void;
  onProfileMenuOpen?: () => void;
  hideOnScroll?: boolean;         // default true
}
```

### Motion

- **Initial entry:** dock slides up from `translateY(100%)` over 500 ms, easing `cubic-bezier(0.32, 0.72, 0, 1)`, delay 800 ms (after hero).
- **Iridescent ring:** 8 s linear infinite (CSS).
- **Magnetic hover:** rAF, lerp 0.2.
- **FAB expand:** width transition 300 ms easing snap.
- **Hide-on-scroll:** transform translateY animations 250 ms.
- **Reduced motion:** magnetic hover off (all scale 1), hide-on-scroll off (always visible), iridescent ring static.

### Accessibility

- `<nav aria-label="Primary dock navigation">`.
- Each icon is a `<Link>` with visible icon + `aria-label` (icon-only buttons must have aria-label per WCAG).
- Active route: `aria-current="page"`.
- FAB: `<button type="button" aria-label="Continue your current mission">`.
- Profile menu: anchor-positioned, opens on click + Enter, traps focus while open, closes on Escape.
- Reduced-motion handling above.
- Touch targets: each icon button is 48 × 48 px (above 44 minimum).

### Constraints

- TypeScript strict.
- Use `lucide-react` (Home, Beaker, Gamepad2, User, Play icons), `next/link`.
- Single file `src/components/home/FloatingDock.tsx`.

### Export

```ts
export default FloatingDock;
export type { FloatingDockProps };
```

---

## After v0 generates

1. Drop into `HomeShell` as `<FloatingDock />` rendered at the end (above folds layer).
2. Verify the dock appears as a pill at bottom-center, ~520 px wide, with 5 icons + a primary FAB.
3. The FAB is centered and visually distinct (lab-color background); the other 4 are circular icon buttons.
4. Hover the dock — icons should scale up Apple-style based on cursor proximity.
5. Hover the FAB — should expand horizontally and reveal "Continue" label.
6. The active route's icon should have a glow ring + tiny dot below it.
7. Iridescent ring border should be rotating (8 s).
8. Click profile icon — anchor-positioned menu appears above.

## If v0 misses the mark

- "Dock isn't pill-shaped — `border-radius: 9999px` and the iridescent rim should follow that radius perfectly."
- "Magnetic hover doesn't work — implement via JS rAF with cursor-distance calculation, NOT pure CSS hover."
- "FAB doesn't expand on hover — set `min-width` transition from 48 px → 160 px on hover, and the label should fade in from `opacity: 0` to `1` with delay 100 ms."
- "Active icon has no indicator — add the tiny 4 px dot below via `::after` pseudo-element with active-route's lab-color."
- "Dock is hidden behind page content — set `z-index: 80` and `position: fixed; bottom: 32px`."
