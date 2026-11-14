import { useState } from "react";
import { Logo } from "./Bits";
import { Link, NavLink } from "react-router-dom";

const NAV = [
  { to: "/membership", label: "요금제" },
  { to: "/help", label: "고객센터" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Logo size={28} />
          <span>데일리오픽</span>
        </Link>
        <button
          className="menu-button"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
        <nav id="site-nav" className={open ? "nav open" : "nav"}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          {/* 웹 로그인은 다음 단계(계정 연동)에서 연결한다. */}
          <button className="button button-soft nav-login" disabled title="웹 로그인은 곧 열려요">
            로그인
          </button>
        </nav>
      </div>
    </header>
  );
}
