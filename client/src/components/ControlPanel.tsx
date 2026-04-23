import { useRef, useCallback } from "react";
import { Upload, RotateCcw, User, MapPin, Zap, HelpCircle, Trophy } from "lucide-react";
import type { PosterData } from "./PosterCanvas";

interface Props {
  data: PosterData;
  onChange: (patch: Partial<PosterData>) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-sm w-8 shrink-0">{label}</span>
      <div className="relative flex-1">
        <div
          className="absolute top-1/2 left-0 h-1 rounded-full -translate-y-1/2 pointer-events-none"
          style={{
            width: `${pct}%`,
            background: "oklch(0.72 0.18 35)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full relative z-10"
          style={{ background: "transparent" }}
        />
      </div>
      <span className="text-muted-foreground text-sm w-14 text-right shrink-0">
        {unit === "%" ? `${Math.round(value * 100)}%` : value}
      </span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ControlPanel({ data, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange({ photoUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleResetImage = useCallback(() => {
    onChange({ imgScale: 1, imgOffsetX: 0, imgOffsetY: 0 });
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* 头像上传 */}
      <SectionCard icon={<User size={15} />} title="头像图片">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-3 px-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Upload size={16} />
          {data.photoUrl ? "重新上传图片" : "点击上传头像图片"}
        </button>
        {data.photoUrl && (
          <div className="flex items-center gap-3">
            <img
              src={data.photoUrl}
              alt="preview"
              className="w-12 h-12 rounded-lg object-cover border border-border"
            />
            <span className="text-xs text-muted-foreground">图片已上传，可在左侧调整位置</span>
          </div>
        )}
      </SectionCard>

      {/* 图片缩放与平移 */}
      {data.photoUrl && (
        <SectionCard icon={<Zap size={15} />} title="图片调整">
          <SliderRow
            label="缩放"
            value={data.imgScale}
            min={0.3}
            max={3}
            step={0.05}
            onChange={(v) => onChange({ imgScale: v })}
            unit="%"
          />
          <SliderRow
            label="水平"
            value={data.imgOffsetX}
            min={-400}
            max={400}
            step={1}
            onChange={(v) => onChange({ imgOffsetX: v })}
          />
          <SliderRow
            label="垂直"
            value={data.imgOffsetY}
            min={-400}
            max={400}
            step={1}
            onChange={(v) => onChange({ imgOffsetY: v })}
          />
          <button
            onClick={handleResetImage}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
          >
            <RotateCcw size={12} />
            恢复默认
          </button>
        </SectionCard>
      )}

      {/* 称呼与家乡 */}
      <SectionCard icon={<MapPin size={15} />} title="个人信息">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm font-bold w-6">@</span>
            <input
              type="text"
              placeholder="你的称呼"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              maxLength={20}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm font-bold w-6">#</span>
            <input
              type="text"
              placeholder="你的家乡"
              value={data.hometown}
              onChange={(e) => onChange({ hometown: e.target.value })}
              maxLength={20}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </SectionCard>

      {/* 三个问题 */}
      <SectionCard icon={<HelpCircle size={15} />} title="关于你的故事">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              你做过最酷的事情是什么？
            </label>
            <input
              type="text"
              placeholder="最酷的事"
              value={data.coolest}
              onChange={(e) => onChange({ coolest: e.target.value })}
              maxLength={30}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              你为什么报名参加黑客松？
            </label>
            <input
              type="text"
              placeholder="报名原因"
              value={data.reason}
              onChange={(e) => onChange({ reason: e.target.value })}
              maxLength={30}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
              <Trophy size={11} className="text-primary" />
              黑客松给你带来哪些收获？
            </label>
            <input
              type="text"
              placeholder="收获"
              value={data.harvest}
              onChange={(e) => onChange({ harvest: e.target.value })}
              maxLength={30}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
