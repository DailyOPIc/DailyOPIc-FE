// 데일리오픽 마스코트: 로고의 마이크를 닮은 캐릭터. 표정(mood)으로 상황을 말한다.
export type Mood = "idle" | "happy" | "cheer" | "think" | "sad" | "listen" | "sleep";

const P = "#4B24FF";
const PD = "#3417C7";
const PL = "#7C5CFF";
const INK = "#1F1D3A";
const CHEEK = "#FF8FB1";

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy")
    return (
      <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
        <path d="M44 66q6-8 12 0" />
        <path d="M64 66q6-8 12 0" />
      </g>
    );
  if (mood === "listen" || mood === "sleep")
    return (
      <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
        <path d="M44 64q6 6 12 0" />
        <path d="M64 64q6 6 12 0" />
      </g>
    );
  if (mood === "sad")
    return (
      <g className="m-eyes">
        <path d="M43 62q7-4 13 1v6q-6 4-13 0z" fill={INK} />
        <path d="M77 62q-7-4-13 1v6q6 4 13 0z" fill={INK} />
      </g>
    );
  const dx = mood === "think" ? 3 : 0;
  const dy = mood === "think" ? -3 : 0;
  return (
    <g className="m-eyes">
      <ellipse cx="50" cy="64" rx="6.5" ry={mood === "cheer" ? 8.5 : 7.5} fill={INK} />
      <ellipse cx="70" cy="64" rx="6.5" ry={mood === "cheer" ? 8.5 : 7.5} fill={INK} />
      <circle cx={52 + dx} cy={61 + dy} r="2.4" fill="#fff" />
      <circle cx={72 + dx} cy={61 + dy} r="2.4" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case "happy":
    case "cheer":
      return (
        <g>
          <path d="M50 76q10 13 20 0z" fill={INK} />
          <path d="M55 82q5-3 10 0q-5 3-10 0z" fill="#FF6B8B" />
        </g>
      );
    case "sad":
      return <path d="M52 82q8-7 16 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
    case "think":
      return <path d="M56 80h10" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
    case "sleep":
      return <ellipse cx="60" cy="80" rx="3.5" ry="3" fill={INK} />;
    default:
      return <path d="M52 77q8 7 16 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
  }
}

function Arms({ mood }: { mood: Mood }) {
  const s = { fill: "none", stroke: PD, strokeWidth: 7, strokeLinecap: "round" as const };
  if (mood === "happy")
    return (
      <g>
        <path d="M28 64 14 44" {...s} />
        <path d="M92 64l14-20" {...s} />
      </g>
    );
  if (mood === "cheer")
    return (
      <g>
        <path d="M28 68 16 80" {...s} />
        <path className="m-wave" d="M92 64l16-18" {...s} />
      </g>
    );
  if (mood === "think")
    return (
      <g>
        <path d="M28 68 16 80" {...s} />
        <path d="M92 70q2 14-18 16" {...s} />
      </g>
    );
  return (
    <g>
      <path d="M28 68 17 82" {...s} />
      <path d="M92 68l11 14" {...s} />
    </g>
  );
}

export function Mascot({ mood = "idle", size = 120, className }: { mood?: Mood; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 150"
      width={size}
      height={(size * 150) / 120}
      className={`mascot mood-${mood}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <ellipse className="m-shadow" cx="60" cy="144" rx="30" ry="5" fill="rgba(31,29,58,.12)" />
      <g className="m-body">
        {/* 받침 */}
        <path d="M60 104v30" stroke={PD} strokeWidth="9" strokeLinecap="round" />
        <path d="M40 136h40" stroke={PD} strokeWidth="9" strokeLinecap="round" />
        <path d="M28 70a32 32 0 0 0 64 0" fill="none" stroke={PD} strokeWidth="8" strokeLinecap="round" />
        <Arms mood={mood} />
        {/* 몸통(마이크 머리) */}
        <rect x="30" y="8" width="60" height="92" rx="30" fill={P} />
        <path d="M30 38a30 30 0 0 1 60 0v6H30z" fill={PL} />
        <g fill={P} opacity=".55">
          {[42, 52, 62, 72].map((x) => (
            <circle key={x} cx={x + 3} cy="30" r="2.3" />
          ))}
          {[47, 57, 67].map((x) => (
            <circle key={x} cx={x + 3} cy="22" r="2.3" />
          ))}
        </g>
        <rect x="30" y="43" width="60" height="4" fill={PD} opacity=".5" />
        <rect x="38" y="14" width="7" height="20" rx="3.5" fill="#fff" opacity=".35" />
        <ellipse cx="42" cy="76" rx="5" ry="3" fill={CHEEK} opacity=".7" />
        <ellipse cx="78" cy="76" rx="5" ry="3" fill={CHEEK} opacity=".7" />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </g>
      {mood === "think" && (
        <g fill={PL}>
          <circle cx="100" cy="20" r="4" className="m-dot" />
          <circle cx="110" cy="10" r="3" className="m-dot d2" />
        </g>
      )}
      {mood === "sad" && <path d="M92 40q4 6 0 10q-4-4 0-10z" fill="#7DD3FC" className="m-sweat" />}
      {mood === "listen" && (
        <g fill="none" stroke={PL} strokeWidth="4" strokeLinecap="round" className="m-waves">
          <path d="M100 46q6 8 0 16" />
          <path d="M108 40q10 14 0 28" />
          <path d="M20 46q-6 8 0 16" />
          <path d="M12 40q-10 14 0 28" />
        </g>
      )}
      {mood === "sleep" && (
        <g fill={PL} fontWeight="900" fontFamily="system-ui" className="m-z">
          <text x="92" y="22" fontSize="16">
            z
          </text>
          <text x="102" y="10" fontSize="12">
            z
          </text>
        </g>
      )}
      {mood === "happy" && (
        <g fill="#F5A524" className="m-spark">
          <path d="M14 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M104 16l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
        </g>
      )}
    </svg>
  );
}
