import { useState, useCallback, useRef } from "react";
import { Download, Loader2, Zap } from "lucide-react";
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
      a.download = "黑客松海报_A4.png";
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
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.08 0.005 240)" }}>
      {/* Scan line */}
      <div className="scan-line" />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "oklch(0.10 0.008 240 / 0.95)",
          borderColor: "oklch(0.68 0.20 35 / 0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="relative flex items-center justify-center w-9 h-9 rounded"
                style={{
                  background: "oklch(0.68 0.20 35 / 0.12)",
                  border: "1px solid oklch(0.68 0.20 35 / 0.50)",
                  boxShadow: "0 0 10px oklch(0.68 0.20 35 / 0.25)",
                }}
              >
                <Zap size={18} style={{ color: "var(--orange)" }} />
                {/* Corner dots */}
                <span className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full" style={{ background: "var(--orange)", opacity: 0.8 }} />
                <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full" style={{ background: "var(--orange)", opacity: 0.8 }} />
              </div>
              <div>
                <h1
                  className="font-orbitron font-black leading-tight tracking-wide glow-text"
                  style={{ color: "var(--orange)", fontSize: "clamp(14px, 2.5vw, 20px)" }}
                >
                  黑客松海报生成器
                </h1>
                <p className="text-xs tracking-widest" style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                  去探索AI&nbsp;·&nbsp;行知百城千县行动计划
                </p>
              </div>
            </div>

            {/* Right: Status badges */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="pulse-dot" />
                <span className="font-orbitron text-xs" style={{ color: "var(--text-secondary)" }}>LIVE</span>
              </div>
              <div className="tech-tag">2050 HACKATHON</div>
            </div>
          </div>
        </div>

        {/* Orange accent line */}
        <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, var(--orange), transparent)" }} />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 container py-4 md:py-6">

        {/* ── Desktop / Tablet: side-by-side; Mobile: stacked ── */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6 md:items-start">

          {/* ── LEFT: Poster Preview ── */}
          <div className="w-full md:sticky md:top-[72px]" style={{ flex: '0 0 auto', maxWidth: '440px' }}>
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="pulse-dot" />
              <span className="font-orbitron text-xs tracking-widest" style={{ color: "var(--text-secondary)" }}>
                LIVE PREVIEW
              </span>
              <div className="flex-1 tech-divider" />
            </div>

            {/* Poster frame */}
            <div
              className="corner-bracket relative rounded-lg overflow-hidden"
              style={{
                border: "1px solid oklch(0.68 0.20 35 / 0.35)",
                boxShadow: "0 0 30px oklch(0.68 0.20 35 / 0.15), 0 0 60px oklch(0.68 0.20 35 / 0.06)",
                background: "oklch(0.06 0.005 240)",
              }}
            >
              {/* Top bar */}
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  background: "oklch(0.11 0.008 240)",
                  borderBottom: "1px solid oklch(0.68 0.20 35 / 0.20)",
                }}
              >
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
                </div>
                <span className="font-orbitron text-xs flex-1 text-center" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                  POSTER_RENDER.canvas
                </span>
              </div>

              {/* Canvas */}
              <div className="flex justify-center p-2 md:p-3">
                <PosterCanvas
                  ref={posterRef}
                  data={data}
                  onChange={handleChange}
                  width={360}
                />
              </div>

              {/* Bottom info bar */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{
                  background: "oklch(0.11 0.008 240)",
                  borderTop: "1px solid oklch(0.68 0.20 35 / 0.20)",
                }}
              >
                <span className="font-orbitron text-xs" style={{ color: "var(--text-muted)", fontSize: "9px" }}>
                  2480 × 3508 PX · A4
                </span>
                <span className="font-orbitron text-xs" style={{ color: "var(--orange)", fontSize: "9px" }}>
                  PNG EXPORT
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Control Panel ── */}
          <div className="w-full md:flex-1 md:min-w-0">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80" }} />
              <span className="font-orbitron text-xs tracking-widest" style={{ color: "var(--text-secondary)" }}>
                PARAMETERS
              </span>
              <div className="flex-1 tech-divider" />
            </div>

            {/* Panel */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                border: "1px solid oklch(0.68 0.20 35 / 0.20)",
                background: "oklch(0.11 0.008 240)",
              }}
            >
              {/* Panel header bar */}
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{
                  background: "oklch(0.13 0.010 240)",
                  borderBottom: "1px solid oklch(0.68 0.20 35 / 0.15)",
                }}
              >
                <span className="font-orbitron text-xs tracking-widest" style={{ color: "var(--orange)", fontSize: "10px" }}>
                  CONFIG PANEL
                </span>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ background: "var(--orange)", opacity: 0.4 + i * 0.2 }} />
                  ))}
                </div>
              </div>

              {/* Scrollable control area */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <ControlPanel data={data} onChange={handleChange} />
              </div>
            </div>

            {/* ── Download Button ── */}
            <div className="mt-4">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-download w-full flex items-center justify-center gap-3 py-4 text-sm"
              >
                {downloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>GENERATING...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>下载海报图片</span>
                  </>
                )}
              </button>
              <p className="text-center mt-2 font-orbitron" style={{ color: "var(--text-muted)", fontSize: "10px", letterSpacing: "0.08em" }}>
                OUTPUT: PNG · 2480 × 3508 PX · A4 300DPI
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-8"
        style={{
          borderTop: "1px solid oklch(0.68 0.20 35 / 0.15)",
          background: "oklch(0.10 0.008 240)",
        }}
      >
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-orbitron text-xs" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
              © 2050 HACKATHON · 去探索AI
            </span>
            <span className="font-orbitron text-xs" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
              行知百城千县行动计划
            </span>
          </div>
        </div>
        <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, oklch(0.68 0.20 35 / 0.30), transparent)" }} />
      </footer>
    </div>
  );
}
