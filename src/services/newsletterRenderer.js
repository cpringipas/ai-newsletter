const slugify = require("slugify");
const dayjs = require("dayjs");
const config = require("../config");
const { safeJsonParse } = require("../utils/format");

function buildStoryMarkup(article, index, linkHref) {
  const bullets = safeJsonParse(article.bullets_el, []);
  const useCases = safeJsonParse(article.use_cases_el, {});

  return `
    <section style="margin:0 0 32px 0;padding:24px;border:1px solid #d7dfd8;border-radius:18px;background:#ffffff;">
      <p style="margin:0 0 8px 0;color:#3e5c4f;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Θέμα ${index + 1}</p>
      <h2 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#183428;">${article.ai_title_el || article.title}</h2>
      <ul style="padding-left:18px;color:#28453a;">
        ${bullets.map((bullet) => `<li style="margin-bottom:8px;">${bullet}</li>`).join("")}
      </ul>
      <p style="margin:16px 0 8px 0;font-weight:700;color:#183428;">Γιατί έχει σημασία</p>
      <p style="margin:0 0 16px 0;color:#28453a;">${article.why_matters_el || ""}</p>
      <p style="margin:0 0 8px 0;font-weight:700;color:#183428;">Πώς μπορείς να το αξιοποιήσεις</p>
      <p style="margin:0 0 8px 0;color:#28453a;"><strong>Μικρές επιχειρήσεις:</strong> ${useCases.smallBusinesses || ""}</p>
      <p style="margin:0 0 8px 0;color:#28453a;"><strong>Εκπαιδευτικοί:</strong> ${useCases.teachers || ""}</p>
      <p style="margin:0 0 16px 0;color:#28453a;"><strong>Επιχειρηματίες:</strong> ${useCases.entrepreneurs || ""}</p>
      <a href="${linkHref}" style="color:#0a7a52;text-decoration:none;font-weight:700;">Δες την πηγή</a>
    </section>
  `;
}

function buildStoriesText(stories) {
  return stories
    .map((story, index) => {
      const bullets = safeJsonParse(story.bullets_el, []);
      const useCases = safeJsonParse(story.use_cases_el, {});
      return [
        `ΘΕΜΑ ${index + 1}: ${story.ai_title_el || story.title}`,
        ...bullets.map((item) => `- ${item}`),
        `Γιατί έχει σημασία: ${story.why_matters_el || ""}`,
        `Μικρές επιχειρήσεις: ${useCases.smallBusinesses || ""}`,
        `Εκπαιδευτικοί: ${useCases.teachers || ""}`,
        `Επιχειρηματίες: ${useCases.entrepreneurs || ""}`,
        `Πηγή: ${story.url}`,
      ].join("\n");
    })
    .join("\n\n");
}

function renderIssue({ issueDate, intro, curiosityHook, toolOfDay, ideaOfDay, shareCta, stories }) {
  const issueTitle = `${config.newsletterName} | ${dayjs(issueDate).format("DD/MM/YYYY")}`;
  const slug = slugify(`${config.newsletterName}-${issueDate}`, { lower: true, strict: true });
  const archiveUrl = `${config.baseUrl}/issues/${slug}`;
  const storiesHtml = stories
    .map((story, index) => buildStoryMarkup(story, index, story.url))
    .join("");

  return {
    title: issueTitle,
    slug,
    html: `
      <div style="margin:0;padding:32px;background:#eef5ef;font-family:Georgia, 'Times New Roman', serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${curiosityHook || ""}</div>
        <div style="max-width:760px;margin:0 auto;">
          <header style="padding:32px;border-radius:24px;background:linear-gradient(135deg,#183428,#2b6a4f);color:#f8fff9;margin-bottom:24px;">
            <p style="margin:0 0 10px 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">${config.newsletterTagline}</p>
            <h1 style="margin:0 0 12px 0;font-size:42px;line-height:1.1;">${config.newsletterName}</h1>
            <p style="margin:0 0 12px 0;font-size:17px;line-height:1.5;color:#d9f0e5;">${curiosityHook || ""}</p>
            <p style="margin:0;font-size:18px;line-height:1.6;">${intro}</p>
          </header>
          ${storiesHtml}
          <section style="display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:24px;">
            <div style="padding:20px;border-radius:18px;background:#f7e9cc;color:#3f3117;">
              <h3 style="margin:0 0 8px 0;">Εργαλείο της ημέρας</h3>
              <p style="margin:0;">${toolOfDay}</p>
            </div>
            <div style="padding:20px;border-radius:18px;background:#dcefe5;color:#1c3f31;">
              <h3 style="margin:0 0 8px 0;">Ιδέα της ημέρας</h3>
              <p style="margin:0;">${ideaOfDay}</p>
            </div>
            <div style="padding:20px;border-radius:18px;background:#183428;color:#f8fff9;">
              <h3 style="margin:0 0 8px 0;">Μοιράσου το</h3>
              <p style="margin:0 0 12px 0;">${shareCta}</p>
              <a href="${archiveUrl}" style="color:#f7e9cc;text-decoration:none;font-weight:700;">Άνοιγμα online έκδοσης</a>
            </div>
          </section>
        </div>
      </div>
    `,
    text: [
      issueTitle,
      "",
      curiosityHook || "",
      intro,
      "",
      `Εργαλείο της ημέρας: ${toolOfDay}`,
      `Ιδέα της ημέρας: ${ideaOfDay}`,
      `Μοιράσου το: ${shareCta}`,
      `Online έκδοση: ${archiveUrl}`,
      "",
      buildStoriesText(stories),
    ].join("\n"),
  };
}

function renderPersonalizedEmail({ issue, stories, subscriber }) {
  const referralUrl = `${config.baseUrl}/?ref=${subscriber.referral_code}`;
  const shareUrl = `${config.baseUrl}/issues/${issue.slug}?ref=${subscriber.referral_code}`;
  const openPixelUrl = `${config.baseUrl}/t/open/${issue.id}/${subscriber.id}.gif`;
  const storiesHtml = stories
    .map((story, index) =>
      buildStoryMarkup(
        story,
        index,
        `${config.baseUrl}/t/click/${issue.id}/${subscriber.id}/${story.id}`
      )
    )
    .join("");

  return {
    subject: issue.subject_line_el || issue.title,
    html: `
      <div style="margin:0;padding:32px;background:#eef5ef;font-family:Georgia, 'Times New Roman', serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${issue.curiosity_hook_el || ""}</div>
        <div style="max-width:760px;margin:0 auto;">
          <header style="padding:32px;border-radius:24px;background:linear-gradient(135deg,#183428,#2b6a4f);color:#f8fff9;margin-bottom:24px;">
            <p style="margin:0 0 10px 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">${config.newsletterTagline}</p>
            <h1 style="margin:0 0 12px 0;font-size:42px;line-height:1.1;">${config.newsletterName}</h1>
            <p style="margin:0 0 12px 0;font-size:17px;line-height:1.5;color:#d9f0e5;">${issue.curiosity_hook_el || ""}</p>
            <p style="margin:0;font-size:18px;line-height:1.6;">${issue.intro_el || ""}</p>
          </header>
          ${storiesHtml}
          <section style="display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:24px;">
            <div style="padding:20px;border-radius:18px;background:#f7e9cc;color:#3f3117;">
              <h3 style="margin:0 0 8px 0;">Εργαλείο της ημέρας</h3>
              <p style="margin:0;">${issue.tool_of_day_el || ""}</p>
            </div>
            <div style="padding:20px;border-radius:18px;background:#dcefe5;color:#1c3f31;">
              <h3 style="margin:0 0 8px 0;">Ιδέα της ημέρας</h3>
              <p style="margin:0;">${issue.idea_of_day_el || ""}</p>
            </div>
            <div style="padding:20px;border-radius:18px;background:#183428;color:#f8fff9;">
              <h3 style="margin:0 0 8px 0;">Μοιράσου το newsletter</h3>
              <p style="margin:0 0 12px 0;">${issue.share_cta_el || ""}</p>
              <p style="margin:0 0 8px 0;">Το προσωπικό σου link:</p>
              <a href="${shareUrl}" style="display:block;color:#f7e9cc;text-decoration:none;font-weight:700;margin-bottom:10px;">${shareUrl}</a>
              <a href="${referralUrl}" style="color:#ffffff;text-decoration:none;font-weight:700;">Invite friends</a>
            </div>
          </section>
        </div>
        <img src="${openPixelUrl}" alt="" width="1" height="1" style="display:block;border:0;opacity:0;" />
      </div>
    `,
    text: [
      issue.subject_line_el || issue.title,
      "",
      issue.curiosity_hook_el || "",
      issue.intro_el || "",
      "",
      `Εργαλείο της ημέρας: ${issue.tool_of_day_el || ""}`,
      `Ιδέα της ημέρας: ${issue.idea_of_day_el || ""}`,
      `Μοιράσου το: ${issue.share_cta_el || ""}`,
      `Προσωπικό referral link: ${referralUrl}`,
      `Online έκδοση: ${shareUrl}`,
      "",
      buildStoriesText(stories),
    ].join("\n"),
  };
}

module.exports = {
  renderIssue,
  renderPersonalizedEmail,
};
