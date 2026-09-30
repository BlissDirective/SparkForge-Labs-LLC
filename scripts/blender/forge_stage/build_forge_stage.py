# ════════════════════════════════════════════════════════════════
# Forge Stage — Blender build scaffold (bpy)
# ════════════════════════════════════════════════════════════════
# Runnable in Blender 4.x (Scripting tab → paste → Run, or
# `blender --background --python build_forge_stage.py`).
#
# Produces the STRUCTURAL SCAFFOLD for the authored forge-stage objects
# to the exact SparkForge contract: correct real-world dimensions,
# pivots, object/socket NAMES, placeholder materials, and one GLB per
# object. Art polish (bevels, detail, warm PBR to match the locked look)
# and the shape-key / armature CLIPS are a refinement pass on top of
# this — see docs/forge-hub/FORGE_STAGE_ASSET_PROMPTS.md.
#
# Axis contract: authored in Blender native +Z up. glTF export converts
# to +Y up (export_yup=True). Real metres throughout. Numbers mirror
# src/config/forgeHub.ts (FORGE_HUB_PLATE.desk) and
# src/config/sparkySpots.ts (SPARKY_SPOTS) so sockets line up in-engine.
#
# Clean-room decision (owner 2026-09): the room is a flat owner-supplied
# background image; only these objects are live. The glass "look"
# (translucency, edge glow, scanline, bloom) is a RUNTIME shader — the
# authored screens are simple planes carrying UV0 0..1 + a content quad.

import math
import os
import bpy

# ── PARAMS (metres). Absolute scale is normalised in-engine against the
#    new background plate; proportions here match the runtime config. ──
OUT_DIR = os.path.join(os.path.expanduser("~"), "forge-stage-glb")

DESK = dict(radius=1.62, height=0.50, rim_minor=0.055, rim_major=1.12)
EMITTER = dict(disc_radius=0.36, disc_height=0.06, ring_minor=0.018,
               ring_major=0.30, core_radius=0.24, core_lift=0.065)
SCREEN = dict(w=1.0, h=1.0)  # unit plane; engine scales via the layout registry

# Sparky desk seats — OFFSET from desk centre (room coords, metres).
# Room +Z (front, toward camera) → Blender +Y. Room +Y (up) → Blender +Z.
SPARKY_SEATS = {
    "nearCore":   (0.00, 0.42, 0.0),
    "leftLip":    (-0.88, 0.48, 0.0),
    "rightLip":   (0.88, 0.48, 0.0),
    "frontCenter": (0.00, 1.05, 0.0),
    "behindCore": (0.00, -0.38, 0.0),
}


# ── helpers ──────────────────────────────────────────────────────────
def scene_setup():
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 1.0


def new_collection(name):
    if name in bpy.data.collections:
        col = bpy.data.collections[name]
        for ob in list(col.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
    else:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def link(col, ob):
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    col.objects.link(ob)


def placeholder_material(name, base=(0.6, 0.6, 0.6, 1.0), metal=0.0,
                         rough=0.5, emission=None, emit_strength=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base
        bsdf.inputs["Metallic"].default_value = metal
        bsdf.inputs["Roughness"].default_value = rough
        if emission is not None:
            # Blender 4.x: "Emission Color" + "Emission Strength"
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emit_strength
    return mat


def set_material(ob, mat):
    ob.data.materials.clear()
    ob.data.materials.append(mat)


def make_socket(col, name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.08
    e.location = loc
    link(col, e)
    if parent:
        e.parent = parent
    return e


def origin_to(ob, world_co):
    """Move object origin to a world coordinate (keep geometry in place)."""
    bpy.context.view_layer.objects.active = ob
    cur = bpy.context.scene.cursor.location.copy()
    bpy.context.scene.cursor.location = world_co
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.context.scene.cursor.location = cur


def export_glb(col, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in col.objects:
        ob.select_set(True)
    path = os.path.join(OUT_DIR, f"{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=True,
        export_extras=True,  # keeps custom props / empties addressable
    )
    print(f"[forge-stage] exported {path}")


# ── HubDesk ──────────────────────────────────────────────────────────
def build_desk():
    col = new_collection("HubDesk")
    # platform: top surface at z=0 (Sparky floor), body below
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=DESK["radius"],
                                         depth=DESK["height"],
                                         location=(0, 0, -DESK["height"] / 2))
    top = bpy.context.active_object
    top.name = "HubDesk"
    set_material(top, placeholder_material("mat.deskMetal",
                 base=(0.86, 0.72, 0.60, 1.0), metal=0.55, rough=0.42))
    link(col, top)
    # emissive rim ring at the top edge
    bpy.ops.mesh.primitive_torus_add(major_radius=DESK["rim_major"],
                                     minor_radius=DESK["rim_minor"],
                                     location=(0, 0, 0.0))
    rim = bpy.context.active_object
    rim.name = "HubDesk_rim"
    set_material(rim, placeholder_material("mat.deskEmissive",
                 base=(1.0, 0.88, 0.70, 1.0), metal=0.8, rough=0.3,
                 emission=(1.0, 0.72, 0.35, 1.0), emit_strength=0.4))
    link(col, rim)
    rim.parent = top
    # sockets
    make_socket(col, "socket.deskDock", (0, 0, 0.0), parent=top)
    for seat, (x, y, z) in SPARKY_SEATS.items():
        make_socket(col, f"socket.sparkySeat.{seat}", (x, y, z), parent=top)
    origin_to(top, (0, 0, 0))  # origin = desk-top centre
    export_glb(col, "HubDesk")


# ── SfEmitter ────────────────────────────────────────────────────────
def build_emitter():
    col = new_collection("SfEmitter")
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=EMITTER["disc_radius"],
                                         depth=EMITTER["disc_height"],
                                         location=(0, 0, EMITTER["disc_height"] / 2))
    disc = bpy.context.active_object
    disc.name = "SfEmitter"
    set_material(disc, placeholder_material("mat.deskMetal",
                 base=(0.81, 0.66, 0.53, 1.0), metal=0.75, rough=0.35))
    link(col, disc)
    bpy.ops.mesh.primitive_torus_add(major_radius=EMITTER["ring_major"],
                                     minor_radius=EMITTER["ring_minor"],
                                     location=(0, 0, EMITTER["disc_height"]))
    ring = bpy.context.active_object
    ring.name = "SfEmitter_ring"
    set_material(ring, placeholder_material("mat.emitterCore",
                 base=(0.35, 0.90, 1.0, 1.0), metal=0.0, rough=0.2,
                 emission=(0.35, 0.90, 1.0, 1.0), emit_strength=2.0))
    link(col, ring)
    ring.parent = disc
    # core disc (SF glyph face at runtime) — emissive placeholder
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=EMITTER["core_radius"],
                                      fill_type="NGON",
                                      location=(0, 0, EMITTER["core_lift"]))
    core = bpy.context.active_object
    core.name = "SfEmitter_core"
    set_material(core, placeholder_material("mat.emitterCore",
                 base=(0.35, 0.90, 1.0, 1.0), emission=(0.35, 0.90, 1.0, 1.0),
                 emit_strength=3.0))
    link(col, core)
    core.parent = disc
    # beam-origin sockets (runtime spawns the beam cones toward each screen)
    make_socket(col, "socket.beamOriginC", (0.0, 0.0, EMITTER["core_lift"]), parent=disc)
    make_socket(col, "socket.beamOriginL", (-0.10, 0.0, EMITTER["core_lift"]), parent=disc)
    make_socket(col, "socket.beamOriginR", (0.10, 0.0, EMITTER["core_lift"]), parent=disc)
    origin_to(disc, (0, 0, 0))  # origin = disc centre on the desk top
    export_glb(col, "SfEmitter")


# ── Holo screens (Holo L / C / R) ────────────────────────────────────
def build_screens():
    col = new_collection("HoloScreens")
    mat = placeholder_material("mat.glass", base=(0.18, 0.72, 0.86, 1.0),
                               rough=0.1)
    for name in ("HoloL", "HoloC", "HoloR"):
        # vertical plane facing -Y (front view). Spans X (width) and Z (height).
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
        p = bpy.context.active_object
        p.name = name
        p.rotation_euler = (math.radians(90), 0, 0)  # stand it up, normal -Y
        p.scale = (SCREEN["w"], 1.0, SCREEN["h"])
        bpy.ops.object.transform_apply(rotation=True, scale=True)
        set_material(p, mat)
        link(col, p)
        # pivot at the core-facing bottom-centre so merge/tilt rotate naturally
        origin_to(p, (0, 0, -SCREEN["h"] / 2))
        # explicit content-quad socket (engine maps DOM/RTT to UV0 0..1)
        make_socket(col, f"{name}.contentQuad", (0, 0, 0), parent=p)
    export_glb(col, "HoloScreens")


def main():
    scene_setup()
    build_desk()
    build_emitter()
    build_screens()
    print("[forge-stage] scaffold complete →", OUT_DIR)


if __name__ == "__main__":
    main()
