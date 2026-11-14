import { useState } from "react";
import { Logo } from "./Bits";
import { Link, NavLink } from "react-router-dom";
import { signOut, useAuth } from "../lib/auth";

const NAV = [
  { to: "/membership", label: "요금제" },
  { to: "/help", label: "고객센터" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
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
          <NavLink to="/study" onClick={() => setOpen(false)}>
            학습하기
          </NavLink>
          {user ? (
            <button
              className="button button-soft nav-login"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              로그아웃
            </button>
          ) : (
            <Link to="/login" className="button button-soft nav-login" onClick={() => setOpen(false)}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
