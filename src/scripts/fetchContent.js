const { initDb } = require("../db");
const { fetchAndStoreArticles } = require("../services/issueService");

async function run() {
  await initDb();
  const articles = await fetchAndStoreArticles();
  console.log(`Fetched ${articles.length} articles.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

