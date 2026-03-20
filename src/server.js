const express = require("express");
const path = require("path");
const config = require("./config");
const { initDb } = require("./db");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { startScheduler } = require("./services/automationService");
const { formatGreekDate } = require("./utils/format");

async function bootstrap() {
  await initDb();

  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.locals.formatGreekDate = formatGreekDate;
  app.locals.site = config;

  app.use("/", publicRoutes);
  app.use("/admin", adminRoutes);

  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });

  startScheduler();
}

bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

