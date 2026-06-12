# 🏠 전세 vs 월세 비교 계산기

전세대출 이자와 보증금 기회비용까지 따져서, 거주 기간 동안 **전세와 월세 중 어느 쪽이 진짜 싼지** 한눈에 알려주는 계산기입니다.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)

**🔗 라이브 데모:** https://jeonse-vs-monthly.vercel.app

<!-- 스크린샷 -->

## ✨ 주요 기능

- 🧮 **총 주거비용 비교** — 전세(전세대출 이자 + 자기자본 기회비용) vs 월세(월세 총액 + 보증금 기회비용)를 거주 기간 기준으로 계산하고, 어느 쪽이 얼마나 유리한지 결론 카드로 명확하게 보여줍니다
- 🏦 **전세대출 시뮬레이션** — 대출 비율(%)과 금리를 입력하면 이자 비용과 자기자본을 자동 반영
- 💸 **기회비용 계산** — 보증금으로 묶인 돈을 예금/투자(월복리)로 굴렸을 때의 수익을 비용으로 환산
- 📈 **누적 비용 라인 차트** — 기간이 길어질수록 두 선택지의 비용이 어떻게 벌어지는지 순수 SVG 차트로 시각화
- 📊 **비용 구성 분해** — 이자 / 월세 / 기회비용을 색상별 스택 바로 분해
- 🔄 **전월세 전환율 환산** — 월세 조건 → 전세 보증금 환산, 전세 조건 → 월세 환산을 동시에 표시해 어느 조건이 시장 기준 대비 저렴한지 확인
- 💾 **localStorage 저장** — 입력값 자동 저장, 새로고침해도 유지
- 📱 다크 테마 반응형 한글 UI, 천 단위 콤마 + 슬라이더 병행 입력, 억/만 단위 한글 금액 표기

## 🛠 기술 스택

- Vite + React + TypeScript
- Tailwind CSS v4
- 순수 SVG 차트 (외부 차트 라이브러리 없음)

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

## ⚠️ 면책

본 계산기는 단순 참고용입니다. 실제로는 대출 한도·우대금리·보증보험료·중개수수료·월세 세액공제·보증금 미반환 위험 등 다양한 요소가 의사결정에 영향을 줍니다. 중요한 결정 전 반드시 금융기관과 전문가에게 확인하세요.
