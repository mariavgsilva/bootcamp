const express = require('express');
const { registerUser, loginUser } = require('../services/authService');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
