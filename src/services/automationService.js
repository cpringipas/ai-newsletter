const cron = require("node-cron");
const config = require("../config");
const { fetchAndStoreArticles, createOrUpdateTodayIssue } = require("./issueService");
const { sendIssueToSubscribers } = require("./emailService");

async function runDailyPipeline() {
  await fetchAndStoreArticles();
  const issue = await createOrUpdateTodayIssue();
  await sendIssueToSubscribers(issue);
  return issue;
}

function startScheduler() {
  cron.schedule(
    config.dailySchedule,
    async () => {
      try {
        await runDailyPipeline();
        console.log("Daily newsletter pipeline completed.");
      } catch (error) {
        console.error("Daily newsletter pipeline failed:", error);
      }
    },
    {
      timezone: config.timezone,
    }
  );
}

module.exports = {
  runDailyPipeline,
  startScheduler,
};
