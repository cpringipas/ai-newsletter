const axios = require("axios");
const Parser = require("rss-parser");
const { stripHtml } = require("../utils/format");

const parser = new Parser({
  timeout: 15000,
});

async function fetchFeed(source) {
  const response = await axios.get(source.url, {
    timeout: 15000,
    headers: {
      "User-Agent": "AI-Newsletter-Bot/1.0",
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });
  const feed = await parser.parseString(response.data);

  return (feed.items || []).map((item) => ({
    sourceId: source.id,
    guid: item.guid || item.id || item.link,
    url: item.link,
    title: item.title || "Untitled",
    rawContent: stripHtml(
      item.contentSnippet || item.content || item.summary || item["content:encoded"] || ""
    ),
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
  }));
}

module.exports = {
  fetchFeed,
};
