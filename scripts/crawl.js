import { XMLParser } from "fast-xml-parser";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const COMPANIES = [
  { name: "삼성SDS", query: "삼성SDS" },
  { name: "LG CNS", query: "LG CNS" },
  { name: "SK C&C", query: "SK C&C" },
  { name: "네이버", query: "네이버" },
  { name: "카카오", query: "카카오" },
  { name: "NHN", query: "NHN" },
  { name: "더존비즈온", query: "더존비즈온" },
  { name: "한글과컴퓨터", query: "한글과컴퓨터" },
];

const ITEMS_PER_COMPANY = 12;
const OUTPUT_PATH = path.join(process.cwd(), "data", "news.json");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function buildFeedUrl(query) {
  const q = encodeURIComponent(`"${query}"`);
  return `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;
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
    companies: COMPANIES.map((c) => c.name),
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
