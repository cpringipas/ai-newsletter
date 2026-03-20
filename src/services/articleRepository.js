const { getDb } = require("../db");

async function saveFetchedArticle(article) {
  const db = await getDb();
  await db.run(
    `
      INSERT INTO articles (source_id, guid, url, title, raw_content, published_at, score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'fetched')
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        raw_content = excluded.raw_content,
        published_at = excluded.published_at,
        score = excluded.score
    `,
    [
      article.sourceId,
      article.guid,
      article.url,
      article.title,
      article.rawContent,
      article.publishedAt,
      article.score || 0,
    ]
  );
}

async function getActiveSources() {
  const db = await getDb();
  return db.all(`SELECT * FROM sources WHERE active = 1 ORDER BY name ASC`);
}

async function getTopCandidateArticles(limit) {
  const db = await getDb();
  return db.all(
    `
      SELECT *
      FROM articles
      WHERE published_at >= datetime('now', '-3 day')
      ORDER BY score DESC, published_at DESC
      LIMIT ?
    `,
    [limit]
  );
}

async function updateArticleSummary(articleId, summary) {
  const db = await getDb();
  await db.run(
    `
      UPDATE articles
      SET ai_title_el = ?,
          bullets_el = ?,
          why_matters_el = ?,
          use_cases_el = ?,
          status = 'processed'
      WHERE id = ?
    `,
    [
      summary.title,
      JSON.stringify(summary.bullets),
      summary.whyItMatters,
      JSON.stringify(summary.useCases),
      articleId,
    ]
  );
}

module.exports = {
  saveFetchedArticle,
  getActiveSources,
  getTopCandidateArticles,
  updateArticleSummary,
};

