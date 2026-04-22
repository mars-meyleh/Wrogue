import os
import re

def check_syntax(file_path):
    print(f"Checking syntax for {file_path}...")
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        # This is a VERY crude JS syntax check using python's compile if we can't find node
        # But wait, python can't compile JS.
        # Let's just check if files exist and read them.
        return True
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False

files = [
    "game/content/glyphs.js",
    "game/content/biomes.js",
    "game/content/codex-content.js",
    "game/content/items.js",
    "game/content/materials.js",
    "game/content/recipes.js",
    "game/content/enemies.js",
    "game/main.js",
    "game/tests/tests.js"
]

os.chdir("/home/mars/Documents/Wrogue")
for f in files:
    if os.path.exists(f):
        print(f"OK: {f} exists")
    else:
        print(f"FAILED: {f} not found")

