import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/blender/sources/formula-2-car-high-poly.blend'
OUT = ROOT / 'assets/blender/liveries'
MODELS = ROOT / 'public/models'
PREVIEWS = ROOT / 'previews'

# sRGB hex colors converted to Blender's linear shader color space.
def srgb_to_linear(v):
    v /= 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def set_material(name, hex_color, metallic=None, roughness=None):
    mat = bpy.data.materials[name]
    color = tuple(srgb_to_linear(int(hex_color[i:i+2], 16)) for i in (1, 3, 5)) + (1.0,)
    mat.diffuse_color = color
    if mat.use_nodes:
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                node.inputs['Base Color'].default_value = color
                if metallic is not None: node.inputs['Metallic'].default_value = metallic
                if roughness is not None: node.inputs['Roughness'].default_value = roughness

variants = [
    {
        'id': 'scarlet-ivory', 'body': '#c92f3b', 'wing': '#eee9df',
        'metallic': 0.28, 'roughness': 0.24,
    },
    {
        'id': 'ocean-cyan', 'body': '#075078', 'wing': '#12c1c0',
        'metallic': 0.38, 'roughness': 0.22,
    },
]

for item in variants:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    set_material('Body', item['body'], item['metallic'], item['roughness'])
    set_material('Front Wing', item['wing'], 0.62, 0.27)
    blend_path = OUT / f"formula-2-{item['id']}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), copy=True)

    bpy.ops.object.select_all(action='DESELECT')
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    for obj in meshes: obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    glb_path = MODELS / f"formula-2-{item['id']}.glb"
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format='GLB', use_selection=True,
        export_apply=True, export_cameras=False, export_lights=False, export_materials='EXPORT', export_yup=True)

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 650
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(PREVIEWS / f"formula-2-{item['id']}.png")
    bpy.ops.render.render(write_still=True)
    print('LIVERY_DONE', item['id'], blend_path.stat().st_size, glb_path.stat().st_size)
