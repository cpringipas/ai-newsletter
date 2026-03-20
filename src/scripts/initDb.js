const { initDb } = require("../db");

initDb()
  .then(() => {
    console.log("Database initialized.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

