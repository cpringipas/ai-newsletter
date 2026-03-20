const { getDb } = require("../db");

async function trackEvent({ issueId, subscriberId = null, articleId = null, eventType, metadata = null }) {
  const db = await getDb();
  await db.run(
    `
      INSERT INTO tracking_events (issue_id, subscriber_id, article_id, event_type, metadata)
      VALUES (?, ?, ?, ?, ?)
    `,
    [issueId, subscriberId, articleId, eventType, metadata ? JSON.stringify(metadata) : null]
  );
}

async function getIssueStats(issueId) {
  const db = await getDb();
  const [opensRow, clicksRow, recipientsRow] = await Promise.all([
    db.get(
      `
        SELECT COUNT(DISTINCT subscriber_id) AS count
        FROM tracking_events
        WHERE issue_id = ? AND event_type = 'open'
      `,
      [issueId]
    ),
    db.get(
      `
        SELECT COUNT(*) AS count
        FROM tracking_events
        WHERE issue_id = ? AND event_type = 'click'
      `,
      [issueId]
    ),
    db.get(`SELECT COUNT(*) AS count FROM send_logs WHERE issue_id = ? AND status = 'sent'`, [issueId]),
  ]);

  const topLinks = await db.all(
    `
      SELECT a.ai_title_el, a.title, COUNT(te.id) AS clicks
      FROM tracking_events te
      JOIN articles a ON a.id = te.article_id
      WHERE te.issue_id = ? AND te.event_type = 'click'
      GROUP BY te.article_id
      ORDER BY clicks DESC, a.id ASC
      LIMIT 5
    `,
    [issueId]
  );

  const recipients = recipientsRow?.count || 0;
  const opens = opensRow?.count || 0;

  return {
    recipients,
    opens,
    clicks: clicksRow?.count || 0,
    openRate: recipients ? Math.round((opens / recipients) * 100) : 0,
    topLinks,
  };
}

module.exports = {
  trackEvent,
  getIssueStats,
};
