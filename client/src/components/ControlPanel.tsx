import { useRef, useCallback } from "react";
import { Upload, RotateCcw, User, MapPin, Zap, HelpCircle, Trophy, ImageIcon } from "lucide-react";
import type { PosterData } from "./PosterCanvas";

interface Props {
  data: PosterData;
  onChange: (patch: Partial<PosterData>) => void;
}

/* ── Slider row ── */
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
        className="text-xs w-8 shrink-0 font-mono"
        style={{ color: "oklch(0.55 0.010 255)" }}
      >
        {label}
      </span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div
          className="absolute inset-x-0 h-px rounded-full"
          style={{ background: "oklch(0.22 0.010 255)" }}
        />
        {/* Active track */}
        <div
          className="absolute left-0 h-px rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, oklch(0.55 0.18 40), oklch(0.70 0.22 44))",
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
      <span
        className="text-xs w-14 text-right shrink-0 font-mono tabular-nums"
        style={{ color: "oklch(0.65 0.22 40)" }}
      >
        {displayVal}
      </span>
    </div>
  );
}

/* ── Section card ── */
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
      className="relative rounded-lg p-4 space-y-3"
      style={{
        background: "oklch(0.10 0.010 255 / 0.95)",
        border: "1px solid oklch(0.20 0.010 255)",
      }}
    >
      {/* Corner accents */}
      <span
        className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
        style={{
          borderTop: "1.5px solid oklch(0.65 0.22 40 / 0.7)",
          borderLeft: "1.5px solid oklch(0.65 0.22 40 / 0.7)",
        }}
      />
      <span
        className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none"
        style={{
          borderBottom: "1.5px solid oklch(0.65 0.22 40 / 0.4)",
          borderRight: "1.5px solid oklch(0.65 0.22 40 / 0.4)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: "oklch(0.65 0.22 40)" }}>{icon}</span>
          <span
            className="text-sm font-bold tracking-wide"
            style={{ color: "oklch(0.88 0.005 80)" }}
          >
            {title}
          </span>
        </div>
        {tag && (
          <span
            className="text-xs px-2 py-0.5 rounded font-mono"
            style={{
              background: "oklch(0.65 0.22 40 / 0.10)",
              border: "1px solid oklch(0.65 0.22 40 / 0.30)",
              color: "oklch(0.65 0.22 40)",
              letterSpacing: "0.08em",
            }}
          >
            {tag}
          </span>
        )}
      </div>

      {/* Divider */}
      <div
        className="h-px"
        style={{
          background: "linear-gradient(90deg, oklch(0.65 0.22 40 / 0.4), transparent)",
        }}
      />

      {children}
    </div>
  );
}

/* ── Text input ── */
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
          className="text-sm font-black w-6 shrink-0 text-center font-mono"
          style={{ color: "oklch(0.65 0.22 40)" }}
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
        className="tech-input flex-1 text-sm"
        style={{ borderRadius: "4px" }}
      />
    </div>
  );
}

/* ── Question input ── */
function QuestionInput({
  index,
  question,
  placeholder,
  value,
  onChange,
}: {
  index: number;
  question: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-mono w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{
            background: "oklch(0.65 0.22 40 / 0.15)",
            border: "1px solid oklch(0.65 0.22 40 / 0.4)",
            color: "oklch(0.65 0.22 40)",
          }}
        >
          {index}
        </span>
        <label
          className="text-xs"
          style={{ color: "oklch(0.55 0.010 255)" }}
        >
          {question}
        </label>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={30}
        className="tech-input w-full text-sm"
        style={{ borderRadius: "4px" }}
      />
    </div>
  );
}

/* ── Main component ── */
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
    <div className="space-y-3">

      {/* ── 头像上传 ── */}
      <SectionCard icon={<User size={14} />} title="头像图片" tag="IMG">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded text-sm transition-all duration-200"
          style={{
            background: "oklch(0.09 0.008 255)",
            border: "1.5px dashed oklch(0.30 0.010 255)",
            color: "oklch(0.50 0.010 255)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.65 0.22 40 / 0.6)";
            (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.65 0.22 40)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.30 0.010 255)";
            (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.50 0.010 255)";
          }}
        >
          <Upload size={15} />
          {data.photoUrl ? "重新上传图片" : "点击上传头像图片"}
        </button>

        {data.photoUrl && (
          <div
            className="flex items-center gap-3 p-2 rounded"
            style={{
              background: "oklch(0.65 0.22 40 / 0.06)",
              border: "1px solid oklch(0.65 0.22 40 / 0.2)",
            }}
          >
            <img
              src={data.photoUrl}
              alt="preview"
              className="w-10 h-10 rounded object-cover shrink-0"
              style={{ border: "1px solid oklch(0.65 0.22 40 / 0.4)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: "oklch(0.65 0.22 40)" }}>
                图片已上传
              </p>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.42 0.008 255)" }}>
                可在左侧拖拽调整位置
              </p>
            </div>
            <ImageIcon size={14} style={{ color: "oklch(0.55 0.18 40 / 0.6)", flexShrink: 0 }} />
          </div>
        )}
      </SectionCard>

      {/* ── 图片调整（仅上传后显示） ── */}
      {data.photoUrl && (
        <SectionCard icon={<Zap size={14} />} title="图片调整" tag="ADJUST">
          <div className="space-y-2.5">
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
          </div>
          <button
            onClick={handleResetImage}
            className="flex items-center gap-1.5 text-xs transition-colors mt-1"
            style={{ color: "oklch(0.42 0.008 255)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.65 0.22 40)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.42 0.008 255)";
            }}
          >
            <RotateCcw size={11} />
            恢复默认
          </button>
        </SectionCard>
      )}

      {/* ── 个人信息 ── */}
      <SectionCard icon={<MapPin size={14} />} title="个人信息" tag="INFO">
        <div className="space-y-2">
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

      {/* ── 三个问题 ── */}
      <SectionCard icon={<HelpCircle size={14} />} title="关于你的故事" tag="STORY">
        <div className="space-y-3">
          <QuestionInput
            index={1}
            question="你做过最酷的事情是什么？"
            placeholder="最酷的事"
            value={data.coolest}
            onChange={(v) => onChange({ coolest: v })}
          />
          <QuestionInput
            index={2}
            question="你为什么报名参加黑客松？"
            placeholder="报名原因"
            value={data.reason}
            onChange={(v) => onChange({ reason: v })}
          />
          <QuestionInput
            index={3}
            question="黑客松给你带来哪些收获？"
            placeholder="收获"
            value={data.harvest}
            onChange={(v) => onChange({ harvest: v })}
          />
        </div>
        <div
          className="flex items-center gap-1.5 text-xs mt-1"
          style={{ color: "oklch(0.38 0.008 255)" }}
        >
          <Trophy size={10} style={{ color: "oklch(0.55 0.18 40 / 0.6)" }} />
          每项最多 30 字
        </div>
      </SectionCard>
    </div>
  );
}
