const dayjs = require("dayjs");

const importantKeywords = [
  "openai",
  "google",
  "microsoft",
  "anthropic",
  "chatgpt",
  "gemini",
  "copilot",
  "education",
  "teacher",
  "business",
  "startup",
  "productivity",
  "automation",
  "ai agent",
  "model",
];

function normalizeText(value = "") {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function similarityKey(article) {
  return normalizeText(`${article.title} ${article.rawContent}`).split(" ").slice(0, 18).join(" ");
}

function dedupeArticles(articles) {
  const seenUrls = new Set();
  const seenBodies = new Set();
  const unique = [];

  for (const article of articles) {
    const bodyKey = similarityKey(article);
    if (seenUrls.has(article.url) || seenBodies.has(bodyKey)) {
      continue;
    }
    seenUrls.add(article.url);
    seenBodies.add(bodyKey);
    unique.push(article);
  }

  return unique;
}

function scoreArticle(article) {
  const normalized = normalizeText(`${article.title} ${article.rawContent}`);
  const keywordScore = importantKeywords.reduce(
    (sum, keyword) => sum + (normalized.includes(keyword) ? 8 : 0),
    0
  );

  const published = dayjs(article.publishedAt);
  const ageHours = Math.max(dayjs().diff(published, "hour"), 0);
  const freshnessScore = Math.max(50 - ageHours, 0);
  const lengthScore = Math.min((article.rawContent || "").length / 40, 20);

  return keywordScore + freshnessScore + lengthScore;
}

function rankArticles(articles) {
  return articles
    .map((article) => ({ ...article, score: scoreArticle(article) }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  dedupeArticles,
  rankArticles,
};
