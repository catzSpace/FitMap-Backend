const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");

// Crear usuario
router.post("/create", registerUser);

// Login usuario
router.post("/login", loginUser);

// datos del usuario
router.post("/profile", getUserProfile);

module.exports = router;
