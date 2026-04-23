#!/usr/bin/env python3
"""
黑客松海报生成器 - PDF填充脚本
接收JSON参数，将数据填入PDF模板，输出到stdout（二进制）
"""
import sys
import json
import base64
import io
import os
import fitz
from PIL import Image, ImageDraw, ImageFont

# PDF原始尺寸: 2748 x 4119
# 各区域坐标（PDF坐标系）：
# 图一白色框: (540, 1140) to (2230, 2000)
# INFORMATION黑色框: (640, 2120) to (2210, 2300)
# 问题1答案框: (1420, 2760) to (2400, 3040)
# 问题2答案框: (1420, 3120) to (2400, 3380)
# 问题3答案框: (1420, 3440) to (2400, 3700)

FONT_BOLD = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'
FONT_REGULAR = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'

def create_text_image(text, width, height, font_path, font_size,
                       text_color=(255, 255, 255), bg_color=(0, 0, 0, 0),
                       align='center', valign='center'):
    img = Image.new('RGBA', (int(width), int(height)), bg_color)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    if align == 'center':
        x = (width - text_w) / 2
    elif align == 'left':
        x = 40
    else:
        x = width - text_w - 40

    if valign == 'center':
        y = (height - text_h) / 2
    elif valign == 'top':
        y = 15
    else:
        y = height - text_h - 15

    draw.text((x, y), text, font=font, fill=text_color)
    return img


def insert_text_as_image(page, rect, text, font_path, font_size,
                          text_color=(255, 255, 255), align='center', valign='center'):
    box_w = rect.width
    box_h = rect.height
    text_img = create_text_image(text, box_w, box_h, font_path, font_size,
                                  text_color=text_color, bg_color=(0, 0, 0, 0),
                                  align=align, valign=valign)
    buf = io.BytesIO()
    text_img.save(buf, format='PNG')
    buf.seek(0)
    page.insert_image(rect, stream=buf.read())


def generate_poster(params):
    """
    params: {
        name: str,       # 称呼
        hometown: str,   # 家乡
        coolest: str,    # 最酷的事
        reason: str,     # 报名原因
        harvest: str,    # 收获
        image_b64: str,  # base64编码的图片（可选）
        img_scale: float,  # 缩放比例 0.1-3.0
        img_offset_x: float,  # 水平偏移 -1000~1000
        img_offset_y: float,  # 垂直偏移 -1000~1000
    }
    """
    template_path = os.path.join(os.path.dirname(__file__), '../assets/poster_template.pdf')
    if not os.path.exists(template_path):
        template_path = '/home/ubuntu/upload/pasted_file_WEBSqd_2050海报.pdf'

    doc = fitz.open(template_path)
    page = doc[0]

    name = params.get('name', '')
    hometown = params.get('hometown', '')
    coolest = params.get('coolest', '')
    reason = params.get('reason', '')
    harvest = params.get('harvest', '')
    image_b64 = params.get('image_b64', '')
    img_scale = float(params.get('img_scale', 1.0))
    img_offset_x = float(params.get('img_offset_x', 0))
    img_offset_y = float(params.get('img_offset_y', 0))

    # ===== 1. 填入图片 =====
    if image_b64:
        try:
            img_data = base64.b64decode(image_b64)
            img = Image.open(io.BytesIO(img_data))
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # 图一白色框区域
            img_rect = fitz.Rect(540, 1140, 2230, 2000)
            box_w = img_rect.width   # 1690
            box_h = img_rect.height  # 860

            img_w, img_h = img.size
            img_ratio = img_w / img_h
            box_ratio = box_w / box_h

            # 基础缩放（cover模式）
            if img_ratio > box_ratio:
                base_h = box_h
                base_w = base_h * img_ratio
            else:
                base_w = box_w
                base_h = base_w / img_ratio

            # 应用用户缩放
            new_w = int(base_w * img_scale)
            new_h = int(base_h * img_scale)

            img_resized = img.resize((max(1, new_w), max(1, new_h)), Image.LANCZOS)

            # 居中 + 偏移
            center_x = (new_w - box_w) / 2 - img_offset_x
            center_y = (new_h - box_h) / 2 - img_offset_y

            left = int(max(0, center_x))
            top = int(max(0, center_y))
            right = int(min(new_w, left + box_w))
            bottom = int(min(new_h, top + box_h))

            # 创建画布并粘贴
            canvas = Image.new('RGB', (int(box_w), int(box_h)), (30, 30, 30))
            paste_x = max(0, int(-center_x))
            paste_y = max(0, int(-center_y))
            crop_left = max(0, int(center_x))
            crop_top = max(0, int(center_y))
            crop_right = min(new_w, crop_left + int(box_w) - paste_x)
            crop_bottom = min(new_h, crop_top + int(box_h) - paste_y)

            if crop_right > crop_left and crop_bottom > crop_top:
                cropped = img_resized.crop((crop_left, crop_top, crop_right, crop_bottom))
                canvas.paste(cropped, (paste_x, paste_y))

            buf = io.BytesIO()
            canvas.save(buf, format='PNG')
            buf.seek(0)
            page.insert_image(img_rect, stream=buf.read())
        except Exception as e:
            sys.stderr.write(f"图片处理失败: {e}\n")

    # ===== 2. 填入称呼和家乡 =====
    if name or hometown:
        info_rect = fitz.Rect(640, 2120, 2210, 2300)
        parts = []
        if name:
            parts.append(f"@{name}")
        if hometown:
            parts.append(f"#{hometown}")
        info_text = "          ".join(parts)
        insert_text_as_image(page, info_rect, info_text, FONT_BOLD, 75,
                              text_color=(255, 255, 255))

    # ===== 3. 填入三个问题回答 =====
    answers = [
        (coolest, fitz.Rect(1420, 2760, 2400, 3040)),
        (reason,  fitz.Rect(1420, 3120, 2400, 3380)),
        (harvest, fitz.Rect(1420, 3440, 2400, 3700)),
    ]
    for answer, rect in answers:
        if answer:
            insert_text_as_image(page, rect, answer, FONT_BOLD, 65,
                                  text_color=(255, 255, 255))

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    buf.seek(0)
    return buf.read()


if __name__ == '__main__':
    data = json.loads(sys.stdin.read())
    pdf_bytes = generate_poster(data)
    sys.stdout.buffer.write(pdf_bytes)
