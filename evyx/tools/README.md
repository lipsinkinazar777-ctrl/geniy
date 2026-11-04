# How the EVYX robot and card images were made

Everything on the site that looks like a 3D render **is** a real physically-based render,
produced by the scripts in `tools/robot/`. No stock photos, no AI image generators.

- `sdflib.py`, `parts.py` model the android as signed distance fields and mesh them (marching cubes).
- `render.py`, `final.py` set up materials, studio lights and a camera in Mitsuba 3 (path tracer) and
  render the head turn: 15 frames, yaw -28 to +28 degrees, transparent background.
- `post.py`, `make_assets.py` tone-map, add the lens bloom, denoise, fade the bust and write
  `assets/robot/*.webp` plus `robot.json`.
- `cards.py`, `robot_cards.py` render the product stills used on the video cards (`assets/cards/*.webp`).

To re-render (Python 3.11+, any CPU, no GPU needed):

    python -m venv venv && venv/bin/pip install mitsuba scikit-image scipy opencv-python-headless pillow numpy
    cd tools/robot
    ../../venv/bin/python build.py 0.0036 meshes
    ../../venv/bin/python final.py meshes frames -28,-24,-20,-16,-12,-8,-4,0,4,8,12,16,20,24,28 1400 1500 18 16 3
    ../../venv/bin/python make_assets.py frames ../../assets/robot

Change the look in `parts.py` (shapes), `render.py` (materials and lights) and `post.py` (grade).
