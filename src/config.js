const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const rootDir = path.resolve(__dirname, "..");

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  newsletterName: process.env.NEWSLETTER_NAME || "AI Simera",
  newsletterTagline:
    process.env.NEWSLETTER_TAGLINE ||
    "Καθημερινά πρακτικά νέα AI στα ελληνικά",
  newsletterDescription:
    process.env.NEWSLETTER_DESCRIPTION ||
    "Καθημερινό newsletter AI για επιχειρήσεις, εκπαιδευτικούς και δημιουργούς.",
  adminToken: process.env.ADMIN_TOKEN || "change-me",
  databasePath: path.resolve(
    rootDir,
    process.env.DATABASE_PATH || "./data/newsletter.sqlite"
  ),
  dailySchedule: process.env.DAILY_SCHEDULE || "0 8 * * *",
  timezone: process.env.TIMEZONE || "Europe/Athens",
  defaultFromEmail:
    process.env.DEFAULT_FROM_EMAIL || "AI Simera <newsletter@example.com>",
  emailProvider: process.env.EMAIL_PROVIDER || "smtp",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  resendApiKey: process.env.RESEND_API_KEY || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "",
  maxStoriesPerIssue: Number(process.env.MAX_STORIES_PER_ISSUE || 7),
};

