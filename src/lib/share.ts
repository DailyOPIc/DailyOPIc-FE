// 공유: 링크(공유 시트 · 클립보드)와 인스타 스토리용 결과 이미지(1080×1920).

export type ShareResult = "shared" | "copied" | "downloaded" | "cancelled" | "failed";

export async function shareLink(title: string, text: string, url: string): Promise<ShareResult> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      return "failed";
    }
  }
}

export type CardData = {
  mode: string; // 게임 이름
  score: number;
  correct: number;
  total: number;
  stars: number;
  headline: string; // "나를 이겨봐!" 등
  mascot?: SVGSVGElement | null; // 화면의 마스코트 SVG를 그대로 그린다
};

function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("class"); // 애니메이션 없이 정지 상태로
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, on: boolean) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = on ? "#F5A524" : "rgba(255,255,255,.22)";
  ctx.fill();
}

/** 인스타 스토리 크기 결과 카드 */
export async function renderStoryCard(d: CardData): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const font = (w: number, size: number) => `${w} ${size}px "Pretendard Variable", Pretendard, -apple-system, sans-serif`;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#2A1499");
  g.addColorStop(0.55, "#4B24FF");
  g.addColorStop(1, "#7C5CFF");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 배경 외곽선 글자
  ctx.save();
  ctx.font = font(900, 300);
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 3;
  ctx.textAlign = "center";
  ctx.strokeText("SPEAK", W / 2, 1650);
  ctx.strokeText("DAILY", W / 2, 1930);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = font(900, 52);
  ctx.fillText("데일리오픽", W / 2, 150);
  ctx.font = font(700, 40);
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.fillText(`단어 게임 · ${d.mode}`, W / 2, 220);

  if (d.mascot) {
    try {
      const img = await svgToImage(d.mascot);
      const mw = 420;
      ctx.drawImage(img, (W - mw) / 2, 300, mw, (mw * 150) / 120);
    } catch {
      /* 마스코트 없이도 카드는 만든다 */
    }
  }

  ctx.fillStyle = "#fff";
  ctx.font = font(900, 84);
  ctx.fillText(d.headline, W / 2, 940);

  for (let i = 0; i < 3; i++) star(ctx, W / 2 + (i - 1) * 150, 1060, 62, i < d.stars);

  ctx.font = font(900, 220);
  ctx.fillText(String(d.score), W / 2, 1360);
  ctx.font = font(700, 44);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.fillText(`점 · ${d.correct}/${d.total} 정답`, W / 2, 1440);

  // 하단 안내 띠
  ctx.fillStyle = "rgba(255,255,255,.95)";
  const bw = 820;
  const bx = (W - bw) / 2;
  ctx.beginPath();
  ctx.roundRect(bx, 1560, bw, 150, 40);
  ctx.fill();
  ctx.fillStyle = "#3417C7";
  ctx.font = font(900, 46);
  ctx.fillText("같은 문제로 나를 이겨 봐!", W / 2, 1625);
  ctx.font = font(700, 36);
  ctx.fillStyle = "#5B6472";
  ctx.fillText("www.dailyopic.link", W / 2, 1680);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

/** 이미지 공유: 휴대폰은 공유 시트(인스타 스토리 선택 가능), 아니면 내려받기 */
export async function shareImage(blob: Blob, text: string, url: string): Promise<ShareResult> {
  const file = new File([blob], "dailyopic-challenge.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: `${text}\n${url}` });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dailyopic-challenge.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return "downloaded";
}
