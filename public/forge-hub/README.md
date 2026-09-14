# Forge Hub — locked art assets

**Status:** LOCKED by owner 2026-09-14
**Plan:** `docs/forge-hub/TRANSITION_ACTION_PLAN.md`
**Design locks:** `docs/forge-hub/LOCKED_HUB.md`, `docs/forge-hub/LOCKED_SPARKY.md`

Every file under this folder is owner-approved art. Agents and contributors:

1. **Never regenerate, re-render, upscale, recompress, or "clean up" any file here.**
2. Copy byte-for-byte only. Verify after any copy or checkout:

   ```bash
   cd public/forge-hub && sha256sum -c SHA256SUMS
   ```

   Every line must print `OK`. A mismatch fails the task; stop and report.
3. Derived assets (poster crops, sprite sheets, KTX2 textures, video encodes) live elsewhere (`public/forge-hub/derived/`, created when needed) and must name their source file and its SHA in a sidecar `.md`.
4. New locks are added only with an owner approval note in the folder's `LOCKED.md` and a new line in `SHA256SUMS`.

| Folder | Contents |
|---|---|
| `world/` | The hub plate (room, desk, SF emitter, three empty holograms) and the SF monogram close-up. See `world/LOCKED.md`. |
| `sparky/` | The Sparky character concept. See `sparky/LOCKED.md`. |
