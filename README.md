# 사지선다

> 나를 알아가는 가장 재미있는 방법

심리 테스트, 능력 측정, 추리 퀴즈를 즐기고 결과를 친구와 공유할 수 있는 웹 서비스입니다.

<br/>

## 주요 기능

**테스트**
| 카테고리 | 종류 |
|---|---|
| 성격 | MBTI 테스트, 공감 능력 테스트 |
| 연애 | 이상형 테스트, MBTI 궁합 테스트 |
| 능력 | 기억력, 반응속도, 동체시력, 사격 능력, 추리력 테스트 |
| 기타 | 알바생 멘탈 테스트, 소비 습관 테스트 |
| 추리 | 수평사고 퀴즈 |

**커뮤니티**
- 자유게시판 / 공지 / 후기 게시판
- 게시글 작성, 댓글, 좋아요

**계정**
- 이메일 회원가입 / 로그인
- 활동 기반 레벨 시스템
- 프로필 페이지

**공유**
- 카카오톡 공유
- 인스타그램 스토리용 이미지 저장
- 결과 캡처 다운로드

**다국어 지원** — 한국어 / English / 中文

<br/>

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, CSS Modules |
| Backend | Supabase (Auth, PostgreSQL) |
| 외부 API | Gemini API, Kakao SDK |
| 기타 | html2canvas |

<br/>

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/seuh-h/Sajiseonda.git
cd Sajiseonda
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_js_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

<br/>

## 프로젝트 구조

```
app/
├── main/          # 메인 페이지 (테스트 목록, 커뮤니티 피드)
├── mbti/          # MBTI 테스트
├── love/          # 이상형 테스트
├── memory/        # 기억력 테스트
├── reaction/      # 반응속도 테스트
├── community/     # 커뮤니티 게시판
├── profile/       # 프로필 페이지
└── ...
components/        # 공용 컴포넌트
lib/
├── supabase.ts    # Supabase 클라이언트
├── levelSystem.ts # 레벨 계산 로직
└── i18n/          # 다국어 번역 파일
```
