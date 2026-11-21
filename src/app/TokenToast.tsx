import { useEffect, useState } from "react";
import { Icon } from "../assets/Icon";
import { TOKEN_EVENT } from "../lib/tokens";

/** "+1 토큰" 알림. 어느 화면에서 받아도 위쪽에 잠깐 떴다 사라진다. */
export function TokenToast() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    let timer = 0;
    const show = (e: Event) => {
      setLabel((e as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLabel(null), 2600);
    };
    window.addEventListener(TOKEN_EVENT, show);
    return () => {
      window.removeEventListener(TOKEN_EVENT, show);
      window.clearTimeout(timer);
    };
  }, []);
  if (!label) return null;
  return (
    <div className="token-toast" role="status" key={label}>
      <Icon name="coin" size={28} />
      <span>
        <b>토큰 +1</b> {label}
      </span>
    </div>
  );
}
