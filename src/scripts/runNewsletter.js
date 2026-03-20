const { initDb } = require("../db");
const { runDailyPipeline } = require("../services/automationService");

async function run() {
  await initDb();
  const issue = await runDailyPipeline();
  console.log(`Newsletter generated: ${issue.title}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

