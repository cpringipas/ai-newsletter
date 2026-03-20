const crypto = require("crypto");
const { getDb } = require("../db");

function createReferralCode() {
  return crypto.randomBytes(4).toString("hex");
}

async function ensureReferralCode(db, subscriber) {
  if (subscriber.referral_code) {
    return subscriber.referral_code;
  }

  let code = createReferralCode();
  let exists = await db.get(`SELECT id FROM subscribers WHERE referral_code = ?`, [code]);
  while (exists) {
    code = createReferralCode();
    exists = await db.get(`SELECT id FROM subscribers WHERE referral_code = ?`, [code]);
  }

  await db.run(`UPDATE subscribers SET referral_code = ? WHERE id = ?`, [code, subscriber.id]);
  return code;
}

async function subscribe(email, referralCode = "") {
  const db = await getDb();
  const normalizedEmail = email.toLowerCase();
  const referrer = referralCode
    ? await db.get(`SELECT id FROM subscribers WHERE referral_code = ?`, [referralCode])
    : null;

  await db.run(
    `
      INSERT INTO subscribers (email, active, referral_code, referred_by_subscriber_id)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        active = 1,
        referred_by_subscriber_id = COALESCE(subscribers.referred_by_subscriber_id, excluded.referred_by_subscriber_id)
    `,
    [normalizedEmail, createReferralCode(), referrer?.id || null]
  );

  const subscriber = await db.get(`SELECT * FROM subscribers WHERE email = ?`, [normalizedEmail]);
  const ensuredCode = await ensureReferralCode(db, subscriber);
  return { ...subscriber, referral_code: ensuredCode };
}

async function getSubscriberById(id) {
  const db = await getDb();
  return db.get(`SELECT * FROM subscribers WHERE id = ?`, [id]);
}

async function getSubscriberByReferralCode(referralCode) {
  const db = await getDb();
  return db.get(`SELECT * FROM subscribers WHERE referral_code = ?`, [referralCode]);
}

async function getTopReferrers(limit = 10) {
  const db = await getDb();
  return db.all(
    `
      SELECT s.email, s.referral_code, COUNT(child.id) AS referral_count
      FROM subscribers s
      LEFT JOIN subscribers child ON child.referred_by_subscriber_id = s.id
      GROUP BY s.id
      ORDER BY referral_count DESC, s.created_at ASC
      LIMIT ?
    `,
    [limit]
  );
}

module.exports = {
  subscribe,
  getSubscriberById,
  getSubscriberByReferralCode,
  getTopReferrers,
};
