const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { registerUser, 
        loginUser,
        getUserProfile, 
        getUserVerification, 
        verifyUser,rejectVerifyUser,
        getPdf, getNotiUnread,
        getNotifications} = require("../controllers/userController");

// Crear usuario
router.post("/create", registerUser);

// Login usuario
router.post("/login", loginUser);

// datos del usuario
router.post("/profile", getUserProfile);

// solicitudes de verificacion
router.get("/verification", getUserVerification);

router.post("/verify", verifyUser);

router.post("/verify/reject", rejectVerifyUser);

router.get("/pdf/:filename", getPdf);

router.get("/notifications/unread", verifyToken, getNotiUnread);

router.get("/notifications", verifyToken, getNotifications);

module.exports = router;
