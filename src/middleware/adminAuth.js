const config = require("../config");

function adminAuth(req, res, next) {
  const token = req.query.token || req.headers["x-admin-token"] || req.body.token;
  if (token !== config.adminToken) {
    return res.status(401).send("Unauthorized");
  }
  res.locals.adminToken = token;
  next();
}

module.exports = {
  adminAuth,
};

