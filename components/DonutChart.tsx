"use client";

type Segment = {
  color: string;
  pct: number;
};

type Props = {
  segments: Segment[];
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
};

export function DonutChart({
  segments,
  size = 180,
  thickness = 28,
  label,
  sublabel,
}: Props) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const gap = 3; // gap between segments in px

  // Filter out zero segments
  const active = segments.filter(s => s.pct > 0);

  // Build arc paths
  let offset = -90; // start at top
  const arcs = active.map(seg => {
    const sweep = (seg.pct / 100) * 360;
    const dashLen = (seg.pct / 100) * circumference - gap;
    const startAngle = offset;
    offset += sweep;
    return { ...seg, dashLen, startAngle };
  });

  // Convert polar to cartesian for a single arc path
  function polarToCartesian(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function arcPath(startAngle: number, sweepAngle: number, radius: number) {
    const start = polarToCartesian(startAngle, radius);
    const end   = polarToCartesian(startAngle + sweepAngle, radius);
    const large = sweepAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  const isEmpty = active.length === 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(168,85,247,0.08)"
          strokeWidth={thickness}
        />

        {isEmpty ? (
          /* Empty state ring */
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(168,85,247,0.15)"
            strokeWidth={thickness}
            strokeDasharray={`${circumference * 0.6} ${circumference * 0.4}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
        ) : (
          arcs.map((arc, i) => {
            const sweepAngle = (arc.pct / 100) * 360;
            return (
              <path
                key={i}
                d={arcPath(arc.startAngle, sweepAngle - (gap / circumference) * 360, r)}
                fill="none"
                stroke={arc.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${arc.color}60)` }}
              />
            );
          })
        )}

        {/* Inner glow circle */}
        <circle
          cx={cx} cy={cy} r={r - thickness / 2 - 8}
          fill="rgba(0,0,0,0.4)"
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && (
          <span className="font-display text-lg font-bold text-textPrimary leading-tight">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-xs font-semibold uppercase tracking-widest mt-0.5"
            style={{ color: "rgba(192,132,252,0.5)" }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
