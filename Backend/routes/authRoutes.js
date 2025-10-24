const express = require('express');
const { registerUser, loginUser, upload } = require('../controllers/authController');

const router = express.Router();

router.post('/register', upload.single('photo'), registerUser);
router.post('/login', loginUser);

module.exports = router;