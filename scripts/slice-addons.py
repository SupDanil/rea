#!/usr/bin/env python3
"""Slice the supplied 5×5 / 4×5 sheets; preserve RGBA and add safe transparent margins.
Usage: python3 scripts/slice-addons.py TOPPINGS.png SYRUPS.png OUTPUT_DIR [OUTPUT_DIR ...]
Requires Pillow. Coordinates intentionally follow the irregular source gutters, not equal cells.
"""
import sys
from pathlib import Path
from PIL import Image

SHEETS = [
    ([0, 272, 510, 750, 990, 1254], [0, 300, 540, 770, 1010, 1254], [
        'whipped-cream', 'ice-cream', 'caramel-sauce', 'chocolate-chunks', 'pistachio-crushed',
        'strawberry-fresh', 'raspberry-fresh', 'blueberry-fresh', 'mango', 'passion-fruit',
        'almond-flakes', 'hazelnut-halves', 'walnut', 'coconut-chips', 'oreo',
        'marshmallow', 'chocolate-drops', 'white-chocolate-curls', 'cinnamon-sticks', 'vanilla-flower',
        'mint-fresh', 'orange-zest', 'lime-zest', 'rose-petals', 'lavender-dry',
    ]),
    ([0, 320, 635, 950, 1254], [0, 288, 555, 790, 1025, 1254], [
        'vanilla', 'caramel', 'hazelnut', 'salted-caramel',
        'cinnamon', 'chocolate-dark', 'chocolate-white', 'coconut',
        'almond', 'pistachio', 'pumpkin', 'honey',
        'raspberry', 'strawberry', 'blueberry', 'blackcurrant',
        'mint', 'ginger', 'orange', 'lavender',
    ]),
]
SIZE = 512
CONTENT = 420

def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    outputs = [Path(p) for p in sys.argv[3:]]
    for output in outputs:
        output.mkdir(parents=True, exist_ok=True)
    count = 0
    for source, (xs, ys, names) in zip(sys.argv[1:3], SHEETS):
        sheet = Image.open(source).convert('RGBA')
        if sheet.size != (1254, 1254):
            raise ValueError(f'Unexpected sheet size: {sheet.size}')
        columns = len(xs) - 1
        for i, name in enumerate(names):
            row, column = divmod(i, columns)
            box = (xs[column], ys[row], xs[column + 1], ys[row + 1])
            # Adjacent objects intrude into three irregular gutters on the first sheet.
            box = {'chocolate-chunks': (750, 0, 975, 300),
                   'chocolate-drops': (272, 770, 490, 1010),
                   'mint-fresh': (0, 1010, 258, 1254)}.get(name, box)
            crop = sheet.crop(box)
            # Suppress the sheet's faint matte in the gutters; keep opaque food pixels intact.
            crop.putalpha(crop.getchannel('A').point(lambda a: 0 if a <= 48 else round((a - 48) * 255 / 207)))
            scale = CONTENT / max(crop.size)
            crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (SIZE, SIZE))
            canvas.alpha_composite(crop, ((SIZE - crop.width) // 2, (SIZE - crop.height) // 2))
            for output in outputs:
                canvas.save(output / f'addon-{name}.png', compress_level=6)
                canvas.save(output / f'addon-{name}.webp', quality=88, method=4)
            count += 1
    print(f'{count} sprites × PNG/WebP × {len(outputs)} destinations; {SIZE}×{SIZE}, ≥46px transparent margin')

if __name__ == '__main__':
    main()
