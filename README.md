# DailyOPIc-FE

데일리오픽 웹사이트(React + TypeScript + Vite).

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/
```

- 디자인 토큰: `src/styles.css` 상단(iOS `AppPalette.swift` / `AppTypography.swift`와 같은 값)
- 사이트 상수(스토어 링크, 사업자 정보, 요금제): `src/site.ts`
- Vercel 배포. SPA 라우팅이라 `vercel.json`에서 모든 경로를 `index.html`로 rewrite 한다.
