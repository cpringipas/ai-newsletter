const OpenAI = require("openai");
const config = require("../config");

let client = null;

function getClient() {
  if (!config.openAiApiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: config.openAiApiKey,
      baseURL: config.openAiBaseUrl || undefined,
    });
  }

  return client;
}

function buildFallbackSummary(article) {
  const excerpt = (article.rawContent || "")
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  const bullets = excerpt.length
    ? excerpt.map((part) => part.slice(0, 150))
    : [
        "Η είδηση δείχνει ότι το AI μπαίνει πιο βαθιά σε καθημερινά εργαλεία.",
        "Δεν είναι κάτι μόνο για ειδικούς. Αφορά χρόνο, κόστος και πιο γρήγορη δουλειά.",
        "Αν το προσέξεις νωρίς, κερδίζεις ιδέες πριν το κάνουν όλοι οι άλλοι.",
      ];

  return {
    title: `Τι σημαίνει στην πράξη: ${article.title}`,
    bullets,
    whyItMatters:
      "Με απλά λόγια, αυτό είναι άλλο ένα σημάδι ότι το AI φεύγει από τις παρουσιάσεις και μπαίνει στην καθημερινή δουλειά.",
    useCases: {
      smallBusinesses:
        "Αν έχεις καφέ στη Λευκωσία, e-shop στη Λεμεσό ή μικρό γραφείο υπηρεσιών, σκέψου πώς αυτό μπορεί να σου κόψει χρόνο από απαντήσεις, αναρτήσεις ή οργάνωση.",
      teachers:
        "Αν διδάσκεις σε σχολείο ή φροντιστήριο στην Κύπρο, μπορείς να το δοκιμάσεις για φύλλα εργασίας, πιο απλές εξηγήσεις και διαφορετικές εκδοχές του ίδιου μαθήματος.",
      entrepreneurs:
        "Αν στήνεις νέα ιδέα ή startup, χρησιμοποίησέ το για δοκιμές landing pages, έρευνα ανταγωνισμού και πιο γρήγορα πρώτα drafts.",
    },
  };
}

async function summarizeArticle(article) {
  const openai = getClient();
  if (!openai) {
    return buildFallbackSummary(article);
  }

  const prompt = `
Είσαι πολύ καλός Έλληνας newsletter writer, όχι μεταφραστής μηχανής.
Γράφεις σαν έξυπνος άνθρωπος που εξηγεί AI σε φίλο 15 χρονών.

Κοινό:
- μικρές επιχειρήσεις
- εκπαιδευτικοί και σχολεία
- επιχειρηματίες
- έμφαση σε παραδείγματα από Κύπρο

Στυλ:
- απλά ελληνικά
- φυσικός ρυθμός
- ανθρώπινη φωνή
- λίγη προσωπικότητα και ελαφρύ χιούμορ
- όχι ξύλινο ύφος
- όχι ρομποτική μετάφραση αγγλικών φράσεων
- κάθε bullet να λέει κάτι χρήσιμο

Γύρισε ΜΟΝΟ έγκυρο JSON:
{
  "title": "string",
  "bullets": ["string", "string", "string", "string"],
  "whyItMatters": "string",
  "useCases": {
    "smallBusinesses": "string",
    "teachers": "string",
    "entrepreneurs": "string"
  }
}

Κανόνες:
- title: catchy αλλά καθαρό, σαν τίτλος newsletter
- bullets: 3 έως 5 bullets
- whyItMatters: 2 μικρές προτάσεις
- useCases: πολύ πρακτικά, με αληθινά παραδείγματα για Κύπρο όπου ταιριάζει
- απέφυγε jargon
- μην λες "το άρθρο αναφέρει"

Τίτλος άρθρου: ${article.title}
URL: ${article.url}
Κείμενο:
${article.rawContent || ""}
`;

    const response = await openai.chat.completions.create({
        model: config.openAiModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}

async function generateIssueExtras(stories) {
    const openai = getClient();
    if (!openai) {
        return {
            subjectLine: "AI σήμερα: 7 πράγματα που αξίζει να δεις πριν τα μάθουν όλοι",
            curiosityHook:
                "Ένα από τα σημερινά νέα μπορεί να γλιτώσει ώρες δουλειάς σε σχολείο, γραφείο ή μικρή επιχείρηση.",
            intro:
                "Σήμερα μαζέψαμε τις ειδήσεις AI που δεν είναι μόνο για tech κόσμο. Είναι για το γραφείο, την τάξη και τη μικρή επιχείρηση που θέλει να τρέχει πιο έξυπνα και με λιγότερο χάος.",
            toolOfDay:
                "Εργαλείο της ημέρας: πάρε ένα AI chatbot και ζήτα του να γράψει 3 εκδοχές για post, email ή ανακοίνωση. Είναι σαν να έχεις βοηθό, αλλά χωρίς διάλειμμα για καφέ.",
            ideaOfDay:
                "Ιδέα της ημέρας: διάλεξε μία εργασία που κάνεις κάθε μέρα στην επιχείρηση ή στο σχολείο και φτιάξε ένα prompt που να την κάνει σε 5 λεπτά αντί για 20.",
            shareCta:
                "Αν σου φάνηκε χρήσιμο, στείλ' το σε έναν φίλο που έχει μαγαζί, σχολική τάξη ή μια ιδέα που θέλει να τρέξει πιο γρήγορα.",
        };
    }

    const prompt = `
Είσαι συντάκτης viral αλλά ποιοτικού ελληνικού newsletter για AI.

Κοινό:
- μικρές επιχειρήσεις
- σχολεία και εκπαιδευτικοί
- επιχειρηματίες
- με αναφορές που ταιριάζουν σε Κύπρο

Γύρισε ΜΟΝΟ έγκυρο JSON:
{
  "subjectLine": "string",
  "curiosityHook": "string",
  "intro": "string",
  "toolOfDay": "string",
  "ideaOfDay": "string",
  "shareCta": "string"
}

Κανόνες:
- subjectLine: σύντομο, έξυπνο, με περιέργεια, στα ελληνικά
- curiosityHook: μία πρόταση που λειτουργεί σαν preheader
- intro: ανθρώπινο και απλό, όχι corporate
- toolOfDay και ideaOfDay: πρακτικά
- shareCta: να ενθαρρύνει share/referral χωρίς να ακούγεται πιεστικό
- μπορείς να βάλεις ελαφρύ χιούμορ

Θέματα:
${stories.map((story, index) => `${index + 1}. ${story.ai_title_el || story.title}`).join("\n")}
`;

    const response = await openai.chat.completions.create({
        model: config.openAiModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
}

module.exports = {
    summarizeArticle,
    generateIssueExtras,
};