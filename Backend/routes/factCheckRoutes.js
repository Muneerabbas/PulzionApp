const express = require("express");
const router = express.Router();
const { factCheckArticle, factCheckClaims } = require("../services/factCheckService");

router.post("/", factCheckClaims);

module.exports = router;
