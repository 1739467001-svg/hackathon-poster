import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";

// 背景图原始尺寸: 2200 x 3120
const PREVIEW_W = 2200;
const PREVIEW_H = 3120;

// A4 导出尺寸 (300dpi): 2480 x 3508
const A4_W = 2480;
const A4_H = 3508;

// 各区域在背景图(2200x3120)中的坐标（基于新版海报模板精确测量）
const REGIONS = {
  // 照片框（白色/灰色区域，完全覆盖）精确测量: x=693-1646, y=1009-1800
  photoBox: {
    x: 685,
    y: 1001,
    w: 969,
    h: 807,
  },
  // 名字框（"探索者"右侧横条）
  // 探索者文字右边界约 x=870，横条范围 y=780-920（高140px）
  // 名字从 x=600 开始，向右延伸到 x=1800，整体居中
  nameBox: {
    x: 600,
    y: 780,
    w: 1200,
    h: 140,
  },
  // 问题1答案框（精确测量: x=1105, y=2090, w=845, h=230）
  q1Box: {
    x: 1105,
    y: 2090,
    w: 845,
    h: 230,
  },
  // 问题2答案框（精确测量: x=1100, y=2340, w=850, h=250）
  q2Box: {
    x: 1100,
    y: 2340,
    w: 850,
    h: 250,
  },
  // 问题3答案框（精确测量: x=1109, y=2600, w=841, h=260）
  q3Box: {
    x: 1109,
    y: 2600,
    w: 841,
    h: 260,
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

// 自动换行文字绘制函数（垂直居中）
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  boxH: number
): void {
  if (!text) return;
  const chars = text.split("");
  const lines: string[] = [];
  let currentLine = "";

  for (const char of chars) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // 垂直居中：计算总高度后从中间开始
  const totalH = lines.length * lineHeight;
  const startY = y + (boxH - totalH) / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

// 绘制海报内容的通用函数（支持任意 scale）
function renderPosterContent(
  ctx: CanvasRenderingContext2D,
  bgImage: HTMLImageElement | null,
  photoImage: HTMLImageElement | null,
  data: PosterData,
  canvasW: number,
  canvasH: number,
  bgW: number,
  bgH: number
) {
  // 计算背景图到画布的缩放比
  const scaleX = canvasW / bgW;
  const scaleY = canvasH / bgH;
  // 使用等比缩放（cover 模式）
  const bgScale = Math.max(scaleX, scaleY);
  const bgDrawW = bgW * bgScale;
  const bgDrawH = bgH * bgScale;
  const bgOffX = (canvasW - bgDrawW) / 2;
  const bgOffY = (canvasH - bgDrawH) / 2;

  // 将 REGIONS 坐标从背景图空间转换到画布空间
  const toCanvas = (v: number, isX: boolean) => {
    return isX ? v * bgScale + bgOffX : v * bgScale + bgOffY;
  };
  const scaleLen = (v: number) => v * bgScale;

  ctx.clearRect(0, 0, canvasW, canvasH);

  // 1. 绘制背景
  if (bgImage) {
    ctx.drawImage(bgImage, bgOffX, bgOffY, bgDrawW, bgDrawH);
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // 2. 绘制照片
  const pb = REGIONS.photoBox;
  if (photoImage && data.photoUrl) {
    const boxX = toCanvas(pb.x, true);
    const boxY = toCanvas(pb.y, false);
    const boxW = scaleLen(pb.w);
    const boxH = scaleLen(pb.h);

    const photoRatio = photoImage.naturalWidth / photoImage.naturalHeight;
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
    const drawX = boxX + (boxW - scaledW) / 2 + data.imgOffsetX * bgScale;
    const drawY = boxY + (boxH - scaledH) / 2 + data.imgOffsetY * bgScale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.clip();
    ctx.drawImage(photoImage, drawX, drawY, scaledW, scaledH);
    ctx.restore();
  }

  // 3. 绘制名字（探索者右侧，居中，字号放大）
  const nb = REGIONS.nameBox;
  if (data.name) {
    ctx.save();
    let fontSize = Math.round(36 * bgScale);
    ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxW = scaleLen(nb.w) - scaleLen(20);
    const tw = ctx.measureText(data.name).width;
    if (tw > maxW) {
      fontSize = Math.floor(fontSize * maxW / tw);
      ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    }
    const centerX = toCanvas(nb.x + nb.w / 2, true);
    const centerY = toCanvas(nb.y + nb.h / 2, false);
    ctx.fillText(data.name, centerX, centerY);
    ctx.restore();
  }

  // 4. 绘制答案文字（自动换行，垂直居中）
  const answerBoxes = [
    { box: REGIONS.q1Box, text: data.coolest },
    { box: REGIONS.q2Box, text: data.reason },
    { box: REGIONS.q3Box, text: data.harvest },
  ];

  answerBoxes.forEach(({ box, text }) => {
    if (!text) return;
    ctx.save();
    const fontSize = Math.round(44 * bgScale);
    ctx.font = `700 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const paddingX = scaleLen(20);
    const maxWidth = scaleLen(box.w) - paddingX * 2;
    const lineHeight = fontSize * 1.4;
    drawWrappedText(
      ctx,
      text,
      toCanvas(box.x, true) + paddingX,
      toCanvas(box.y, false),
      maxWidth,
      lineHeight,
      scaleLen(box.h)
    );
    ctx.restore();
  });
}

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

  // Canvas display scale (preview)
  const displayScale = width / PREVIEW_W;
  const height = Math.round(PREVIEW_H * displayScale);

  // Draw everything on canvas
  const drawPoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderPosterContent(
      ctx,
      bgLoadedRef.current ? bgImageRef.current : null,
      photoImageRef.current,
      data,
      canvas.width,
      canvas.height,
      PREVIEW_W,
      PREVIEW_H
    );
  }, [data]);

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

  const cursorStyle = data.photoUrl ? (isDragging ? "grabbing" : "grab") : "default";

  // Expose exportImage: renders at A4 resolution (2480x3508) and returns PNG data URL
  useImperativeHandle(
    ref,
    () => ({
      exportImage: () =>
        new Promise<string>((resolve, reject) => {
          const offscreen = document.createElement("canvas");
          offscreen.width = A4_W;
          offscreen.height = A4_H;
          const ctx = offscreen.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not available"));
            return;
          }

          const render = () => {
            renderPosterContent(
              ctx,
              bgLoadedRef.current ? bgImageRef.current : null,
              photoImageRef.current,
              data,
              A4_W,
              A4_H,
              PREVIEW_W,
              PREVIEW_H
            );
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
