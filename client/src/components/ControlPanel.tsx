import { useRef, useCallback } from "react";
import { Upload, RotateCcw, User, MapPin, Zap, HelpCircle, Trophy, ImageIcon } from "lucide-react";
import type { PosterData } from "./PosterCanvas";

interface Props {
  data: PosterData;
  onChange: (patch: Partial<PosterData>) => void;
}

/* ── Slider Row ── */
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
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayVal = unit === "%" ? `${Math.round(value * 100)}%` : value;

  return (
    <div className="flex items-center gap-3">
      <span
        className="font-orbitron shrink-0 w-8 text-right"
        style={{ color: "var(--text-secondary)", fontSize: "11px" }}
      >
        {label}
      </span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div
          className="absolute inset-x-0 rounded-full"
          style={{ height: "3px", background: "oklch(0.16 0.010 240)" }}
        />
        {/* Track fill */}
        <div
          className="absolute left-0 rounded-full"
          style={{
            height: "3px",
            width: `${pct}%`,
            background: "linear-gradient(90deg, oklch(0.52 0.18 35), oklch(0.68 0.20 35))",
            boxShadow: "0 0 6px oklch(0.68 0.20 35 / 0.5)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tech-slider relative z-10"
          style={{ background: "transparent" }}
        />
      </div>
      <span
        className="font-orbitron shrink-0 w-12 text-right"
        style={{ color: "var(--orange)", fontSize: "11px" }}
      >
        {displayVal}
      </span>
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({
  icon,
  title,
  tag,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="corner-bracket relative"
      style={{
        background: "oklch(0.13 0.010 240)",
        border: "1px solid oklch(0.68 0.20 35 / 0.20)",
        borderRadius: "6px",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--orange)" }}>{icon}</span>
          <span
            className="font-orbitron font-bold tracking-wide"
            style={{ color: "oklch(0.85 0.008 60)", fontSize: "12px" }}
          >
            {title}
          </span>
        </div>
        {tag && <span className="tech-tag">{tag}</span>}
      </div>
      {/* Divider */}
      <div className="tech-divider mb-3" />
      {children}
    </div>
  );
}

/* ── Tech Input ── */
function TechInput({
  prefix,
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  prefix?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {prefix && (
        <span
          className="font-orbitron font-black w-6 text-center shrink-0"
          style={{ color: "var(--orange)", fontSize: "14px" }}
        >
          {prefix}
        </span>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="tech-input flex-1 px-3 py-2 text-sm"
      />
    </div>
  );
}

/* ── Main Component ── */
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
    <div className="p-4 space-y-4">

      {/* ── 01: 头像上传 ── */}
      <SectionCard icon={<User size={14} />} title="HEAD SHOT" tag="01">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {data.photoUrl ? (
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div
              className="relative shrink-0 rounded overflow-hidden"
              style={{
                width: 52, height: 52,
                border: "1px solid oklch(0.68 0.20 35 / 0.50)",
                boxShadow: "0 0 8px oklch(0.68 0.20 35 / 0.25)",
              }}
            >
              <img src={data.photoUrl} alt="preview" className="w-full h-full object-cover" />
              {/* Orange corner */}
              <div className="absolute top-0 right-0 w-2 h-2" style={{ background: "var(--orange)", clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                图片已载入 · 可在左侧拖拽调整位置
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  border: "1px solid oklch(0.68 0.20 35 / 0.40)",
                  color: "var(--orange)",
                  background: "oklch(0.68 0.20 35 / 0.08)",
                }}
              >
                <Upload size={12} />
                重新上传
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded transition-all"
            style={{
              border: "2px dashed oklch(0.68 0.20 35 / 0.30)",
              background: "oklch(0.68 0.20 35 / 0.04)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.68 0.20 35 / 0.70)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--orange)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.68 0.20 35 / 0.30)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
          >
            <ImageIcon size={24} style={{ opacity: 0.6 }} />
            <span className="text-sm">点击上传头像图片</span>
            <span className="font-orbitron text-xs" style={{ opacity: 0.5, fontSize: "10px" }}>
              JPG / PNG / WEBP
            </span>
          </button>
        )}
      </SectionCard>

      {/* ── 02: 图片调整（仅上传后显示） ── */}
      {data.photoUrl && (
        <SectionCard icon={<Zap size={14} />} title="IMAGE ADJUST" tag="02">
          <div className="space-y-3">
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
              className="flex items-center gap-1.5 text-xs mt-1 transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--orange)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"}
            >
              <RotateCcw size={11} />
              <span className="font-orbitron" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>RESET DEFAULT</span>
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── 03: 个人信息 ── */}
      <SectionCard icon={<MapPin size={14} />} title="IDENTITY" tag="03">
        <div className="space-y-2.5">
          <TechInput
            prefix="@"
            placeholder="你的称呼"
            value={data.name}
            onChange={(v) => onChange({ name: v })}
            maxLength={20}
          />
          <TechInput
            prefix="#"
            placeholder="你的家乡"
            value={data.hometown}
            onChange={(v) => onChange({ hometown: v })}
            maxLength={20}
          />
        </div>
      </SectionCard>

      {/* ── 04: 三个问题 ── */}
      <SectionCard icon={<HelpCircle size={14} />} title="YOUR STORY" tag="04">
        <div className="space-y-3">
          {/* Q1 */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="font-orbitron text-xs px-1.5 py-0.5 rounded"
                style={{ background: "oklch(0.68 0.20 35 / 0.15)", color: "var(--orange)", fontSize: "9px" }}
              >
                Q1
              </div>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                你做过最酷的事情是什么？
              </span>
            </div>
            <input
              type="text"
              placeholder="最酷的事"
              value={data.coolest}
              onChange={(e) => onChange({ coolest: e.target.value })}
              maxLength={30}
              className="tech-input w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Q2 */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="font-orbitron text-xs px-1.5 py-0.5 rounded"
                style={{ background: "oklch(0.68 0.20 35 / 0.15)", color: "var(--orange)", fontSize: "9px" }}
              >
                Q2
              </div>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                黑客松什么地方吸引你？
              </span>
            </div>
            <input
              type="text"
              placeholder="吸引你的地方"
              value={data.reason}
              onChange={(e) => onChange({ reason: e.target.value })}
              maxLength={30}
              className="tech-input w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Q3 */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="font-orbitron text-xs px-1.5 py-0.5 rounded"
                style={{ background: "oklch(0.68 0.20 35 / 0.15)", color: "var(--orange)", fontSize: "9px" }}
              >
                Q3
              </div>
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                <Trophy size={11} style={{ color: "var(--orange)" }} />
                黑客松给你带来哪些收获？
              </span>
            </div>
            <input
              type="text"
              placeholder="收获"
              value={data.harvest}
              onChange={(e) => onChange({ harvest: e.target.value })}
              maxLength={30}
              className="tech-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>
      </SectionCard>

    </div>
  );
}
