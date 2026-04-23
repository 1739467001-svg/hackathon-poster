import { useState, useCallback, useRef } from "react";
import { Download, Monitor, Loader2 } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Monitor size={16} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                黑客松海报生成器
              </h1>
              <p className="text-xs text-muted-foreground">
                去探索AI · 行知百城千县行动计划
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6">
        <div className="flex gap-6 items-start" ref={containerRef}>
          {/* Left: Poster Preview */}
          <div className="flex-none">
            <div className="sticky top-24">
              <div className="mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  实时预览
                </span>
              </div>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl -z-10 scale-95" />
                <div className="border border-border/50 rounded-xl overflow-hidden shadow-2xl">
                  <PosterCanvas ref={posterRef} data={data} onChange={handleChange} width={420} />
                </div>
              </div>
              {/* Poster dimensions hint */}
              <p className="text-xs text-muted-foreground text-center mt-2">
                A4 竖版 · 2748 × 4119 px
              </p>
            </div>
          </div>

          {/* Right: Control Panel */}
          <div className="flex-1 min-w-0 max-w-md">
            {/* Panel header */}
            <div className="mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                参数配置
              </span>
            </div>

            <ControlPanel data={data} onChange={handleChange} />

            {/* Download button */}
            <div className="mt-6">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                {downloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    正在生成图片...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    下载海报图片
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                点击后将生成 PNG 图片（1100 × 1648 px）
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container text-center text-xs text-muted-foreground">
          去探索AI · 行知百城千县行动计划 · 2050黑客松
        </div>
      </footer>
    </div>
  );
}
