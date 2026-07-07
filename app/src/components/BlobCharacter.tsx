interface BlobCharacterProps {
  color: "orange" | "green" | "blue" | "yellow" | "pink" | "purple";
  size?: number;
  className?: string;
  delay?: number;
  expression?: "happy" | "surprised" | "wink" | "neutral";
}

const colorMap = {
  orange: { fill: "#ff3e00", stroke: "#cc3200" },
  green: { fill: "#00ca48", stroke: "#00a23a" },
  blue: { fill: "#0090ff", stroke: "#0073cc" },
  yellow: { fill: "#ffbb26", stroke: "#d48f00" },
  pink: { fill: "#ff58ae", stroke: "#cc468b" },
  purple: { fill: "#9f4fff", stroke: "#7f3fcc" },
};

export default function BlobCharacter({
  color,
  size = 80,
  className = "",
  delay = 0,
  expression = "happy",
}: BlobCharacterProps) {
  const colors = colorMap[color];
  const delayClass = delay > 0 ? `blob-character-delay-${delay}` : "";

  const eyes = {
    happy: (
      <>
        <ellipse cx="35" cy="42" rx="5" ry="6" fill="white" />
        <circle cx="35" cy="42" r="2.5" fill={colors.stroke} />
        <ellipse cx="65" cy="42" rx="5" ry="6" fill="white" />
        <circle cx="65" cy="42" r="2.5" fill={colors.stroke} />
        <path d="M 38 52 Q 50 58 62 52" stroke={colors.stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
    surprised: (
      <>
        <ellipse cx="35" cy="42" rx="6" ry="7" fill="white" />
        <circle cx="35" cy="42" r="3" fill={colors.stroke} />
        <ellipse cx="65" cy="42" rx="6" ry="7" fill="white" />
        <circle cx="65" cy="42" r="3" fill={colors.stroke} />
        <ellipse cx="50" cy="56" rx="5" ry="6" fill={colors.stroke} />
      </>
    ),
    wink: (
      <>
        <path d="M 29 42 Q 35 38 41 42" stroke={colors.stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="65" cy="42" rx="5" ry="6" fill="white" />
        <circle cx="65" cy="42" r="2.5" fill={colors.stroke} />
        <path d="M 38 52 Q 50 58 62 52" stroke={colors.stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
    neutral: (
      <>
        <ellipse cx="35" cy="42" rx="5" ry="6" fill="white" />
        <circle cx="35" cy="42" r="2.5" fill={colors.stroke} />
        <ellipse cx="65" cy="42" rx="5" ry="6" fill="white" />
        <circle cx="65" cy="42" r="2.5" fill={colors.stroke} />
        <line x1="38" y1="55" x2="62" y2="55" stroke={colors.stroke} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`blob-character ${delayClass} ${className}`}
      style={{ transformOrigin: "center" }}
    >
      {/* Blob body - organic shape */}
      <path
        d="M 50 8 C 70 5, 88 18, 90 38 C 93 55, 88 72, 78 82 C 68 92, 52 95, 38 90 C 22 85, 10 72, 8 55 C 5 38, 12 20, 28 12 C 35 9, 42 8, 50 8 Z"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="1.5"
      />
      {/* Face */}
      {eyes[expression]}
      {/* Stick legs */}
      <line x1="38" y1="88" x2="35" y2="98" stroke={colors.stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="88" x2="65" y2="98" stroke={colors.stroke} strokeWidth="2" strokeLinecap="round" />
      {/* Little feet */}
      <ellipse cx="33" cy="99" rx="4" ry="2" fill={colors.stroke} />
      <ellipse cx="67" cy="99" rx="4" ry="2" fill={colors.stroke} />
    </svg>
  );
}
