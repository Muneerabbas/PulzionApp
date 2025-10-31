const express = require("express");
const { sendCustomEmail } = require("../controllers/emailController.js");

const router = express.Router();

// POST /api/email/send
router.post("/send", sendCustomEmail);


module.exports = router; 