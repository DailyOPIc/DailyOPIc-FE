import { useEffect, useState } from "react";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { api, type ActivityDay, type ApiError, type Profile } from "../lib/api";
import { heatmapDays, kstDay } from "../lib/game";
import { play } from "../lib/sfx";

const WEEKS = 17; // 320px 폭에서도 한 줄에 들어가는 주 수
const WEEKDAY = ["월", "화", "수", "목", "금", "토", "일"];
// 날짜별 요약에 보여 줄 활동(서버 activityDays.counts 의 키)
const KIND_LABEL: [string, string, string][] = [
  ["step", "학습 단계", "mic"],
  ["chest", "보물상자", "chest"],
  ["game", "오픽게임", "keyboard"],
  ["mock", "모의고사", "clipboard"],
];

const key = (day: string) => day.replaceAll("-", "");
const level = (n = 0) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4);

/** 마이: 닉네임 · 레벨 · 스트릭(듀오링고식) · 날짜별 활동 요약. 서버 기록이라 기기를 바꿔도 이어진다. */
export function MyPage({ onChanged, dev }: { onChanged: () => void; dev?: { profile: Profile; days: ActivityDay[] } }) {
  const [profile, setProfile] = useState<Profile | null>(dev?.profile ?? null);
  const [days, setDays] = useState<Record<string, ActivityDay>>(() => Object.fromEntries((dev?.days ?? []).map((d) => [d.date, d])));
  const [selected, setSelected] = useState(kstDay());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dev) return;
    api.profile().then(setProfile).catch(() => {});
    api
      .activity(WEEKS * 7)
      .then((r) => setDays(Object.fromEntries(r.days.map((d) => [d.date, d]))))
      .catch(() => {});
  }, [dev]);

  const saveNickname = async () => {
    setSaving(true);
    setError(null);
    try {
      setProfile(await api.setNickname(draft.trim()));
      setEditing(false);
      play("correct");
      onChanged();
    } catch (e) {
      setError((e as ApiError).message);
      play("wrong", { volume: 0.5 });
    } finally {
      setSaving(false);
    }
  };

  const today = kstDay();
  const grid = heatmapDays(today, WEEKS);
  const thisWeek = grid.slice(-7);
  const activeDays = Object.values(days).filter((d) => d.total > 0).length;
  const pick = days[key(selected)];
  const lv = profile?.progress;

  return (
    <div className="mode-page my-page">
      <section className="my-head">
        <Mascot mood="happy" size={72} />
        <div className="my-name">
          {editing ? (
            <form
              className="nick-form"
              onSubmit={(e) => {
                e.preventDefault();
                void saveNickname();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={12}
                placeholder="2~12자 닉네임"
                aria-label="닉네임"
                autoFocus
              />
              <button className="btn btn-primary" disabled={saving || draft.trim().length < 2}>
                저장
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                취소
              </button>
            </form>
          ) : (
            <h1>
              {profile?.nickname ?? "닉네임을 정해 주세요"}
              <button
                className="icon-btn nick-edit"
                onClick={() => {
                  setDraft(profile?.nickname ?? "");
                  setEditing(true);
                }}
                aria-label="닉네임 바꾸기"
              >
                <Icon name="pencil" size={18} />
              </button>
            </h1>
          )}
          {error && <p className="nick-error">{error}</p>}
          <p className="my-sub">학습한 날 {activeDays}일 · 누적 {lv?.xp.toLocaleString("ko-KR") ?? "–"} XP</p>
        </div>
      </section>

      <section className="my-level">
        <div className="my-level-badge">
          <small>LEVEL</small>
          <b>{lv?.level ?? "–"}</b>
        </div>
        <div className="my-level-bar">
          <div className="xp-track" aria-hidden="true">
            <span style={{ transform: `scaleX(${lv ? lv.levelXp / lv.levelNeed : 0})` }} />
          </div>
          <p>
            {lv ? (
              <>
                <b>{lv.levelXp.toLocaleString("ko-KR")}</b> / {lv.levelNeed.toLocaleString("ko-KR")} XP · 다음 레벨까지{" "}
                {(lv.levelNeed - lv.levelXp).toLocaleString("ko-KR")} XP
              </>
            ) : (
              "불러오는 중…"
            )}
          </p>
        </div>
      </section>

      <section className={`my-streak${(profile?.streak ?? 0) > 0 ? " lit" : ""}`}>
        <div className="streak-big">
          <Icon name="flame" size={64} />
          <div>
            <b>{profile?.streak ?? 0}일</b>
            <span>연속 학습 · 최고 {profile?.bestStreak ?? 0}일</span>
          </div>
        </div>
        <ol className="week-dots" aria-label="이번 주 학습">
          {thisWeek.map((d, i) => {
            const n = d ? days[key(d)]?.total ?? 0 : 0;
            return (
              <li key={i} className={`${n > 0 ? "on" : ""}${d === today ? " today" : ""}${d ? "" : " future"}`}>
                <span>{n > 0 ? <Icon name="check" size={16} /> : null}</span>
                {WEEKDAY[i]}
              </li>
            );
          })}
        </ol>
        <p className="streak-goal">
          오늘 활동 {profile?.todayCount ?? 0} / {profile?.dailyGoal ?? 3}
          {(profile?.todayCount ?? 0) >= (profile?.dailyGoal ?? 3) ? " · 목표 달성!" : " · 하나라도 하면 불꽃이 이어져요"}
        </p>
      </section>

      <section className="detail-card my-calendar">
        <h3>활동 기록</h3>
        <div className="heatmap" role="grid" aria-label={`최근 ${WEEKS}주 활동`}>
          {grid.map((d, i) =>
            d ? (
              <button
                key={i}
                className={`hm l${level(days[key(d)]?.total)}${d === selected ? " sel" : ""}`}
                onClick={() => setSelected(d)}
                aria-label={`${d} 활동 ${days[key(d)]?.total ?? 0}회`}
              />
            ) : (
              <span key={i} className="hm empty" />
            ),
          )}
        </div>
        <p className="heatmap-legend">
          적게 <span className="hm l1" /> <span className="hm l2" /> <span className="hm l3" /> <span className="hm l4" /> 많이
        </p>

        <div className="day-summary">
          <strong>
            {selected.slice(5).replace("-", "월 ")}일{selected === today ? " · 오늘" : ""}
          </strong>
          {pick && pick.total > 0 ? (
            <>
              <ul>
                {KIND_LABEL.filter(([k]) => pick.counts[k]).map(([k, label, icon]) => (
                  <li key={k}>
                    <Icon name={icon as never} size={22} /> {label} <b>{pick.counts[k]}{k === "game" ? "판" : "번"}</b>
                  </li>
                ))}
                {pick.counts.goal ? (
                  <li>
                    <Icon name="trophy" size={22} /> 하루 목표 <b>달성</b>
                  </li>
                ) : null}
              </ul>
              <p className="day-xp">
                <Icon name="bolt" size={18} /> +{pick.xp} XP
              </p>
            </>
          ) : (
            <p className="day-empty">이날은 활동 기록이 없어요.</p>
          )}
        </div>
      </section>
    </div>
  );
}
