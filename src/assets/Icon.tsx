// 데일리오픽 전용 아이콘 세트(이모지 대체). 32×32 격자, 통통한 면 + 밝은 하이라이트.
import type { ReactElement } from "react";

const P = "#4B24FF"; // 주색
const PD = "#3417C7"; // 주색 그림자
const PL = "#8B70FF"; // 주색 밝은 면
const SOFT = "#EDE9FF";
const GOLD = "#F5A524";
const GOLDD = "#D38700";
const ORANGE = "#FF7A1A";
const YEL = "#FFD43B";
const GREEN = "#10B981";
const GREEND = "#059669";
const RED = "#EF4444";
const INK = "#1F1D3A";
const W = "#FFFFFF";
const HL = "rgba(255,255,255,.45)";

const icons: Record<string, ReactElement> = {
  mic: (
    <>
      <rect x="10.5" y="2.5" width="11" height="17" rx="5.5" fill={P} />
      <rect x="12.5" y="4.5" width="3" height="8" rx="1.5" fill={HL} />
      <path d="M7.5 15a8.5 8.5 0 0 0 17 0" fill="none" stroke={PD} strokeWidth="3" strokeLinecap="round" />
      <path d="M16 24v4M11 28.5h10" stroke={PD} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  flame: (
    <>
      <path d="M16 2.5c1 4.5 8.5 8 8.5 16.5a8.5 8.5 0 0 1-17 0c0-4 2-6.5 3.5-8 .3 2.5 1.6 4 3 4.2C13 11 14.5 6.5 16 2.5z" fill={ORANGE} />
      <path d="M16 15c.6 2.4 4.3 4 4.3 7.6a4.3 4.3 0 0 1-8.6 0c0-2.4 2-4.8 4.3-7.6z" fill={YEL} />
    </>
  ),
  bolt: (
    <>
      <path d="M18.5 2.5 6.5 18h8l-2 11.5L25.5 13h-8.5z" fill={GOLD} stroke={GOLDD} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 6.5 10.5 15h3" fill="none" stroke={HL} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  coin: (
    <>
      <circle cx="16" cy="16.5" r="12.5" fill={GOLDD} />
      <circle cx="16" cy="15.5" r="12.5" fill={GOLD} />
      <circle cx="16" cy="15.5" r="8.5" fill="none" stroke={GOLDD} strokeWidth="1.5" />
      <rect x="13.5" y="9.5" width="5" height="8" rx="2.5" fill={W} />
      <path d="M11.5 15.5a4.5 4.5 0 0 0 9 0M16 20v2" fill="none" stroke={W} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  book: (
    <>
      <path d="M5 6.5c3.5-1.6 7.5-1.6 11 .8v20c-3.5-2.4-7.5-2.4-11-.8z" fill={GREEN} />
      <path d="M27 6.5c-3.5-1.6-7.5-1.6-11 .8v20c3.5-2.4 7.5-2.4 11-.8z" fill={GREEND} />
      <path d="M8 10.5c2-.6 4-.5 5.5.3M8 14.5c2-.6 4-.5 5.5.3" stroke={HL} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="5" width="20" height="24" rx="4" fill={P} />
      <rect x="11" y="2.5" width="10" height="6" rx="2.5" fill={PD} />
      <path d="M10.5 15l3 3 7-7" fill="none" stroke={W} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 23.5h11" stroke={HL} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  gem: (
    <>
      <path d="M9 4.5h14l6 7.5-13 16.5L3 12z" fill="#38BDF8" />
      <path d="M3 12h26L16 28.5z" fill="#0EA5E9" />
      <path d="M9 4.5 13 12h6l4-7.5" fill="none" stroke={HL} strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  sliders: (
    <>
      <path d="M5 9h22M5 16h22M5 23h22" stroke="#C9C4DC" strokeWidth="3" strokeLinecap="round" />
      <circle cx="11" cy="9" r="3.5" fill={P} />
      <circle cx="21" cy="16" r="3.5" fill={GOLD} />
      <circle cx="14" cy="23" r="3.5" fill={GREEN} />
    </>
  ),
  soundOn: (
    <>
      <path d="M4 12.5h5l7-6v19l-7-6H4z" fill={P} />
      <path d="M20.5 11a6.5 6.5 0 0 1 0 10M23.5 7.5a11 11 0 0 1 0 17" fill="none" stroke={PL} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 12.5h5l7-6v19l-7-6H4z" fill="#A09CB8" />
      <path d="M20.5 12.5l7 7M27.5 12.5l-7 7" stroke={RED} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  door: (
    <>
      <rect x="5" y="3.5" width="15" height="25" rx="3" fill="#A09CB8" />
      <circle cx="16" cy="16.5" r="1.6" fill={W} />
      <path d="M19.5 16.5h9M24.5 12l4 4.5-4 4.5" fill="none" stroke={P} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chat: (
    <>
      <path d="M6 5h20a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14l-6 5v-5H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" fill={P} />
      <circle cx="11" cy="14" r="1.8" fill={W} />
      <circle cx="16" cy="14" r="1.8" fill={W} />
      <circle cx="21" cy="14" r="1.8" fill={W} />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="5" width="23" height="23" rx="6" fill={PD} />
      <rect x="4" y="3.5" width="23" height="23" rx="6" fill={P} />
      <circle cx="10.5" cy="10" r="2" fill={W} />
      <circle cx="15.5" cy="15" r="2" fill={W} />
      <circle cx="20.5" cy="20" r="2" fill={W} />
    </>
  ),
  phone: (
    <>
      <path d="M9.5 3.5c1.4 0 2.2.7 2.8 2l1.6 4c.4 1-.1 2.2-1 2.7l-1.6.9c1.2 2.9 3.6 5.4 6.6 6.6l.9-1.6c.6-1 1.7-1.4 2.7-1l4 1.6c1.3.6 2 1.4 2 2.8v2.4c0 1.6-1.3 2.8-2.9 2.6C13.9 27 5 18.1 4 7.4 3.9 5.8 5.1 4.5 6.7 4.5z" fill={GREEN} />
      <path d="M8 8.5c.5 3 1.6 5.6 3.2 7.8" fill="none" stroke={HL} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  compare: (
    <>
      <rect x="4" y="12" width="9" height="16" rx="3" fill={PL} />
      <rect x="19" y="5" width="9" height="23" rx="3" fill={P} />
      <path d="M14.5 9.5h4M17 7l2 2.5-2 2.5" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  rocket: (
    <>
      <path d="M16 2.5c5 3 7.5 8.5 6.5 16l-3 3h-7l-3-3c-1-7.5 1.5-13 6.5-16z" fill={P} />
      <circle cx="16" cy="12" r="3" fill={W} />
      <path d="M9.5 18.5 5.5 22l1 4 5-2M22.5 18.5l4 3.5-1 4-5-2" fill={PD} />
      <path d="M13.5 23.5 16 29.5l2.5-6" fill={ORANGE} />
    </>
  ),
  target: (
    <>
      <circle cx="16" cy="16" r="12.5" fill={RED} />
      <circle cx="16" cy="16" r="8.5" fill={W} />
      <circle cx="16" cy="16" r="4.5" fill={RED} />
      <path d="M16 16 26 6M22.5 5.5 26 6l.5 3.5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  check: <path d="M7 16.5l6 6L25.5 9.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />,
  close: <path d="M8 8l16 16M24 8 8 24" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />,
  back: <path d="M20 6 10 16l10 10" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />,
  menu: <path d="M6 9h20M6 16h20M6 23h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  lock: (
    <>
      <path d="M10 14v-3.5a6 6 0 0 1 12 0V14" fill="none" stroke="#A09CB8" strokeWidth="3" />
      <rect x="6.5" y="13" width="19" height="15" rx="4" fill="#C9C4DC" />
      <circle cx="16" cy="19.5" r="2.2" fill="#8C88A6" />
      <path d="M16 21v3" stroke="#8C88A6" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  trophy: (
    <>
      <path d="M9 4h14v7a7 7 0 0 1-14 0z" fill={GOLD} />
      <path d="M9 7H4.5a4.5 4.5 0 0 0 4.8 5M23 7h4.5a4.5 4.5 0 0 1-4.8 5" fill="none" stroke={GOLDD} strokeWidth="2.4" />
      <path d="M14 17.5h4v4h-4z" fill={GOLDD} />
      <rect x="9.5" y="21.5" width="13" height="6" rx="2" fill={GOLDD} />
      <path d="M12 6.5v4" stroke={HL} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  star: (
    <path
      d="M16 3l3.8 8 8.7 1-6.4 6 1.7 8.7L16 22.4l-7.8 4.3 1.7-8.7-6.4-6 8.7-1z"
      fill={GOLD}
      stroke={GOLDD}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  speaker: (
    <>
      <path d="M4 12.5h5l7-6v19l-7-6H4z" fill={W} />
      <path d="M20.5 11a6.5 6.5 0 0 1 0 10M23.5 7.5a11 11 0 0 1 0 17" fill="none" stroke={W} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  refresh: (
    <path
      d="M25 12a9.5 9.5 0 1 0 .5 7M25.5 5v7h-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  keyboard: (
    <>
      <rect x="2.5" y="8" width="27" height="17" rx="4" fill={P} />
      {[6.5, 11, 15.5, 20, 24.5].map((x) => (
        <rect key={x} x={x - 1.6} y="11.5" width="3.2" height="3.2" rx="1" fill={W} />
      ))}
      {[8.5, 13, 17.5, 22].map((x) => (
        <rect key={x} x={x - 1.6} y="16" width="3.2" height="3.2" rx="1" fill={SOFT} />
      ))}
      <rect x="10" y="20.5" width="12" height="2.4" rx="1.2" fill={W} />
    </>
  ),
  headphones: (
    <>
      <path d="M5 19v-3a11 11 0 0 1 22 0v3" fill="none" stroke={PD} strokeWidth="3" />
      <rect x="3.5" y="17" width="7" height="11" rx="3.5" fill={P} />
      <rect x="21.5" y="17" width="7" height="11" rx="3.5" fill={P} />
      <path d="M5.5 20v5" stroke={HL} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  shuffle: (
    <path
      d="M4 9h5c5 0 9 14 14 14h4M4 23h5c2 0 3.6-2 5-4.5M17.5 13.5C19 11 20.8 9 23 9h4M23.5 5.5 27 9l-3.5 3.5M23.5 19.5 27 23l-3.5 3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  sparkle: (
    <>
      <path d="M14 3c.9 5.4 3.6 8.1 9 9-5.4.9-8.1 3.6-9 9-.9-5.4-3.6-8.1-9-9 5.4-.9 8.1-3.6 9-9z" fill={GOLD} />
      <path d="M24.5 18.5c.5 2.6 1.9 4 4.5 4.5-2.6.5-4 1.9-4.5 4.5-.5-2.6-1.9-4-4.5-4.5 2.6-.5 4-1.9 4.5-4.5z" fill={PL} />
    </>
  ),
  heart: (
    <>
      <path d="M16 27.5S3.5 20 3.5 11.5A6.5 6.5 0 0 1 16 8.4a6.5 6.5 0 0 1 12.5 3.1C28.5 20 16 27.5 16 27.5z" fill={RED} />
      <path d="M8 10.5c.5-1.5 1.7-2.4 3.2-2.5" fill="none" stroke={HL} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  heartEmpty: (
    <path
      d="M16 27.5S3.5 20 3.5 11.5A6.5 6.5 0 0 1 16 8.4a6.5 6.5 0 0 1 12.5 3.1C28.5 20 16 27.5 16 27.5z"
      fill="#E8E5F2"
      stroke="#C9C4DC"
      strokeWidth="1.6"
    />
  ),
  timer: (
    <>
      <circle cx="16" cy="18" r="11" fill={W} stroke={P} strokeWidth="3" />
      <path d="M16 18V11.5M16 18l4 2.5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13 3h6" stroke={P} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  chest: (
    <>
      <path d="M4 13a7 7 0 0 1 7-7h10a7 7 0 0 1 7 7v2H4z" fill={GOLD} />
      <rect x="4" y="15" width="24" height="12" rx="3" fill={GOLDD} />
      <rect x="13.5" y="12.5" width="5" height="7" rx="1.5" fill={P} />
      <path d="M8 9.5c1-1 2.4-1.6 4-1.6" stroke={HL} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  hand: (
    <>
      <path
        d="M10 17V7.5a2 2 0 0 1 4 0V15m0-9a2 2 0 0 1 4 0v9m0-7.5a2 2 0 0 1 4 0V17c0 6.5-3 11-8.5 11C9 28 6 24 5 20.5l-.8-3a2 2 0 0 1 3.8-1.2L10 21"
        fill={GOLD}
        stroke={GOLDD}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </>
  ),
  pencil: (
    <>
      <path d="M6 22.5 21 7.5l3.5 3.5-15 15H6z" fill={GOLD} />
      <path d="M21 7.5l2-2a2.5 2.5 0 0 1 3.5 3.5l-2 2z" fill={RED} />
      <path d="M6 22.5V26h3.5z" fill={INK} />
    </>
  ),
  thumb: (
    <path
      d="M10 14.5 15 4a3 3 0 0 1 3 3.5L17 12h7.5a3 3 0 0 1 2.9 3.7l-2.4 9.6A3 3 0 0 1 22 27.5H10zM4 14.5h4v13H4z"
      fill={GREEN}
      strokeLinejoin="round"
    />
  ),
};

export type IconName = keyof typeof icons;
export const ICON_NAMES = Object.keys(icons) as IconName[];

export function Icon({ name, size = 24, className, title }: { name: IconName; size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className ? `ico ${className}` : "ico"}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {icons[name]}
    </svg>
  );
}
