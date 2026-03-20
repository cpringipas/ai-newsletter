const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const config = require("../config");
const { getDb } = require("../db");
const { renderPersonalizedEmail } = require("./newsletterRenderer");
const { getIssueWithStoriesById } = require("./issueService");

function getTransport() {
  if (config.emailProvider === "resend" && config.resendApiKey) {
    return { type: "resend", client: new Resend(config.resendApiKey) };
  }

  if (!config.smtp.host) {
    return null;
  }

  return {
    type: "smtp",
    client: nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? {
            user: config.smtp.user,
            pass: config.smtp.pass,
          }
        : undefined,
    }),
  };
}

async function getActiveSubscribers() {
  const db = await getDb();
  return db.all(
    `
      SELECT s.*,
             COUNT(child.id) AS referral_count
      FROM subscribers s
      LEFT JOIN subscribers child ON child.referred_by_subscriber_id = s.id
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `
  );
}

async function logSend(issueId, email, provider, status, errorMessage = null) {
  const db = await getDb();
  await db.run(
    `
      INSERT INTO send_logs (issue_id, subscriber_email, provider, status, error_message)
      VALUES (?, ?, ?, ?, ?)
    `,
    [issueId, email, provider, status, errorMessage]
  );
}

async function sendIssueToSubscribers(issue) {
  const transport = getTransport();
  if (!transport) {
    throw new Error("Email provider is not configured.");
  }

  const issueData = await getIssueWithStoriesById(issue.id);
  const subscribers = await getActiveSubscribers();

  for (const subscriber of subscribers) {
    const personalized = renderPersonalizedEmail({
      issue: issueData.issue,
      stories: issueData.stories,
      subscriber,
    });

    try {
      if (transport.type === "resend") {
        await transport.client.emails.send({
          from: config.defaultFromEmail,
          to: subscriber.email,
          subject: personalized.subject,
          html: personalized.html,
          text: personalized.text,
        });
      } else {
        await transport.client.sendMail({
          from: config.defaultFromEmail,
          to: subscriber.email,
          subject: personalized.subject,
          html: personalized.html,
          text: personalized.text,
        });
      }

      await logSend(issue.id, subscriber.email, transport.type, "sent");
    } catch (error) {
      await logSend(issue.id, subscriber.email, transport.type, "failed", error.message);
    }
  }

  const db = await getDb();
  await db.run(`UPDATE issues SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?`, [
    issue.id,
  ]);

  return subscribers.length;
}

module.exports = {
  sendIssueToSubscribers,
  getActiveSubscribers,
};
