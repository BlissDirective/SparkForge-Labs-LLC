# Frost-Prismatic HDR Environment Map

SparkForge — Laboratory Control Station Vision

## Specification

- Format: HDR equirectangular
- Resolution: 1024 x 512
- Filename: frost-prismatic.hdr
- Location: public/hdri/frost-prismatic.hdr
- File size target: ~200KB

## Blender Setup

1. Create a new scene with a dark studio background (#0a0a14)
2. Add three area lights:
   - Blue key light: #3B82F6, intensity 3.0, positioned left at 45 degrees
   - Purple fill light: #8B5CF6, intensity 1.5, positioned right at 30 degrees
   - Teal rim light: #06B6D4, intensity 2.0, positioned top at 60 degrees
3. Render as equirectangular panorama (Cycles, 1024x512)
4. Save as .hdr format

## Usage

- Loaded lazily on first 3D scene render via drei's Environment component
- Cached in GPU memory after first load
- All PBR materials reflect this lighting
- Per-lab tinting achieved via envMapIntensity color shift uniform

## Fallback

Until this file exists, drei's 'night' preset is used (configured in materials.ts).
Replace HDR_FALLBACK_PRESET usage with the files prop when ready:

```tsx
<Environment files="/hdri/frost-prismatic.hdr" />
```
