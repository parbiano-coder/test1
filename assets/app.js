const DATA_URL = "data/news.json";

const state = {
  articles: [],
  companies: [],
  activeCompany: "전체",
  query: "",
};

const els = {
  updatedAt: document.getElementById("updatedAt"),
  filters: document.getElementById("filters"),
  searchInput: document.getElementById("searchInput"),
  statusMessage: document.getElementById("statusMessage"),
  articleList: document.getElementById("articleList"),
};

function seriesVarFor(company) {
  const index = state.companies.indexOf(company);
  if (index === -1) return "var(--text-muted)";
  return `var(--series-${(index % 8) + 1})`;
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

function renderFilters() {
  const options = ["전체", ...state.companies];
  els.filters.innerHTML = "";

  for (const company of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn";
    btn.setAttribute("aria-pressed", String(company === state.activeCompany));
    if (company !== "전체") {
      btn.style.setProperty("--dot-color", seriesVarFor(company));
    }

    const dot = document.createElement("span");
    dot.className = "dot";
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode(company));

    btn.addEventListener("click", () => {
      state.activeCompany = company;
      renderFilters();
      renderArticles();
    });

    els.filters.appendChild(btn);
  }
}

function renderArticles() {
  const query = state.query.trim().toLowerCase();

  const filtered = state.articles.filter((a) => {
    const matchesCompany = state.activeCompany === "전체" || a.company === state.activeCompany;
    const matchesQuery = !query || a.title.toLowerCase().includes(query);
    return matchesCompany && matchesQuery;
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
    badge.style.setProperty("--badge-color", seriesVarFor(article.company));
    badge.textContent = article.company;
    meta.appendChild(badge);

    const sep1 = document.createTextNode(" · " + (article.source || "출처 미상"));
    meta.appendChild(sep1);

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
    state.companies = data.companies ?? [];

    const updated = new Date(data.updatedAt);
    els.updatedAt.textContent = Number.isNaN(updated.getTime())
      ? ""
      : `마지막 업데이트: ${updated.toLocaleString("ko-KR")}`;

    renderFilters();
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
