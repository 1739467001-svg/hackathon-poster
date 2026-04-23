import { useEffect, useRef, useCallback, useState } from "react";

// 新海报PDF尺寸: 2748 x 4096
// 预览底图尺寸: 1100 x 1639 (0.4003x缩放)
const PDF_W = 2748;
const PDF_H = 4096;
const PREVIEW_W = 1100;
const PREVIEW_H = 1639;
const PDF_TO_PREVIEW = PREVIEW_W / PDF_W; // 0.4003

// 各区域在预览图(1100x1639)中的坐标
// PDF坐标 * PDF_TO_PREVIEW = 预览坐标
const REGIONS = {
  // 图一白色框: PDF(462,886)~(2598,1636)
  photoBox: {
    x: Math.round(462 * PDF_TO_PREVIEW),   // 185
    y: Math.round(886 * PDF_TO_PREVIEW),   // 355
    w: Math.round((2598 - 462) * PDF_TO_PREVIEW),  // 855
    h: Math.round((1636 - 886) * PDF_TO_PREVIEW),  // 300
  },
  // INFORMATION框: PDF(499,2123)~(2023,2323)
  infoBox: {
    x: Math.round(499 * PDF_TO_PREVIEW),   // 200
    y: Math.round(2123 * PDF_TO_PREVIEW),  // 850
    w: Math.round((2023 - 499) * PDF_TO_PREVIEW),  // 610
    h: Math.round((2323 - 2123) * PDF_TO_PREVIEW), // 80
  },
  // 问题1答案框: PDF(1411,2710)~(2048,2935)
  q1Box: {
    x: Math.round(1411 * PDF_TO_PREVIEW),  // 565
    y: Math.round(2710 * PDF_TO_PREVIEW),  // 1085
    w: Math.round((2048 - 1411) * PDF_TO_PREVIEW), // 255
    h: Math.round((2935 - 2710) * PDF_TO_PREVIEW), // 90
  },
  // 问题2答案框: PDF(1411,3035)~(2048,3260)
  q2Box: {
    x: Math.round(1411 * PDF_TO_PREVIEW),  // 565
    y: Math.round(3035 * PDF_TO_PREVIEW),  // 1215
    w: Math.round((2048 - 1411) * PDF_TO_PREVIEW), // 255
    h: Math.round((3260 - 3035) * PDF_TO_PREVIEW), // 90
  },
  // 问题3答案框: PDF(1411,3360)~(2048,3584)
  q3Box: {
    x: Math.round(1411 * PDF_TO_PREVIEW),  // 565
    y: Math.round(3360 * PDF_TO_PREVIEW),  // 1345
    w: Math.round((2048 - 1411) * PDF_TO_PREVIEW), // 255
    h: Math.round((3584 - 3360) * PDF_TO_PREVIEW), // 90
  },
};

export interface PosterData {
  name: string;
  hometown: string;
  coolest: string;
  reason: string;
  harvest: string;
  photoUrl: string | null;
  imgScale: number;
  imgOffsetX: number;
  imgOffsetY: number;
}

interface Props {
  data: PosterData;
  onChange?: (patch: Partial<PosterData>) => void;
  width?: number;
}

const BG_URL = "/manus-storage/poster_bg_new_c184f63d.png";

export default function PosterCanvas({ data, onChange, width = 440 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const photoImageRef = useRef<HTMLImageElement | null>(null);
  const bgLoadedRef = useRef(false);
  const photoUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Canvas display scale
  const displayScale = width / PREVIEW_W;
  const height = Math.round(PREVIEW_H * displayScale);

  // Draw everything on canvas
  const drawPoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = displayScale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw background
    if (bgImageRef.current && bgLoadedRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw photo in photo box
    const pb = REGIONS.photoBox;
    if (photoImageRef.current && data.photoUrl) {
      const photo = photoImageRef.current;
      const boxW = pb.w * s;
      const boxH = pb.h * s;
      const boxX = pb.x * s;
      const boxY = pb.y * s;

      const photoRatio = photo.naturalWidth / photo.naturalHeight;
      const boxRatio = boxW / boxH;
      let baseW: number, baseH: number;
      if (photoRatio > boxRatio) {
        baseH = boxH;
        baseW = baseH * photoRatio;
      } else {
        baseW = boxW;
        baseH = baseW / photoRatio;
      }

      const scaledW = baseW * data.imgScale;
      const scaledH = baseH * data.imgScale;

      const drawX = boxX + (boxW - scaledW) / 2 + data.imgOffsetX * s;
      const drawY = boxY + (boxH - scaledH) / 2 + data.imgOffsetY * s;

      ctx.save();
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxW, boxH);
      ctx.clip();
      ctx.drawImage(photo, drawX, drawY, scaledW, scaledH);
      ctx.restore();
    }

    // 3. Draw INFORMATION text
    const ib = REGIONS.infoBox;
    if (data.name || data.hometown) {
      const parts: string[] = [];
      if (data.name) parts.push(`@${data.name}`);
      if (data.hometown) parts.push(`#${data.hometown}`);
      const infoText = parts.join("     ");

      ctx.save();
      const fontSize = Math.round(20 * s);
      ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Measure and auto-shrink if too wide
      let actualFontSize = fontSize;
      let textWidth = ctx.measureText(infoText).width;
      const maxWidth = ib.w * s * 0.9;
      if (textWidth > maxWidth) {
        actualFontSize = Math.floor(fontSize * (maxWidth / textWidth));
        ctx.font = `700 ${actualFontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      }
      ctx.fillText(infoText, (ib.x + ib.w / 2) * s, (ib.y + ib.h / 2) * s);
      ctx.restore();
    }

    // 4. Draw answer texts
    const answerBoxes = [
      { box: REGIONS.q1Box, text: data.coolest },
      { box: REGIONS.q2Box, text: data.reason },
      { box: REGIONS.q3Box, text: data.harvest },
    ];

    answerBoxes.forEach(({ box, text }) => {
      if (!text) return;
      ctx.save();
      let fontSize = Math.round(17 * s);
      ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Auto-shrink
      let textWidth = ctx.measureText(text).width;
      const maxWidth = box.w * s * 0.88;
      if (textWidth > maxWidth) {
        fontSize = Math.floor(fontSize * (maxWidth / textWidth));
        ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      }
      ctx.fillText(text, (box.x + box.w / 2) * s, (box.y + box.h / 2) * s);
      ctx.restore();
    });
  }, [data, displayScale]);

  // Load background image once
  useEffect(() => {
    if (bgLoadedRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      bgImageRef.current = img;
      bgLoadedRef.current = true;
      drawPoster();
    };
    img.onerror = () => {
      bgLoadedRef.current = false;
      drawPoster();
    };
    img.src = BG_URL;
  }, []); // eslint-disable-line

  // Load photo when URL changes
  useEffect(() => {
    if (data.photoUrl === photoUrlRef.current) {
      drawPoster();
      return;
    }
    photoUrlRef.current = data.photoUrl;
    if (!data.photoUrl) {
      photoImageRef.current = null;
      drawPoster();
      return;
    }
    const img = new Image();
    img.onload = () => {
      photoImageRef.current = img;
      drawPoster();
    };
    img.onerror = () => {
      photoImageRef.current = null;
      drawPoster();
    };
    img.src = data.photoUrl;
  }, [data.photoUrl, drawPoster]);

  // Redraw when other data changes
  useEffect(() => {
    drawPoster();
  }, [drawPoster]);

  // Drag handlers for photo repositioning
  const isInPhotoBox = useCallback(
    (clientX: number, clientY: number): boolean => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / (rect.width / PREVIEW_W);
      const y = (clientY - rect.top) / (rect.height / PREVIEW_H);
      const pb = REGIONS.photoBox;
      return x >= pb.x && x <= pb.x + pb.w && y >= pb.y && y <= pb.y + pb.h;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!data.photoUrl || !onChange) return;
      if (!isInPhotoBox(e.clientX, e.clientY)) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: data.imgOffsetX,
        oy: data.imgOffsetY,
      };
    },
    [data.photoUrl, data.imgOffsetX, data.imgOffsetY, onChange, isInPhotoBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !onChange) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = PREVIEW_W / rect.width;
      const scaleY = PREVIEW_H / rect.height;
      const dx = (e.clientX - dragStartRef.current.x) * scaleX;
      const dy = (e.clientY - dragStartRef.current.y) * scaleY;
      onChange({
        imgOffsetX: dragStartRef.current.ox + dx,
        imgOffsetY: dragStartRef.current.oy + dy,
      });
    },
    [isDragging, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Touch support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!data.photoUrl || !onChange) return;
      const touch = e.touches[0];
      if (!touch || !isInPhotoBox(touch.clientX, touch.clientY)) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        ox: data.imgOffsetX,
        oy: data.imgOffsetY,
      };
    },
    [data.photoUrl, data.imgOffsetX, data.imgOffsetY, onChange, isInPhotoBox]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !dragStartRef.current || !onChange) return;
      const touch = e.touches[0];
      if (!touch) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = PREVIEW_W / rect.width;
      const scaleY = PREVIEW_H / rect.height;
      const dx = (touch.clientX - dragStartRef.current.x) * scaleX;
      const dy = (touch.clientY - dragStartRef.current.y) * scaleY;
      onChange({
        imgOffsetX: dragStartRef.current.ox + dx,
        imgOffsetY: dragStartRef.current.oy + dy,
      });
    },
    [isDragging, onChange]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const cursorStyle =
    data.photoUrl && onChange
      ? isDragging
        ? "grabbing"
        : "grab"
      : "default";

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, display: "block", cursor: cursorStyle }}
        className="rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {data.photoUrl && onChange && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-xs px-2 py-0.5 rounded-full pointer-events-none">
          拖拽图片区域可调整位置
        </div>
      )}
    </div>
  );
}
