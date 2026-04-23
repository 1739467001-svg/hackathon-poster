import { useState, useCallback, useRef } from "react";
import { Download, Loader2, Cpu, Zap } from "lucide-react";
import PosterCanvas, { type PosterData, type PosterCanvasHandle } from "@/components/PosterCanvas";
import ControlPanel from "@/components/ControlPanel";
import { toast } from "sonner";

const DEFAULT_DATA: PosterData = {
  name: "",
  hometown: "",
  coolest: "",
  reason: "",
  harvest: "",
  photoUrl: null,
  imgScale: 1,
  imgOffsetX: 0,
  imgOffsetY: 0,
};

export default function Home() {
  const [data, setData] = useState<PosterData>(DEFAULT_DATA);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<PosterCanvasHandle>(null);

  const handleChange = useCallback((patch: Partial<PosterData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) {
      toast.error("海报组件未就绪，请稍后重试");
      return;
    }
    setDownloading(true);
    try {
      const dataUrl = await posterRef.current.exportImage();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "黑客松海报.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("海报图片下载成功！");
    } catch (err: any) {
      console.error(err);
      toast.error(`下载失败：${err.message}`);
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.055 0.006 260)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b scan-line"
        style={{
          background: "oklch(0.08 0.008 255 / 0.95)",
          borderColor: "oklch(0.22 0.010 255)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              {/* Icon badge */}
              <div
                className="relative flex items-center justify-center w-9 h-9 rounded shrink-0"
                style={{
                  background: "oklch(0.65 0.22 40 / 0.12)",
                  border: "1px solid oklch(0.65 0.22 40 / 0.5)",
                  boxShadow: "0 0 10px oklch(0.65 0.22 40 / 0.25)",
                }}
              >
                <Cpu size={16} style={{ color: "oklch(0.72 0.22 44)" }} />
                {/* corner accents */}
                <span
                  className="absolute top-0 left-0 w-2 h-2"
                  style={{
                    borderTop: "1.5px solid oklch(0.65 0.22 40)",
                    borderLeft: "1.5px solid oklch(0.65 0.22 40)",
                  }}
                />
                <span
                  className="absolute bottom-0 right-0 w-2 h-2"
                  style={{
                    borderBottom: "1.5px solid oklch(0.65 0.22 40)",
                    borderRight: "1.5px solid oklch(0.65 0.22 40)",
                  }}
                />
              </div>
              <div>
                <h1
                  className="text-base md:text-lg font-black leading-tight tracking-wide"
                  style={{
                    color: "oklch(0.94 0.005 80)",
                    fontFamily: "'Noto Sans SC', sans-serif",
                    letterSpacing: "0.04em",
                  }}
                >
                  黑客松海报生成器
                </h1>
                <p
                  className="text-xs hidden sm:block"
                  style={{ color: "oklch(0.65 0.22 40)", letterSpacing: "0.06em" }}
                >
                  去探索AI · 行知百城千县行动计划
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded text-xs"
              style={{
                background: "oklch(0.65 0.22 40 / 0.08)",
                border: "1px solid oklch(0.65 0.22 40 / 0.3)",
                color: "oklch(0.65 0.22 40)",
                letterSpacing: "0.08em",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "oklch(0.65 0.22 40)" }}
              />
              SYSTEM ONLINE
            </div>
          </div>
        </div>

        {/* Orange accent line at bottom */}
        <div
          className="h-px w-full"
          style={{
            background: "linear-gradient(90deg, transparent, oklch(0.65 0.22 40 / 0.6) 30%, oklch(0.65 0.22 40 / 0.6) 70%, transparent)",
          }}
        />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 container py-4 md:py-6">
        {/* Mobile subtitle */}
        <p
          className="text-center text-xs mb-4 sm:hidden"
          style={{ color: "oklch(0.65 0.22 40)", letterSpacing: "0.06em" }}
        >
          去探索AI · 行知百城千县行动计划
        </p>

        {/*
          Layout:
          - Mobile (<768px): stacked, poster on top
          - Tablet (768-1023px): side by side, equal columns
          - Desktop (≥1024px): side by side, poster fixed left, panel scrollable right
        */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">

          {/* ── Left: Poster Preview ── */}
          <div className="w-full md:w-auto md:flex-none md:sticky md:top-24">
            {/* Label */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "oklch(0.65 0.22 40)" }}
              />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "oklch(0.55 0.18 40)" }}
              >
                实时预览
              </span>
              <span
                className="text-xs ml-auto"
                style={{ color: "oklch(0.38 0.008 255)" }}
              >
                拖拽图片区域可调整位置
              </span>
            </div>

            {/* Poster frame */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                border: "1px solid oklch(0.55 0.18 40 / 0.5)",
                boxShadow:
                  "0 0 0 1px oklch(0.22 0.010 255), 0 0 30px oklch(0.65 0.22 40 / 0.15), 0 20px 60px oklch(0 0 0 / 0.5)",
              }}
            >
              {/* Corner accents */}
              <span
                className="absolute top-0 left-0 w-4 h-4 z-10 pointer-events-none"
                style={{
                  borderTop: "2px solid oklch(0.65 0.22 40)",
                  borderLeft: "2px solid oklch(0.65 0.22 40)",
                }}
              />
              <span
                className="absolute bottom-0 right-0 w-4 h-4 z-10 pointer-events-none"
                style={{
                  borderBottom: "2px solid oklch(0.65 0.22 40)",
                  borderRight: "2px solid oklch(0.65 0.22 40)",
                }}
              />
              <span
                className="absolute top-0 right-0 w-4 h-4 z-10 pointer-events-none"
                style={{
                  borderTop: "2px solid oklch(0.45 0.12 38 / 0.5)",
                  borderRight: "2px solid oklch(0.45 0.12 38 / 0.5)",
                }}
              />
              <span
                className="absolute bottom-0 left-0 w-4 h-4 z-10 pointer-events-none"
                style={{
                  borderBottom: "2px solid oklch(0.45 0.12 38 / 0.5)",
                  borderLeft: "2px solid oklch(0.45 0.12 38 / 0.5)",
                }}
              />

              {/* Responsive canvas width */}
              <div className="block md:hidden">
                <PosterCanvas ref={posterRef} data={data} onChange={handleChange} width={Math.min(340, typeof window !== 'undefined' ? window.innerWidth - 48 : 340)} />
              </div>
              <div className="hidden md:block lg:hidden">
                <PosterCanvas ref={posterRef} data={data} onChange={handleChange} width={340} />
              </div>
              <div className="hidden lg:block">
                <PosterCanvas ref={posterRef} data={data} onChange={handleChange} width={420} />
              </div>
            </div>

            {/* Spec tag */}
            <div className="flex items-center justify-between mt-2 px-1">
              <span
                className="text-xs"
                style={{ color: "oklch(0.35 0.008 255)", fontFamily: "monospace" }}
              >
                /// 2748 × 4096 PX · PNG
              </span>
              <span
                className="text-xs"
                style={{ color: "oklch(0.35 0.008 255)", fontFamily: "monospace" }}
              >
                A4 PORTRAIT
              </span>
            </div>
          </div>

          {/* ── Right: Control Panel ── */}
          <div className="w-full md:flex-1 md:min-w-0 md:max-w-md lg:max-w-lg md:max-h-[calc(100vh-8rem)] md:overflow-y-auto md:pr-1">
            {/* Panel header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.55 0.18 40)" }}
              />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "oklch(0.55 0.18 40)" }}
              >
                参数配置
              </span>
            </div>

            <ControlPanel data={data} onChange={handleChange} />

            {/* Download button */}
            <div className="mt-5">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-orange w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {downloading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>正在生成图片...</span>
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    <span>下载海报图片</span>
                    <Zap size={13} className="ml-1 opacity-70" />
                  </>
                )}
              </button>
              <p
                className="text-xs text-center mt-2"
                style={{ color: "oklch(0.38 0.008 255)" }}
              >
                导出高清 PNG · 1100 × 1640 px
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t py-4 mt-4"
        style={{ borderColor: "oklch(0.18 0.010 255)" }}
      >
        <div className="container">
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
            style={{ color: "oklch(0.35 0.008 255)", fontFamily: "monospace" }}
          >
            <span>/// HACKATHON POSTER GENERATOR</span>
            <span style={{ color: "oklch(0.45 0.14 40)" }}>
              去探索AI · 行知百城千县行动计划 · 2050
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
