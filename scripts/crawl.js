import { XMLParser } from "fast-xml-parser";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CATEGORY_IT = "IT 서비스";
const CATEGORY_FINANCE = "디지털 금융";

// query는 Google 뉴스에 그대로 전달되는 검색식입니다.
// 회사명 하나는 큰따옴표로 정확히 매칭하고, 여러 단어를 조합할 때는
// 전체를 하나의 구문으로 묶지 않도록 주의합니다 (아래 buildFeedUrl 참고).
const COMPANIES = [
  // IT 서비스
  { name: "삼성SDS", query: '"삼성SDS"', category: CATEGORY_IT },
  { name: "LG CNS", query: '"LG CNS"', category: CATEGORY_IT },
  { name: "SK AX", query: '"SK AX" OR "SK C&C"', category: CATEGORY_IT },
  { name: "네이버", query: '"네이버"', category: CATEGORY_IT },
  { name: "카카오", query: '"카카오"', category: CATEGORY_IT },
  { name: "NHN", query: '"NHN"', category: CATEGORY_IT },
  { name: "더존비즈온", query: '"더존비즈온"', category: CATEGORY_IT },
  { name: "한글과컴퓨터", query: '"한글과컴퓨터"', category: CATEGORY_IT },
  { name: "KT", query: '"KT"', category: CATEGORY_IT },
  { name: "네이버클라우드", query: '"네이버클라우드"', category: CATEGORY_IT },

  // 디지털 금융 (스테이블코인 · 디지털자산)
  { name: "두나무", query: '"두나무"', category: CATEGORY_FINANCE },
  { name: "빗썸코리아", query: '"빗썸코리아" OR "빗썸"', category: CATEGORY_FINANCE },
  { name: "코인원", query: '"코인원"', category: CATEGORY_FINANCE },
  { name: "카카오페이", query: '"카카오페이"', category: CATEGORY_FINANCE },
  { name: "네이버파이낸셜", query: '"네이버파이낸셜"', category: CATEGORY_FINANCE },
  { name: "토스", query: '"토스"', category: CATEGORY_FINANCE },
  { name: "코빗", query: '"코빗"', category: CATEGORY_FINANCE },
  { name: "고팍스", query: '"고팍스"', category: CATEGORY_FINANCE },
  { name: "컴투스", query: '"컴투스"', category: CATEGORY_FINANCE },
];

const ITEMS_PER_COMPANY = 12;
const OUTPUT_PATH = path.join(process.cwd(), "data", "news.json");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function buildFeedUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
}

// Google News titles are formatted as "실제 제목 - 언론사명"
function splitTitleAndSource(rawTitle) {
  const idx = rawTitle.lastIndexOf(" - ");
  if (idx === -1) return { title: rawTitle, source: "" };
  return { title: rawTitle.slice(0, idx), source: rawTitle.slice(idx + 3) };
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "object") return String(value["#text"] ?? "");
  return String(value);
}

async function fetchCompanyNews(company) {
  const url = buildFeedUrl(company.query);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.slice(0, ITEMS_PER_COMPANY).map((item) => {
    const { title, source: titleSource } = splitTitleAndSource(textOf(item.title).trim());
    const source = textOf(item.source).trim() || titleSource || "알 수 없음";
    return {
      company: company.name,
      category: company.category,
      title,
      link: textOf(item.link).trim(),
      source,
      pubDate: textOf(item.pubDate).trim(),
    };
  });
}

async function main() {
  const results = [];

  for (const company of COMPANIES) {
    try {
      const items = await fetchCompanyNews(company);
      results.push(...items);
      console.log(`OK  ${company.name}: ${items.length}건`);
    } catch (err) {
      console.error(`FAIL ${company.name}: ${err.message}`);
    }
  }

  results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const payload = {
    updatedAt: new Date().toISOString(),
    categories: [CATEGORY_IT, CATEGORY_FINANCE],
    companies: COMPANIES.map((c) => ({ name: c.name, category: c.category })),
    articles: results,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`\n총 ${results.length}건 저장 완료 -> ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
