const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const config = require("./config");

let dbPromise;

async function getDb() {
  if (!dbPromise) {
    const dir = path.dirname(config.databasePath);
    fs.mkdirSync(dir, { recursive: true });
    dbPromise = open({
      filename: config.databasePath,
      driver: sqlite3.Database,
    });
  }

  const db = await dbPromise;
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

async function addColumnIfMissing(db, tableName, columnName, definition) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function createIndexIfMissing(db, indexName, tableName, expression, unique = false) {
  const indexes = await db.all(`PRAGMA index_list(${tableName})`);
  const exists = indexes.some((index) => index.name === indexName);
  if (!exists) {
    await db.exec(
      `CREATE ${unique ? "UNIQUE " : ""}INDEX ${indexName} ON ${tableName} (${expression})`
    );
  }
}

async function initDb() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'rss',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      referral_code TEXT UNIQUE,
      referred_by_subscriber_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referred_by_subscriber_id) REFERENCES subscribers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER,
      guid TEXT,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      raw_content TEXT,
      summary_text TEXT,
      published_at TEXT,
      score REAL NOT NULL DEFAULT 0,
      ai_title_el TEXT,
      bullets_el TEXT,
      why_matters_el TEXT,
      use_cases_el TEXT,
      status TEXT NOT NULL DEFAULT 'fetched',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_date TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subject_line_el TEXT,
      curiosity_hook_el TEXT,
      intro_el TEXT,
      tool_of_day_el TEXT,
      idea_of_day_el TEXT,
      share_cta_el TEXT,
      html_content TEXT NOT NULL,
      text_content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issue_articles (
      issue_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (issue_id, article_id),
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS send_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      subscriber_email TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      subscriber_id INTEGER,
      article_id INTEGER,
      event_type TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
  `);

  await addColumnIfMissing(db, "subscribers", "referral_code", "TEXT");
  await addColumnIfMissing(db, "subscribers", "referred_by_subscriber_id", "INTEGER");
  await addColumnIfMissing(db, "issues", "subject_line_el", "TEXT");
  await addColumnIfMissing(db, "issues", "curiosity_hook_el", "TEXT");
  await addColumnIfMissing(db, "issues", "share_cta_el", "TEXT");
  await createIndexIfMissing(
    db,
    "idx_subscribers_referral_code_unique",
    "subscribers",
    "referral_code",
    true
  );

  const defaultSources = [
    ["TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"],
    ["OpenAI Blog", "https://openai.com/news/rss.xml"],
    ["MIT Technology Review AI", "https://www.technologyreview.com/topic/artificial-intelligence/feed/"],
    ["Google Blog AI", "https://blog.google/technology/ai/rss/"],
  ];

  for (const [name, url] of defaultSources) {
    await db.run(
      `INSERT OR IGNORE INTO sources (name, url, type, active) VALUES (?, ?, 'rss', 1)`,
      [name, url]
    );
  }

  return db;
}

module.exports = {
  getDb,
  initDb,
};
