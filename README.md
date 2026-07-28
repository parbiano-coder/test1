# 국내 IT 서비스 및 디지털 금융 뉴스 모아보기

Google 뉴스 RSS에서 국내 주요 기업의 최신 뉴스를 주기적으로 수집해 카테고리별로
보여주는 정적 사이트입니다. 두 개 카테고리로 분류합니다.

- **IT 서비스**: 삼성SDS, LG CNS, SK AX, 네이버, 카카오, NHN, 더존비즈온, 한글과컴퓨터, KT, 네이버클라우드
- **디지털 금융** (스테이블코인 · 디지털자산): 두나무, 빗썸코리아, 코인원, 카카오페이, 네이버파이낸셜, 토스, 코빗, 고팍스, 컴투스

기사 제목에서 AI·실적·상장·클라우드 등의 키워드를 자동으로 뽑아 태그로 붙이고,
카테고리 → 기업 → 키워드 3단으로 좁혀가며 볼 수 있습니다.

- 크롤러: Node.js 스크립트가 회사별 Google 뉴스 RSS를 가져와 `data/news.json`으로 저장
- 자동화: GitHub Actions가 6시간마다 크롤러를 실행하고 결과를 커밋
- 배포: GitHub Pages (별도 서버 없이 정적 파일만 서빙)

## 로컬에서 실행하기

```bash
npm install
npm run crawl        # data/news.json 생성/갱신
npx serve .           # 아무 정적 서버로 index.html 확인 (예: npx serve, python -m http.server 등)
```

## GitHub에 배포하는 방법

1. GitHub에 새 저장소를 만들고 이 프로젝트를 push합니다.

   ```bash
   git remote add origin <저장소 URL>
   git branch -M main
   git push -u origin main
   ```

2. 저장소 **Settings → Actions → General → Workflow permissions**에서
   **"Read and write permissions"**를 선택합니다. (크롤러 커밋을 push하려면 필요)

3. 저장소 **Settings → Pages**에서 다음과 같이 설정합니다.
   - Source: `Deploy from a branch`
   - Branch: `main` / `(root)`

4. **Actions** 탭에서 `Crawl IT News` 워크플로우를 한 번 수동 실행(`Run workflow`)해
   `data/news.json`을 최신 상태로 갱신합니다.

5. 잠시 후 `https://<사용자명>.github.io/<저장소명>/` 에서 사이트를 확인할 수 있습니다.

이후로는 6시간마다 GitHub Actions가 자동으로 뉴스를 갱신하고 커밋하며,
GitHub Pages가 그 내용을 그대로 반영합니다.

## 대상 기업 / 카테고리 / 소스 변경하기

- 대상 기업·카테고리 목록: [`scripts/crawl.js`](scripts/crawl.js)의 `COMPANIES` 배열 수정
  (각 항목은 `{ name, query, category }` 형태이며 `category`는 `CATEGORY_IT` 또는 `CATEGORY_FINANCE`)
- 새 카테고리를 추가하려면 `CATEGORY_*` 상수를 추가하고 `payload.categories`에도 반영
- 키워드 태그 사전: `scripts/crawl.js`의 `KEYWORD_RULES` 배열 수정 (제목에 트리거 단어가 있으면 해당 태그가 붙음)
- 크롤링 주기: [`.github/workflows/crawl.yml`](.github/workflows/crawl.yml)의 `cron` 값 수정
- 회사당 수집 기사 수: `scripts/crawl.js`의 `ITEMS_PER_COMPANY` 값 수정

## 참고

이 사이트는 Google 뉴스 RSS 검색 결과를 그대로 링크합니다. 기사 본문 저작권은 각 언론사에
있으며, 이 사이트는 제목/출처/링크만 노출합니다. 과도하게 짧은 주기로 크롤링하면 요청이
차단될 수 있으니 주기를 너무 짧게 설정하지 마세요.
