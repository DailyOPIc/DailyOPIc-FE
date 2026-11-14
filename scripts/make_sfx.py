"""데일리오픽 효과음 생성기 — 표준 라이브러리만으로 합성해 public/sfx/*.mp3로 내보낸다.

다시 만들기:  python3 scripts/make_sfx.py   (ffmpeg 필요)
소리 성격을 바꾸려면 아래 SOUNDS의 음표 목록만 고치면 된다.
"""

from __future__ import annotations

import math
import random
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

RATE = 44100
OUT = Path(__file__).resolve().parents[1] / "public" / "sfx"


def note(freq: float, dur: float, *, wave_type: str = "sine", attack: float = 0.005,
         decay: float = 6.0, gain: float = 0.5, bend: float = 0.0, harmonics=(1.0, 0.25, 0.08)) -> list[float]:
    """하나의 음. 짧은 어택 + 지수 감쇠, 배음을 조금 섞어 '통통한' 소리를 낸다."""
    n = int(RATE * dur)
    out = []
    phase = 0.0
    for i in range(n):
        t = i / RATE
        f = freq * (1 + bend * t / dur)
        phase += 2 * math.pi * f / RATE
        if wave_type == "sine":
            s = sum(a * math.sin(phase * (k + 1)) for k, a in enumerate(harmonics))
        elif wave_type == "triangle":
            s = 2 / math.pi * math.asin(math.sin(phase))
        else:  # soft square
            s = math.tanh(3 * math.sin(phase)) * 0.6
        env = min(1.0, t / attack) * math.exp(-decay * t)
        out.append(s * env * gain)
    return out


def noise(dur: float, *, gain=0.3, decay=40.0, tone=0.0) -> list[float]:
    """짧은 잡음(타자 '틱', 바람 소리용). tone>0이면 저역 통과로 부드럽게."""
    rnd = random.Random(7)
    out, prev = [], 0.0
    for i in range(int(RATE * dur)):
        t = i / RATE
        x = rnd.uniform(-1, 1)
        prev = prev + tone * (x - prev) if tone else x
        out.append(prev * gain * math.exp(-decay * t))
    return out


def mix(parts: list[tuple[float, list[float]]], tail: float = 0.25) -> list[float]:
    """(시작 초, 샘플) 목록을 겹쳐 한 트랙으로. 짧은 메아리를 얹어 공간감을 준다."""
    length = max(int(start * RATE) + len(s) for start, s in parts) + int(tail * RATE)
    buf = [0.0] * length
    for start, s in parts:
        o = int(start * RATE)
        for i, v in enumerate(s):
            buf[o + i] += v
    delay = int(0.09 * RATE)
    for i in range(delay, length):
        buf[i] += buf[i - delay] * 0.18
    peak = max(abs(v) for v in buf) or 1
    return [v / peak * 0.85 for v in buf]


C5, D5, E5, F5, G5, A5, B5, C6, E6, G6 = 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1318.5, 1568.0

SOUNDS = {
    # 버튼 탭: 짧고 부드러운 '톡'
    "tap": lambda: mix([(0, note(880, 0.07, wave_type="triangle", decay=45, gain=0.5))], tail=0.05),
    # 선택(칩 · 카드): 살짝 높은 '틱톡'
    "select": lambda: mix([(0, note(1046, 0.05, decay=50)), (0.04, note(1318, 0.07, decay=40))], tail=0.08),
    # 정답 · 분석 완료: 맑은 두 음 차임
    "correct": lambda: mix([(0, note(E5, 0.25, decay=9)), (0.09, note(G5 * 1.0, 0.4, decay=7)),
                            (0.09, note(C6, 0.4, decay=7, gain=0.3))]),
    # 오답 · 오류: 낮고 짧은 '뚱'(귀에 거슬리지 않게)
    "wrong": lambda: mix([(0, note(220, 0.18, wave_type="square", decay=14, gain=0.35, bend=-0.15)),
                          (0.08, note(185, 0.22, wave_type="square", decay=12, gain=0.3, bend=-0.1))], tail=0.1),
    # 코인(XP · 토큰): 반짝이는 두 번 '딩'
    "coin": lambda: mix([(0, note(B5, 0.08, decay=20)), (0.07, note(E6, 0.35, decay=8))]),
    # 콤보: 위로 올라가는 짧은 음(콤보 수에 따라 앱에서 재생 속도로 음높이를 올린다)
    "combo": lambda: mix([(0, note(G5, 0.06, decay=25)), (0.05, note(C6, 0.06, decay=25)),
                          (0.1, note(E6, 0.18, decay=12))], tail=0.1),
    # 목표 달성 · 완주: 팡파르
    "fanfare": lambda: mix([(0, note(C5, 0.16, decay=10)), (0.12, note(E5, 0.16, decay=10)),
                            (0.24, note(G5, 0.16, decay=10)), (0.36, note(C6, 0.7, decay=4)),
                            (0.36, note(E6, 0.7, decay=4, gain=0.3)), (0.36, note(G5, 0.7, decay=4, gain=0.3))], tail=0.4),
    # 연속 학습: 쓸어 올리는 바람 + 딩
    "streak": lambda: mix([(0, note(400, 0.35, decay=5, bend=1.6, gain=0.35)), (0, noise(0.35, gain=0.12, decay=8, tone=0.05)),
                           (0.3, note(C6, 0.4, decay=7))]),
    # 녹음 시작 · 끝
    "rec_start": lambda: mix([(0, note(G5, 0.08, decay=25)), (0.08, note(C6, 0.14, decay=15))], tail=0.08),
    "rec_stop": lambda: mix([(0, note(C6, 0.08, decay=25)), (0.08, note(G5, 0.14, decay=15))], tail=0.08),
    # 타자 키: 기계식 키보드 같은 짧은 '틱'
    "key": lambda: mix([(0, noise(0.03, gain=0.6, decay=180, tone=0.35)), (0, note(1900, 0.02, decay=200, gain=0.15))], tail=0.02),
    # 하트(목숨) 잃음: 떨어지는 음
    "lose": lambda: mix([(0, note(G5, 0.3, decay=6, bend=-0.45, gain=0.45))], tail=0.1),
    # 레벨/세트 시작: 경쾌한 3음
    "start": lambda: mix([(0, note(C5, 0.09, decay=18)), (0.08, note(E5, 0.09, decay=18)), (0.16, note(G5, 0.22, decay=10))]),
}


def write_mp3(name: str, samples: list[float]) -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        with wave.open(tmp.name, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v)) * 32767)) for v in samples))
        target = OUT / f"{name}.mp3"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-ac", "1", "-b:a", "96k", str(target)],
            check=True,
        )
    return target.stat().st_size


if __name__ == "__main__":
    for name, make in SOUNDS.items():
        size = write_mp3(name, make())
        print(f"{name:10s} {size / 1024:5.1f} KB")
