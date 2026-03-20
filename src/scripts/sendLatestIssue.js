const { initDb } = require("../db");
const { getLatestIssue } = require("../services/issueService");
const { sendIssueToSubscribers } = require("../services/emailService");

async function run() {
  await initDb();
  const issue = await getLatestIssue();
  if (!issue) {
    throw new Error("No issue found.");
  }
  await sendIssueToSubscribers(issue);
  console.log(`Sent issue: ${issue.title}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
