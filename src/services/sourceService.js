const { getDb } = require("../db");

async function listSources() {
  const db = await getDb();
  return db.all(`SELECT * FROM sources ORDER BY active DESC, name ASC`);
}

async function createSource({ name, url, type = "rss" }) {
  const db = await getDb();
  await db.run(`INSERT INTO sources (name, url, type, active) VALUES (?, ?, ?, 1)`, [
    name,
    url,
    type,
  ]);
}

async function toggleSource(id) {
  const db = await getDb();
  await db.run(`UPDATE sources SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?`, [
    id,
  ]);
}

module.exports = {
  listSources,
  createSource,
  toggleSource,
};

