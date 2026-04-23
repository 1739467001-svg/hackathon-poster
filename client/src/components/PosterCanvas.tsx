import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";

// PDF原始尺寸: 2748 x 4096
// 预览底图尺寸: 1100 x 1640 (0.4003x缩放)
const PDF_W = 2748;
const PDF_H = 4096;
const PREVIEW_W = 1100;
const PREVIEW_H = 1640;
const PDF_TO_PREVIEW = PREVIEW_W / PDF_W; // 0.400291

// 各区域在预览图(1100x1640)中的坐标（像素级精确测量 v2）
const REGIONS = {
  // 图二灰色框（精确测量）: 预览坐标 x=237, y=483, w=663, h=296
  photoBox: {
    x: 237,
    y: 483,
    w: 663,
    h: 296,
  },
  // INFORMATION黑色填写框: 预览坐标 x=253, y=845, w=726, h=109
  infoBox: {
    x: 253,
    y: 845,
    w: 726,
    h: 109,
  },
  // 问题1答案框（最酷的事）: 预览坐标 x=478, y=1117, w=618, h=95
  q1Box: {
    x: 478,
    y: 1117,
    w: 618,
    h: 95,
  },
  // 问题2答案框（报名原因）: 预览坐标 x=451, y=1257, w=648, h=94
  q2Box: {
    x: 451,
    y: 1257,
    w: 648,
    h: 94,
  },
  // 问题3答案框（收获）: 预览坐标 x=451, y=1396, w=648, h=94
  q3Box: {
    x: 451,
    y: 1396,
    w: 648,
    h: 94,
  },
};

export interface PosterCanvasHandle {
  exportImage: () => Promise<string>;
}

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

const BG_URL = "/manus-storage/poster_bg_latest_d67ef19f.png";

const PosterCanvas = forwardRef<PosterCanvasHandle, Props>(function PosterCanvas(
  { data, onChange, width = 440 },
  ref
) {
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

  // Expose exportImage: renders at full resolution and returns PNG data URL
  useImperativeHandle(
    ref,
    () => ({
      exportImage: () =>
        new Promise<string>((resolve, reject) => {
          const offscreen = document.createElement("canvas");
          offscreen.width = PREVIEW_W;
          offscreen.height = PREVIEW_H;
          const ctx = offscreen.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not available"));
            return;
          }
          const s = 1;
          const render = () => {
            ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
            // 1. Background
            if (bgImageRef.current && bgLoadedRef.current) {
              ctx.drawImage(bgImageRef.current, 0, 0, PREVIEW_W, PREVIEW_H);
            } else {
              ctx.fillStyle = "#1a1a2e";
              ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
            }
            // 2. Photo
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
            // 3. INFORMATION text
            const ib = REGIONS.infoBox;
            if (data.name || data.hometown) {
              const parts: string[] = [];
              if (data.name) parts.push(`@${data.name}`);
              if (data.hometown) parts.push(`#${data.hometown}`);
              const infoText = parts.join("     ");
              ctx.save();
              let fontSize = Math.round(20 * s);
              ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              ctx.fillStyle = "#ffffff";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              const textWidth = ctx.measureText(infoText).width;
              const maxWidth = ib.w * s * 0.9;
              if (textWidth > maxWidth) {
                fontSize = Math.floor(fontSize * (maxWidth / textWidth));
                ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              }
              ctx.fillText(infoText, (ib.x + ib.w / 2) * s, (ib.y + ib.h / 2) * s);
              ctx.restore();
            }
            // 4. Answer texts
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
              const textWidth = ctx.measureText(text).width;
              const maxWidth = box.w * s * 0.88;
              if (textWidth > maxWidth) {
                fontSize = Math.floor(fontSize * (maxWidth / textWidth));
                ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              }
              ctx.fillText(text, (box.x + box.w / 2) * s, (box.y + box.h / 2) * s);
              ctx.restore();
            });
            resolve(offscreen.toDataURL("image/png"));
          };
          if (bgLoadedRef.current) {
            render();
          } else {
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            bgImg.onload = () => {
              bgImageRef.current = bgImg;
              bgLoadedRef.current = true;
              render();
            };
            bgImg.onerror = () => render();
            bgImg.src = BG_URL;
          }
        }),
    }),
    [data] // eslint-disable-line
  );

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
});

export default PosterCanvas;
