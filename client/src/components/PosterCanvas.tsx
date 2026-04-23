import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";

// 新背景图尺寸: 2200 x 3278
const PREVIEW_W = 2200;
const PREVIEW_H = 3278;
// 各区域在背景图(2200x3278)中的坐标（基于新版海报模板精确测量）
const REGIONS = {
  // 照片框（灰色区域）x=459-1815, y=860-1560
  photoBox: {
    x: 459,
    y: 860,
    w: 1356,
    h: 700,
  },
  // INFORMATION 信息栏 x=700-1800, y=1720-1880（暗色内容区域，INFORMATION标签右侧）
  infoBox: {
    x: 700,
    y: 1720,
    w: 1080,
    h: 160,
  },
  // 问题1答案框（右侧暗色框）x=1200-1930, y=2200-2450
  q1Box: {
    x: 1200,
    y: 2200,
    w: 730,
    h: 250,
  },
  // 问题2答案框（右侧暗色框）x=1200-1930, y=2500-2700
  q2Box: {
    x: 1200,
    y: 2500,
    w: 730,
    h: 200,
  },
  // 问题3答案框（右侧暗色框）x=1200-1930, y=2750-3000
  q3Box: {
    x: 1200,
    y: 2750,
    w: 730,
    h: 250,
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

const BG_URL = "/poster_bg.png";

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
      ctx.save();
      let fontSize = Math.round(36 * s);
      ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      const centerY = (ib.y + ib.h / 2) * s;
      const paddingX = 30 * s;
      // Auto-shrink: check combined width
      const nameText = data.name ? `@${data.name}` : "";
      const hometownText = data.hometown ? `#${data.hometown}` : "";
      const combinedWidth = ctx.measureText(nameText).width + ctx.measureText(hometownText).width + paddingX * 2;
      const maxWidth = ib.w * s - paddingX * 2;
      if (combinedWidth > maxWidth) {
        fontSize = Math.floor(fontSize * (maxWidth / combinedWidth));
        ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      }
      // Name: left-aligned
      if (nameText) {
        ctx.textAlign = "left";
        ctx.fillText(nameText, ib.x * s + paddingX, centerY);
      }
      // Hometown: right-aligned
      if (hometownText) {
        ctx.textAlign = "right";
        ctx.fillText(hometownText, (ib.x + ib.w) * s - paddingX, centerY);
      }
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
      let fontSize = Math.round(42 * s);
      ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      // Auto-shrink if text too wide
      let textWidth = ctx.measureText(text).width;
      const paddingX = 20 * s;
      const maxWidth = box.w * s - paddingX * 2;
      if (textWidth > maxWidth) {
        fontSize = Math.floor(fontSize * (maxWidth / textWidth));
        ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
      }
      ctx.fillText(text, (box.x) * s + paddingX, (box.y + box.h / 2) * s);
      ctx.restore();
    });
  }, [data, displayScale]);

  // Load background image once
  useEffect(() => {
    if (bgLoadedRef.current) return;
    const img = new Image();
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
              ctx.save();
              let fontSize = Math.round(36 * s);
              ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              ctx.fillStyle = "#ffffff";
              ctx.textBaseline = "middle";
              const centerY = (ib.y + ib.h / 2) * s;
              const paddingX = 30 * s;
              const nameText = data.name ? `@${data.name}` : "";
              const hometownText = data.hometown ? `#${data.hometown}` : "";
              const combinedWidth = ctx.measureText(nameText).width + ctx.measureText(hometownText).width + paddingX * 2;
              const maxWidth = ib.w * s - paddingX * 2;
              if (combinedWidth > maxWidth) {
                fontSize = Math.floor(fontSize * (maxWidth / combinedWidth));
                ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              }
              if (nameText) {
                ctx.textAlign = "left";
                ctx.fillText(nameText, ib.x * s + paddingX, centerY);
              }
              if (hometownText) {
                ctx.textAlign = "right";
                ctx.fillText(hometownText, (ib.x + ib.w) * s - paddingX, centerY);
              }
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
              let fontSize = Math.round(42 * s);
              ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              ctx.fillStyle = "#ffffff";
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              let textWidth = ctx.measureText(text).width;
              const paddingX = 20 * s;
              const maxWidth = box.w * s - paddingX * 2;
              if (textWidth > maxWidth) {
                fontSize = Math.floor(fontSize * (maxWidth / textWidth));
                ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
              }
              ctx.fillText(text, (box.x) * s + paddingX, (box.y + box.h / 2) * s);
              ctx.restore();
            });
            resolve(offscreen.toDataURL("image/png"));
          };
          if (bgLoadedRef.current) {
            render();
          } else {
            const bgImg = new Image();
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
