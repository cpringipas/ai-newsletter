const express = require("express");
const { subscribe, getSubscriberByReferralCode } = require("../services/subscriberService");
const {
  listIssues,
  getIssueWithStoriesBySlug,
  getIssueWithStoriesById,
} = require("../services/issueService");
const { listSources } = require("../services/sourceService");
const { trackEvent } = require("../services/trackingService");
const config = require("../config");
const { getDb } = require("../db");

const router = express.Router();
const trackingPixel = Buffer.from(
  "47494638396101000100800000ffffff00000021f90401000001002c00000000010001000002024401003b",
  "hex"
);

router.get("/", async (req, res) => {
  const issues = await listIssues();
  const referrer = req.query.ref
    ? await getSubscriberByReferralCode(String(req.query.ref))
    : null;

  res.render("index", {
    config,
    issues,
    message: req.query.message || "",
    referralCode: req.query.ref || "",
    referrer,
  });
});

router.post("/subscribe", async (req, res) => {
  const email = String(req.body.email || "").trim();
  const referralCode = String(req.body.referralCode || "").trim();
  if (!email || !email.includes("@")) {
    return res.redirect("/?message=Παρακαλώ βάλε ένα έγκυρο email.");
  }

  await subscribe(email, referralCode);
  const query = referralCode ? `&ref=${encodeURIComponent(referralCode)}` : "";
  res.redirect(`/?message=Η εγγραφή ολοκληρώθηκε.${query}`);
});

router.get("/archive", async (req, res) => {
  const issues = await listIssues();
  res.render("archive", { config, issues });
});

router.get("/issues/:slug", async (req, res) => {
  const data = await getIssueWithStoriesBySlug(req.params.slug);
  if (!data) {
    return res.status(404).send("Issue not found");
  }

  res.render("issue", {
    config,
    issue: data.issue,
    stories: data.stories,
    referralCode: req.query.ref || "",
    shareUrl: `${config.baseUrl}/issues/${data.issue.slug}${req.query.ref ? `?ref=${encodeURIComponent(req.query.ref)}` : ""}`,
  });
});

router.get("/t/open/:issueId/:subscriberId.gif", async (req, res) => {
  await trackEvent({
    issueId: Number(req.params.issueId),
    subscriberId: Number(req.params.subscriberId),
    eventType: "open",
    metadata: { userAgent: req.headers["user-agent"] || "" },
  });

  res.set("Content-Type", "image/gif");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.send(trackingPixel);
});

router.get("/t/click/:issueId/:subscriberId/:articleId", async (req, res) => {
  const issueId = Number(req.params.issueId);
  const subscriberId = Number(req.params.subscriberId);
  const articleId = Number(req.params.articleId);
  const db = await getDb();
  const article = await db.get(`SELECT url FROM articles WHERE id = ?`, [articleId]);

  await trackEvent({
    issueId,
    subscriberId,
    articleId,
    eventType: "click",
    metadata: { ip: req.ip || "", userAgent: req.headers["user-agent"] || "" },
  });

  res.redirect(article?.url || config.baseUrl);
});

router.get("/r/:code", async (req, res) => {
  const subscriber = await getSubscriberByReferralCode(req.params.code);
  if (!subscriber) {
    return res.redirect("/");
  }
  res.redirect(`/?ref=${encodeURIComponent(subscriber.referral_code)}`);
});

router.get("/sources", async (req, res) => {
  const sources = await listSources();
  res.json(sources);
});

module.exports = router;
