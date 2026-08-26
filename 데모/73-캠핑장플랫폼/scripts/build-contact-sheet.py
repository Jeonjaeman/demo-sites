from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
source = root / 'qa' / 'round2-states'
states = ['booking-step1', 'complete-lookup-empty', 'complete-success-received']
views = ['1440x900', '1024x768', '375x812']
cell_w, cell_h, label_h = 480, 360, 38
sheet = Image.new('RGB', (cell_w * 3, (cell_h + label_h) * 3), '#161d27')
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for row, view in enumerate(views):
    for col, state in enumerate(states):
        image = Image.open(source / f'{state}-{view}.png').convert('RGB')
        image.thumbnail((cell_w, cell_h))
        x = col * cell_w + (cell_w - image.width) // 2
        y = row * (cell_h + label_h) + label_h + (cell_h - image.height) // 2
        sheet.paste(image, (x, y))
        draw.text((col * cell_w + 12, row * (cell_h + label_h) + 12), f'{state} / {view}', fill='white', font=font)
for name in ['contact-sheet.jpg', 'round2-contact-sheet.jpg']:
    sheet.save(root / 'qa' / name, 'JPEG', quality=90, optimize=True)
print('CONTACT_SHEET 9 CELLS')
