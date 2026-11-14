// 개발 전용(운영 빌드 제외): 직접 만든 아이콘 · 마스코트 · 효과음 검토 화면. /dev/assets
import { ICON_NAMES, Icon } from "../assets/Icon";
import { Mascot, type Mood } from "../assets/Mascot";
import { play, type Sfx } from "../lib/sfx";
import "./app.css";

const MOODS: Mood[] = ["idle", "happy", "cheer", "think", "sad", "listen", "sleep"];
const SOUNDS: Sfx[] = ["tap", "select", "correct", "wrong", "coin", "combo", "fanfare", "streak", "rec_start", "rec_stop", "key", "lose", "start"];

export function DevAssets() {
  return (
    <div className="dev-assets">
      <h1>데일리오픽 에셋</h1>
      <h2>마스코트</h2>
      <div className="dev-row">
        {MOODS.map((m) => (
          <figure key={m}>
            <Mascot mood={m} size={110} />
            <figcaption>{m}</figcaption>
          </figure>
        ))}
      </div>
      <h2>아이콘 ({ICON_NAMES.length})</h2>
      <div className="dev-grid">
        {ICON_NAMES.map((n) => (
          <figure key={n}>
            <Icon name={n} size={44} />
            <figcaption>{n}</figcaption>
          </figure>
        ))}
      </div>
      <h2>효과음</h2>
      <div className="dev-row">
        {SOUNDS.map((s) => (
          <button key={s} className="btn btn-secondary" onClick={() => play(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
