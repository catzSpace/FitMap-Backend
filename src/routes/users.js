const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");

// Crear usuario
router.post("/create", registerUser);

// Login usuario
router.post("/login", loginUser);

module.exports = router;
