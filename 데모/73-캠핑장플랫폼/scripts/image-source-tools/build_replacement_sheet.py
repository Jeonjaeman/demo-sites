from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
files = ['hero-main.webp','mag-01.webp','theme-wide.webp','camp-caravan-01.webp','camp-glamp-02.webp','detail-02.webp','detail-01.webp']
cell_w, cell_h = 420, 300
sheet = Image.new('RGB', (cell_w * 2, cell_h * 4), 'white')
draw = ImageDraw.Draw(sheet); font = ImageFont.load_default()
for index, name in enumerate(files):
    image = Image.open(root / 'assets/img' / name).convert('RGB'); image.thumbnail((cell_w, cell_h - 28))
    x=(index%2)*cell_w+(cell_w-image.width)//2; y=(index//2)*cell_h+28
    sheet.paste(image,(x,y)); draw.text(((index%2)*cell_w+8,(index//2)*cell_h+8),name,fill='black',font=font)
out=root/'qa/round2-replaced-images.jpg'; sheet.save(out,'JPEG',quality=92)
print(out)
