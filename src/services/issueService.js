const dayjs = require("dayjs");
const { getDb } = require("../db");
const config = require("../config");
const { fetchFeed } = require("./rssService");
const { dedupeArticles, rankArticles } = require("./rankingService");
const {
    saveFetchedArticle,
    getActiveSources,
    getTopCandidateArticles,
    updateArticleSummary,
} = require("./articleRepository");
const { summarizeArticle, generateIssueExtras } = require("./aiService");
const { renderIssue } = require("./newsletterRenderer");
const { getIssueStats } = require("./trackingService");

async function fetchAndStoreArticles() {
    const sources = await getActiveSources();
    const results = await Promise.allSettled(
        sources.map(async (source) => {
            try {
                const items = await fetchFeed(source);
                return { source, items, error: null };
            } catch (error) {
                return { source, items: [], error };
            }
        })
    );

    const collected = [];
    for (const result of results) {
        if (result.status !== "fulfilled") continue;
        if (result.value.error) continue;
        collected.push(...result.value.items);
    }

    const ranked = rankArticles(dedupeArticles(collected));
    for (const article of ranked) {
        await saveFetchedArticle(article);
    }
    return ranked;
}

async function processTopArticles(limit = config.maxStoriesPerIssue) {
    const candidates = await getTopCandidateArticles(limit * 3);
    const selected = candidates.slice(0, limit);

    for (const article of selected) {
        if (article.status === "processed" && article.ai_title_el) continue;
        const summary = await summarizeArticle(article);
        await updateArticleSummary(article.id, summary);
    }

    const db = await getDb();
    if (!selected.length) return [];

    return db.all(
        `SELECT * FROM articles WHERE id IN (${selected.map(() => "?").join(",")}) ORDER BY score DESC, published_at DESC`,
        selected.map((article) => article.id)
    );
}

async function createOrUpdateTodayIssue() {
    const db = await getDb();
    const issueDate = dayjs().format("YYYY-MM-DD");
    const stories = await processTopArticles(config.maxStoriesPerIssue);

    if (!stories.length) throw new Error("No stories available.");

    const extras = await generateIssueExtras(stories);
    const rendered = renderIssue({
        issueDate,
        intro: extras.intro,
        curiosityHook: extras.curiosityHook,
        toolOfDay: extras.toolOfDay,
        ideaOfDay: extras.ideaOfDay,
        shareCta: extras.shareCta,
        stories,
    });

    await db.run(
        `INSERT INTO issues (issue_date, slug, title, subject_line_el, curiosity_hook_el, intro_el, tool_of_day_el, idea_of_day_el, share_cta_el, html_content, text_content, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
     ON CONFLICT(issue_date) DO UPDATE SET slug = excluded.slug, title = excluded.title, html_content = excluded.html_content`,
        [issueDate, rendered.slug, rendered.title, extras.subjectLine, extras.curiosityHook, extras.intro, extras.toolOfDay, extras.ideaOfDay, extras.shareCta, rendered.html, rendered.text]
    );

    const issue = await db.get(`SELECT * FROM issues WHERE issue_date = ?`, [issueDate]);
    return issue;
}

async function getLatestIssue() {
    const db = await getDb();
    return db.get(`SELECT * FROM issues ORDER BY issue_date DESC LIMIT 1`);
}

async function listIssues() {
    const db = await getDb();
    return db.all(`SELECT * FROM issues ORDER BY issue_date DESC`);
}

async function getLatestIssueDashboard() {
    const issue = await getLatestIssue();
    if (!issue) return null;
    const stats = await getIssueStats(issue.id);
    return { issue, stats };
}

// Fixed exports block
module.exports = {
    fetchAndStoreArticles,
    processTopArticles,
    createOrUpdateTodayIssue,
    getLatestIssue,
    getLatestIssueDashboard,
    listIssues,
};