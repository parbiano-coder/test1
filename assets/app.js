const DATA_URL = "data/news.json";
const ALL = "전체";

const state = {
  articles: [],
  categories: [],
  companies: [], // [{ name, category }]
  activeCategory: ALL,
  activeCompany: ALL,
  query: "",
};

const els = {
  updatedAt: document.getElementById("updatedAt"),
  categoryFilters: document.getElementById("categoryFilters"),
  companyFilters: document.getElementById("companyFilters"),
  searchInput: document.getElementById("searchInput"),
  statusMessage: document.getElementById("statusMessage"),
  articleList: document.getElementById("articleList"),
};

// 카테고리는 2개뿐이므로 검증된 카테고리 팔레트의 앞쪽 두 슬롯(파랑/주황)을 그대로 사용한다.
function seriesVarForCategory(category) {
  const index = state.categories.indexOf(category);
  if (index === -1) return "var(--text-muted)";
  return `var(--series-${(index % 8) + 1})`;
}

function companyCategory(companyName) {
  return state.companies.find((c) => c.name === companyName)?.category;
}

function formatDate(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeFilterButton(label, isActive, dotColorVar, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "filter-btn";
  btn.setAttribute("aria-pressed", String(isActive));
  if (dotColorVar) btn.style.setProperty("--dot-color", dotColorVar);

  const dot = document.createElement("span");
  dot.className = "dot";
  btn.appendChild(dot);
  btn.appendChild(document.createTextNode(label));

  btn.addEventListener("click", onClick);
  return btn;
}

function renderCategoryFilters() {
  els.categoryFilters.innerHTML = "";
  const options = [ALL, ...state.categories];

  for (const category of options) {
    const dotColorVar = category === ALL ? null : seriesVarForCategory(category);
    const btn = makeFilterButton(category, category === state.activeCategory, dotColorVar, () => {
      state.activeCategory = category;
      state.activeCompany = ALL; // 카테고리를 바꾸면 기업 선택 초기화
      renderCategoryFilters();
      renderCompanyFilters();
      renderArticles();
    });
    els.categoryFilters.appendChild(btn);
  }
}

function renderCompanyFilters() {
  els.companyFilters.innerHTML = "";

  const visibleCompanies =
    state.activeCategory === ALL
      ? state.companies
      : state.companies.filter((c) => c.category === state.activeCategory);

  const options = [ALL, ...visibleCompanies.map((c) => c.name)];

  for (const company of options) {
    const category = company === ALL ? null : companyCategory(company);
    const dotColorVar = category ? seriesVarForCategory(category) : null;
    const btn = makeFilterButton(company, company === state.activeCompany, dotColorVar, () => {
      state.activeCompany = company;
      renderCompanyFilters();
      renderArticles();
    });
    els.companyFilters.appendChild(btn);
  }
}

function renderArticles() {
  const query = state.query.trim().toLowerCase();

  const filtered = state.articles.filter((a) => {
    const matchesCategory = state.activeCategory === ALL || a.category === state.activeCategory;
    const matchesCompany = state.activeCompany === ALL || a.company === state.activeCompany;
    const matchesQuery = !query || a.title.toLowerCase().includes(query);
    return matchesCategory && matchesCompany && matchesQuery;
  });

  els.articleList.innerHTML = "";

  if (filtered.length === 0) {
    els.statusMessage.hidden = false;
    els.statusMessage.textContent = "표시할 뉴스가 없습니다.";
    return;
  }
  els.statusMessage.hidden = true;

  const fragment = document.createDocumentFragment();
  for (const article of filtered) {
    const li = document.createElement("li");
    li.className = "article-card";

    const meta = document.createElement("div");
    meta.className = "article-meta";

    const badge = document.createElement("span");
    badge.className = "company-badge";
    badge.style.setProperty("--badge-color", seriesVarForCategory(article.category));
    badge.textContent = `${article.category} · ${article.company}`;
    meta.appendChild(badge);

    meta.appendChild(document.createTextNode(" · " + (article.source || "출처 미상")));

    const dateText = formatDate(article.pubDate);
    if (dateText) {
      meta.appendChild(document.createTextNode(" · " + dateText));
    }

    const titleEl = document.createElement("p");
    titleEl.className = "article-title";
    const link = document.createElement("a");
    link.href = article.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = article.title;
    titleEl.appendChild(link);

    li.appendChild(meta);
    li.appendChild(titleEl);
    fragment.appendChild(li);
  }
  els.articleList.appendChild(fragment);
}

async function init() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.articles = data.articles ?? [];
    state.categories = data.categories ?? [];
    state.companies = data.companies ?? [];

    const updated = new Date(data.updatedAt);
    els.updatedAt.textContent = Number.isNaN(updated.getTime())
      ? ""
      : `마지막 업데이트: ${updated.toLocaleString("ko-KR")}`;

    renderCategoryFilters();
    renderCompanyFilters();
    renderArticles();
  } catch (err) {
    els.updatedAt.textContent = "";
    els.statusMessage.hidden = false;
    els.statusMessage.textContent = "뉴스 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    console.error(err);
  }
}

els.searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderArticles();
});

init();
