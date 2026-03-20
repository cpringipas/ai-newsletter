const dayjs = require("dayjs");

function formatGreekDate(dateValue) {
  return dayjs(dateValue).format("DD/MM/YYYY");
}

function safeJsonParse(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

module.exports = {
  formatGreekDate,
  safeJsonParse,
  stripHtml,
};

