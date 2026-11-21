import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { api, ApiError } from "../lib/api";
import { signOut } from "../lib/auth";

/** 이 기기에 남은 학습 기록(경험치 · 설정 · 결과 · 한도)을 지운다. 효과음 설정만 남긴다. */
function clearLocalData() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("dailyopic:") && key !== "dailyopic:muted") localStorage.removeItem(key);
    }
  } catch {
    /* 저장소가 막힌 브라우저는 지울 것도 없다 */
  }
}

/** 계정 삭제 확인 창. 되돌릴 수 없으니 무엇이 사라지는지 먼저 보여 주고 한 번 더 누르게 한다. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteAccount();
      clearLocalData();
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    await signOut().catch(() => {});
    navigate("/", { replace: true });
  };

  // 학습 판 등 앱 안의 쌓임 순서와 상관없이 맨 위에 뜨도록 body에 그린다.
  return createPortal(
    <div className="dialog-backdrop" role="presentation" onClick={done || busy ? undefined : onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <Mascot mood="sad" size={96} />
            <h2 id="delete-title">계정을 삭제했어요</h2>
            <p>그동안 함께 공부해 줘서 고마워요. 언제든 다시 시작할 수 있어요.</p>
            <button className="btn btn-primary btn-block" onClick={leave}>
              처음으로
            </button>
          </>
        ) : (
          <>
            <Icon name="close" size={40} />
            <h2 id="delete-title">계정을 삭제할까요?</h2>
            <ul className="dialog-list">
              <li>학습 기록, 경험치, 사용량이 모두 지워지고 되돌릴 수 없어요.</li>
              <li>남은 웹 이용권과 보유 토큰도 사라져요. 환불은 삭제 전에 <Link to="/refund">환불 규정</Link>에 따라 요청해 주세요.</li>
              <li>iPhone 앱의 App Store 구독은 자동으로 해지되지 않아요. iPhone 설정 → Apple 계정 → 구독에서 해지해 주세요.</li>
            </ul>
            {error && (
              <p className="dialog-error" role="alert">
                {error}
              </p>
            )}
            <div className="row-actions">
              <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
                취소
              </button>
              <button className="btn btn-danger" onClick={remove} disabled={busy}>
                {busy ? "삭제하는 중…" : "계정 삭제"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
