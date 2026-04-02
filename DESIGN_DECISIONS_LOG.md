# SparkForge Design Token Decisions Log

**Created:** April 1, 2026
**Status:** IN PROGRESS — 12 system-level sections locked, component-level design pending
**Purpose:** Record all design decisions for JSON spec extension + TS token generation

---

## SYSTEM-LEVEL DESIGN TOKENS (12 Sections — ALL LOCKED)

### Section 1: TYPOGRAPHY SCALE
| Detail | Choice | Description |
|--------|--------|-------------|
| 1.1 Type Levels | **7 levels** | display, h1, h2, h3, body, label, caption |
| 1.2 Size Scale | **Standard** | body 0.032, display 0.07 (balanced readability) |
| 1.3 Font Assignments | **Data everywhere** | Orbitron for ALL numeric values (XP, levels, %, counts, timers) |
| 1.4 Text Color Hierarchy | **Accent-aware 4-tier** | Primary #F0F0F4, Secondary 80%, Muted 50%, Dim 25% + section headers use mode accent color |

### Section 2: EDGE CATALOG
| Detail | Choice | Description |
|--------|--------|-------------|
| 2.1 Bevel Style | **Rounded+chamfer hybrid** | Structural=chamfer (hard cuts), interactive=rounded (inviting), display=sharp (clean screens) |
| 2.2 Border Radius | **Soft technical** | 4px/8px/12px (small/medium/large). Modern, Tesla-like. |
| 2.3 Chrome Thickness | **Bold frame** | 2px border with slight glow. Chrome is a defining visual feature. |
| 2.4 Edge Glow | **Pulse trace** | Line traces border AND pulses brightness (0.6→1.0→0.6 over 1.5s). Cockpit breathes. |

### Section 3: DEPTH LAYERS
| Detail | Choice | Description |
|--------|--------|-------------|
| 3.1 Layer Count | **8 layers** | deep-recess, recess, surface, low-raise, high-raise, content, glow, overlay |
| 3.2 Magnitude | **Moderate** | 0.005 per layer step. Visible depth at cockpit distance (1 foot). |
| 3.3 Screens | **Flush** | Screens level with panel surface. Clean, modern (tablet-in-desk). |
| 3.4 Buttons | **Tactile** | 2 layers above surface. Clearly pressable, visible sides. |

### Section 4: SPRING PRESETS
| Detail | Choice | Description |
|--------|--------|-------------|
| 4.1 Presets | **6 presets** | snap, crisp, smooth, bounce, heavy, dramatic |
| 4.2 Feel | **Mechanical satisfying** | Moderate overshoot, audible "thunk" settle. Sports car switches. |
| 4.3 Transitions | **Balanced** | 400ms crossfade, ease-out-cubic |
| 4.4 Celebrations | **Full spectacle, 3 tiers** | Minor (LED pulse, 1.5s) / Major (gold sweep+confetti, 3s) / Epic (full explosion+camera shake, 4s) |

### Section 5: EMISSIVE SCALE
| Detail | Choice | Description |
|--------|--------|-------------|
| 5.1 Levels | **6 levels** | off (0), dormant (0.15), dim (0.4), medium (0.8), bright (1.5), blazing (2.5) |
| 5.2 Idle | **Medium** | Buttons 0.8, indicators 0.5. Powered-on instrument panel feel. |
| 5.3 Hover Boost | **Clear 1.8x** | Obvious visual feedback. User always knows what they'll click. |
| 5.4 LED vs Controls | **LEDs 1.5x brighter** | Layered lighting — LEDs illuminate, controls respond. |

### Section 6: MODE COLOR TEMPERATURE
| Detail | Choice | Description |
|--------|--------|-------------|
| 6.1 Surface Tint | **Whisper 5%** | Barely perceptible panel tint. Color from LEDs/accents only. |
| 6.2 Chrome | **Neutral silver** | #a8b5c8 always. Chrome is a constant anchor. |
| 6.3 Fill Light | **Mode-matched + intensity** | Color AND brightness change per mode. Dashboard blue 0.3, game dim 0.15, celebration gold 0.6. |
| 6.4 Particles | **Mode-colored** | Particles shift to LED color with 1.5s crossfade. |

### Section 7: COMPONENT STATE MACHINES
| Detail | Choice | Description |
|--------|--------|-------------|
| 7.1 States | **6 states** | idle, hover, pressed, active, disabled, loading |
| 7.2 Active | **Glow hold** | Active elements maintain hover-level brightness permanently. |
| 7.3 Disabled | **Desaturated + dim** | Grayscale, 40% opacity, no hover response. Looks "powered off." |
| 7.4 Press Depth | **Standard 0.03** | Clear physical movement. Button visibly pushes in. |

### Section 8: SURFACE DETAIL
| Detail | Choice | Description |
|--------|--------|-------------|
| 8.1 Seams | **Subtle** | Thin dark lines (0.5px, 10% opacity) at logical panel break points. |
| 8.2 Texture | **Fine grain** | 2% noise intensity. Brushed metal feel, only visible up close. |
| 8.3 Wear | **Factory fresh** | Pristine. No scratches, no wear. Brand-new space station. |
| 8.4 Accent Lines | **Full trace** | Skeleton outlined in dim light along all edges, ribs, floor channels. |

### Section A: FOCUS & READABILITY ZONES
| Detail | Choice | Description |
|--------|--------|-------------|
| A.1 Strategy | **Brightness + DOF** | Priority quadrant full brightness + sharp. Others dim 70% + subtle blur. |
| A.2 Targets | **Mode-aware** | Dashboard/labs/arcade/game→center. Profile→center+left. Settings→center+right. |
| A.3 First Look | **Primary CTA** | Main action button is brightest element on page load. Action-oriented. |

### Section B: INFORMATION DENSITY
| Detail | Choice | Description |
|--------|--------|-------------|
| B.1 Max Items | **Balanced** | Activity: 5, Game grid: 12, Badges: 9, Trophies: 3, Gauges: 4 |
| B.2 Whitespace | **Comfortable 40%** | Element gaps = 40% of element size. Organized, room to breathe. |
| B.3 Overflow | **Paginate** | No scroll. Content splits into pages with next/prev controls. |
| B.4 Empty States | **Ghost placeholders** | Dim outlines at 10% opacity. Shows potential. "Fill these up!" |

### Section C: INTERACTION FEEDBACK CHAIN
| Detail | Choice | Description |
|--------|--------|-------------|
| C.1 Speed | **Ripple 0-300ms** | Energy propagates outward from click source. |
| C.2 Completeness | **Sector response** | Local quadrant + LED rim + StatusBar. Other quadrants stay still. |
| C.3 Audio Sync | **Simultaneous** | Sound and visual fire at frame 0. |
| C.4 Dampening | **Diminishing** | 1st click: 100%. 2nd within 500ms: 60%. 3rd+: 30%. |

### Section D: SPATIAL AUDIO
| Detail | Choice | Description |
|--------|--------|-------------|
| D.1 Falloff | **Flat** | All zones at defined volume. No distance attenuation. Consistent. |
| D.2 Density Default | **Moderate 0.5** | Clicks/toggles/dials have sound. Hover hum on buttons only. |
| D.3 Priority | **Ducking** | Highest-priority full volume. Others duck to 40%. |
| D.4 Lab Crossfade | **Hard cut** | Instant switch to new soundscape. Clean break. |

---

## COMPONENT-LEVEL DESIGN (PENDING)

The following individual cockpit components need visual design review before implementation:

### Component 11: CockpitPanels — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 11.1 Surface | **Smooth carbon** | Clean matte with 2% fine grain texture. Modern spacecraft. No plate segmentation. |
| 11.2 Rivets | **No rivets** | Clean surface, seam lines only. Ultra-modern. Accent lines provide structural definition. |
| 11.3 Color | **Accent-traced panels** | Standard dark #0A0F1F with full-trace accent lines along every rib and seam. Hull skeleton glows faintly. |

### Component 12: SidePanels — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 12.1 Shape | **Curved wing** | Gently curved surface following hull curvature. Flows naturally from main hull. Organic, integrated. |
| 12.2 Border | **Segmented chrome** | Chrome edge segments with gaps, matching CenterViewportScreen and HUD frame language. Visual consistency. |

### Component 13: CockpitFloor3D — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 13.1 Grating | **Hexagonal grid** | Honeycomb pattern grating. Futuristic, strong, matches geometric cockpit language. |
| 13.2 Sub-Floor | **Energy channels** | Glowing energy channels beneath grating in current mode LED color. Floor pulses faintly with power. Cockpit alive from below. |
| 13.3 Extent | **Full semicircle** | Floor extends across full 218-degree cockpit arc. Complete ground plane. Strong spatial anchor. |

### Component 14: CockpitStructuralDetail — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 14.1 Cables | **Hidden cables** | Cables inside recessed channels with panel covers. Visible covers, hidden cables. Tidy, premium. |
| 14.2 Vents | **Perforated circles** | Circular hole patterns in vent panels. Decorative, aerospace. |
| 14.3 Accent Lighting | **Key intersections** | Accent lighting only where structural elements meet (rib-to-panel, cable-to-rib joints). Highlights connections. Elegant. |

### HUD & Status
- [ ] HolographicHUD (ring count, ring styles, data arc format, reticle design)
- [ ] LEDRim (capsule shape, spacing, pulse wave style)
- [ ] StatusBar3D (speedometer style, flame design, lab indicator shape)

### Interactive Controls
- [x] HolographicButton — LOCKED (Component 2)
- [x] RadialDial3D — LOCKED (Component 3)
- [x] ToggleSwitch3D — LOCKED (Component 4)
- [x] NavigationButtonGrid — LOCKED (Component 1)
- [x] VariableDialCluster — LOCKED (Component 15)

### Content Displays
- [x] HolographicLabMap — LOCKED (Component 5)
- [x] HolographicCard — LOCKED (Component 16)
- [x] HolographicPanel — LOCKED (Component 17)

### Component 15: VariableDialCluster — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 15.1 Housing | **Individual pods** | Each dial has own circular mounting pod connected by thin chrome rails. Modular, industrial lab equipment feel. |
| 15.2 Arrangement | **Arc row** | 3 dials following cockpit hull curvature. Each angled slightly toward camera. Integrated, immersive. |
| 15.3 Label Transition | **Instant swap** | Labels change immediately on page switch. Clean, no animation. |

### Component 16: HolographicCard — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 16.1 Shape | **Chamfered rectangle** | 45-degree corner cuts matching HolographicButton. Visual consistency — buttons and cards share angular language. |
| 16.2 Surface | **Layered** | Solid carbon base with floating translucent accent-colored top edge strip. Readable body + holographic accent. Matches button dual-layer. |
| 16.3 Hover | **Edge trace + lift** | Card lifts slightly AND chrome border does pulse trace effect (Section 2 decision). Physical + luminous feedback. |

### Component 17: HolographicPanel — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 17.1 Style | **Raised platform** | Panel raised 1 depth layer above surrounding surface. Content on elevated platform with chrome edge rail. Raised console section. |
| 17.2 Headers | **Chrome divider bar** | Header text (Exo 2, h2) with horizontal chrome bar extending to right edge. Professional, clean separation. |
| 17.3 Spacing | **Per density tokens** | 40% whitespace ratio, paginate overflow, ghost placeholders for empty states. System-level consistency. |

### Panel Content (Phase 2 panels)
- [ ] DashboardLeft (avatar viewport, guide hologram, trophy pedestals, gauge arrangement)
- [ ] DashboardRight (settings cluster, activity log cards, quick action layout)
- [ ] DashboardCenter (stats header, CTA button placement)
- [ ] LabsCenter (lab info overlay style)
- [ ] ArcadePanel (tile grid layout, filter button row)
- [ ] ProfileCenter (trophy room layout, avatar expansion, badge pedestals)
- [ ] SettingsPanel (section grouping, control spacing)
- [ ] ParentPanel (child card style, action button layout)
- [ ] LabDetailPanel (orbital card ring, lab structure display)

### Effects & Transitions
- [x] MechanicalIris — LOCKED (Component 10)
- [x] CeremonyFX — LOCKED (Component 18)
- [x] AuroraBackground — LOCKED (Component 19)
- [x] AmbientParticles — REMOVED (Component 20)
- [x] WormholeTransition — LOCKED (Component 21)

### Component 18: CeremonyFX — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 18.1 Confetti | **Metallic shards** | Small chrome and gold metallic pieces that catch light as they tumble. Premium, reflective. Awards show feel. |
| 18.2 Trophy | **Particle assembly** | Trophy assembles from scattered particles converging to final shape. "3D printed" from light. Dramatic, futuristic. |
| 18.3 Bloom | **Pulsing** | Bloom pulses 2-3 times at peak intensity (heartbeat) before decaying. Rhythmic, dramatic. |

### Component 19: AuroraBackground — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 19.1 Ribbons | **3 ribbons** | Three overlapping ribbons at different depths. Full aurora effect. Rich atmosphere. |
| 19.2 Color | **Mode-tinted** | Ribbons shift toward mode LED color (per particle crossfade decision). Subtle atmospheric change per page. |
| 19.3 Speed | **Gentle flow (0.6)** | Visible flowing motion. Aurora feels alive. Natural, atmospheric. Non-distracting. |

### Component 20: AmbientParticles — REMOVED
| Detail | Choice | Description |
|--------|--------|-------------|
| 20.0 Decision | **NO PARTICLES** | Ambient particles removed from cockpit entirely. Cleaner visual, less noise. Structural accent lines + LED rim provide sufficient atmosphere. |

### Component 21: WormholeTransition — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 21.1 Tunnel | **Twisted helix** | Tunnel walls spiral like DNA helix. Complex, unique, mesmerizing. Most sci-fi. |
| 21.2 Walls | **Energy grid** | Flowing grid pattern in destination lab color on tunnel walls. Technical, digital. |
| 21.3 Duration | **Quick (500ms)** | Fast, snappy. Brief glimpse of tunnel. Prioritizes speed over spectacle. |

---

## COMPONENT-LEVEL DESIGN DECISIONS (10 Hero Components)

### Component 1: NavigationButtonGrid — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 1.1 Button Shape | **Beveled square** | Square with chamfered edges, slightly concave top (thumb rests in it). Chrome frame. Military/aerospace. |
| 1.2 Layout | **Pentagon cluster** | ARCADE in center, HOME/LABS angled back-left, SETTINGS/PROFILE angled back-right. Radial pattern. |
| 1.3 Size | **Standard** | 0.12 × 0.05 units. Clear, readable, good click target. |
| 1.4 Label Style | **Backlit engraved** | Text engraved/embossed into button surface, lit from behind by accent color. No icons. Premium, mechanical. |
| 1.5 Active Indicator | **Depressed + illuminated ring** | Active button stays physically pressed (0.015 units) AND has bright accent ring around chrome housing. Maximum clarity. |
| 1.6 Mounting | **Shared console plate** | All 5 on a single curved carbon composite plate with chrome border. Integrated into cockpit hull. |

### Component 2: HolographicButton — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 2.1 Button Shape | **Chamfered rectangle** | Rectangular with 45-degree corner cuts. Fighter jet MFD soft key. Angular, technical. |
| 2.2 Surface | **Dual-layer** | Solid dark carbon base + floating translucent emissive layer (0.003 gap). Gap catches light. Premium holographic-over-chassis. |
| 2.3 Ripple | **Ring expansion** | Single ring expands outward and fades on click. Classic, simple. |
| 2.4 Sizes | **3 sizes** | Small: 0.08×0.035 (filter pills). Medium: 0.12×0.05 (standard CTAs). Large: 0.18×0.06 (primary CTAs). |
| 2.5 Text | **Inset text** | Engraved INTO surface (recessed 0.001), backlit by emissive. Consistent with nav button engraved style. |

### Component 3: RadialDial3D — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 3.1 Knob Shape | **Knurled cylinder** | Cylinder with visible grip ridges around edge. Textured, tactile. Precision lab instrument dial. |
| 3.2 Value Display | **LED ring + label** | 24 individual LED dots fill proportionally to value + small label below dial ("XP", "VOL"). |
| 3.3 Tick Marks | **Illuminated dots** | 24 small glowing dots around rim. Active=accent color, inactive=dim. Feels like tiny LEDs. |
| 3.4 Drag Feedback | **Smooth rotation** | Dial rotates smoothly following mouse. Arc updates continuously. Clean and direct. |
| 3.5 Gauge vs Control | **Visual distinction (glass cover)** | Read-only gauges have sealed translucent dome over dial face, no knob protrusion. Interactive dials have exposed knobs. |

### Component 4: ToggleSwitch3D — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 4.1 Switch Style | **Paddle switch** | Flat paddle flips up (ON) / down (OFF) on horizontal axis. Aircraft overhead panel. Clean, professional. |
| 4.2 ON/OFF Indicator | **LED strip** | Thin accent-colored LED strip along mounting plate edge. Fully lit=ON, off=OFF. Ties into cockpit accent line system. |
| 4.3 Snap Feel | **Hard snap** | Instant 45° rotation, no overshoot. Clean mechanical click. Quality electrical switch. |
| 4.4 Mounting | **Grouped panel** | Multiple toggles share single recessed panel section with label header ("AUDIO CONTROLS"). Organized, professional. |

### Component 5: HolographicLabMap — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 5.1 Node Shape | **Geodesic sphere** | Multi-shell icosahedron with concentric transparent layers. Holographic data orb. ~100K tris/node. |
| 5.2 Connections | **Beam lines** | Thin laser-like lines connecting adjacent labs. Energy pulses flow between nodes. Minimal geometry, elegant. |
| 5.3 Completion | **Shell layers** | Inner shells reveal as completion increases. 0%=outer only. 100%=all 4 shells glow, dense bright core. Premium visual reward. |
| 5.4 Map Base | **Grid floor** | Holographic grid plane with raised intersection points. Sci-fi tactical map. |
| 5.5 Hover | **Isolate + spotlight** | Hovered node brightens, all others dim to 30%. Spotlight centers on hovered lab. Dramatic focus. |

### Component 6: HolographicHUD — LOCKED (REPOSITIONED: peripheral frame, not overhead overlay)
| Detail | Choice | Description |
|--------|--------|-------------|
| 6.0 Position | **Peripheral frame** | Moved from overhead [0,2.05,-3.4] to viewport perimeter. Wraps AROUND content as instrument bezel. Eliminates distraction and bloom bleed into content area. |
| 6.1 Ring Style | **Segmented arc frame** | 4 arc segments (top, bottom, left, right) frame viewport edges. Tick marks and graduated markings. Instrument bezel. |
| 6.2 Data Display | **Corner data readouts** | 4 corners: top-left=time, top-right=XP, bottom-left=mode name, bottom-right=child name/level. Useful without clutter. |
| 6.3 Motion | **Breathing pulse** | Segments pulse brightness on 4-second cycle. Cockpit heartbeat. Organic, calming, no distracting motion. |
| 6.4 Celebration | **Color cascade** | Gold chasing light sweeps around frame perimeter. 1 revolution=minor, 3 revolutions=epic. Dramatic but contained to edges. |
| 6.5 Visibility | **Present (20-30%)** | Clearly visible architectural element. Defines viewport boundary. Sets instrument panel tone without competing with content. |

### Component 7: LEDRim — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 7.1 LED Shape | **Rectangular blocks** | Small flat rectangles in continuous strip. Angular, technical. Airport runway lights feel. |
| 7.2 Pulse Wave | **Outward burst** | Pulse starts from center of arc, radiates outward both directions simultaneously (300ms). Centered, symmetrical energy. |
| 7.3 Color Transition | **Sequential fill** | New color fills center→outward, replacing old color LED by LED over 400ms. Liquid filling a channel. |
| 7.4 Brightness | **Prominent strip** | 2.5x emissive, toneMapped: false. Genuine light sources with bloom bleed. The rim is a visual feature. |
| 7.5 Data Mode | **No data** | Pure mood lighting. Color and pulse only. Simple, clean role. |

### Component 8: StatusBar3D — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 8.1 Speedometer | **Arc bar** | Colored arc fills proportionally (radial progress bar). Digital number in center (Orbitron). No needle. Clean, modern. |
| 8.2 Streak | **Pulse ring** | Ring pulses with streak intensity. 1-day=slow faint. 30-day=rapid bright. Abstract, clean, less visual noise than flames. |
| 8.3 Lab Indicators | **Mini arcs** | 10 tiny arc segments forming a ring (~20° each). Each fills proportionally to lab completion. Segmented donut chart. |
| 8.4 Dividers | **Chrome pillars** | Thin vertical chrome bars between sections. Classic instrument panel dividers. |
| 8.5 Profile | **Curved strip** | Follows cockpit hull curvature. Wraps slightly around pilot. Immersive, integrated into shell. |

### Component 9: CenterViewportScreen — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 9.1 Screen Shape | **Cylindrical concave** | Curved cylinder section. Wraps horizontally, flat vertically. Widescreen curved monitor. Best for text readability and grids. |
| 9.2 Bezel Frame | **Segmented frame** | Chrome frame divided into sections with small gaps at corners. Matches HUD segmented arc design. Visual cohesion. |
| 9.3 Surface | **Scan lines** | Dark background with subtle horizontal scan line effect (CRT). Retro-futuristic. Screen feels like a display, not a void. |
| 9.4 Transition | **Wipe sweep** | Bright line sweeps left-to-right revealing new content (400ms). Scanner pass. Technical, dramatic. |

### Component 10: MechanicalIris — LOCKED
| Detail | Choice | Description |
|--------|--------|-------------|
| 10.1 Blade Count | **8 blades** | Octagonal aperture. Smooth, mechanical. Classic camera iris. |
| 10.2 Blade Material | **Carbon composite** | Same #0A0F1F as cockpit panels. Iris looks like cockpit hull splitting open. Integrated, cohesive. |
| 10.3 Opening | **Staggered spiral** | Blades open one at a time (50ms apart). Spiral opening pattern. Each blade catches previous. Organic, mesmerizing. |
| 10.4 Light Effect | **Light rays** | 4 volumetric light ray cones project from center gap as iris opens. Game world shines through before full reveal. |
| 10.5 Sound | **Servo whir** | Continuous mechanical servo motor. Technical, realistic. Camera lens feel. Plays from center_screen zone. |

---

*This log will be updated as component-level design decisions are made.*
*All decisions are final unless explicitly reopened by user.*
