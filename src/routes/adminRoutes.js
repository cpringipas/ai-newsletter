const express = require("express");
const { adminAuth } = require("../middleware/adminAuth");
const { listSources, createSource, toggleSource } = require("../services/sourceService");
const {
  fetchAndStoreArticles,
  createOrUpdateTodayIssue,
  getLatestIssue,
  getLatestIssueDashboard,
} = require("../services/issueService");
const { sendIssueToSubscribers, getActiveSubscribers } = require("../services/emailService");
const { getTopReferrers } = require("../services/subscriberService");

const router = express.Router();

router.use(adminAuth);

router.get("/", async (req, res) => {
  const [sources, latestIssue, subscribers, latestDashboard, topReferrers] = await Promise.all([
    listSources(),
    getLatestIssue(),
    getActiveSubscribers(),
    getLatestIssueDashboard(),
    getTopReferrers(8),
  ]);

  res.render("admin", {
    sources,
    latestIssue,
    subscribers,
    latestDashboard,
    topReferrers,
    message: req.query.message || "",
    token: res.locals.adminToken,
  });
});

router.post("/sources", async (req, res) => {
  await createSource({ name: req.body.name, url: req.body.url, type: "rss" });
  res.redirect(`/admin?token=${res.locals.adminToken}&message=Η πηγή προστέθηκε.`);
});

router.post("/sources/:id/toggle", async (req, res) => {
  await toggleSource(req.params.id);
  res.redirect(`/admin?token=${res.locals.adminToken}&message=Η πηγή ενημερώθηκε.`);
});

router.post("/preview", async (req, res) => {
  await fetchAndStoreArticles();
  await createOrUpdateTodayIssue();
  res.redirect(`/admin?token=${res.locals.adminToken}&message=Το preview δημιουργήθηκε.`);
});

router.post("/send", async (req, res) => {
  await fetchAndStoreArticles();
  const issue = await createOrUpdateTodayIssue();
  await sendIssueToSubscribers(issue);
  res.redirect(`/admin?token=${res.locals.adminToken}&message=Το newsletter στάλθηκε.`);
});

router.post("/send-latest", async (req, res) => {
  const issue = await getLatestIssue();
  if (issue) {
    await sendIssueToSubscribers(issue);
  }
  res.redirect(`/admin?token=${res.locals.adminToken}&message=Η τελευταία έκδοση στάλθηκε.`);
});

module.exports = router;
