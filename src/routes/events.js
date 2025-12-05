const express = require("express");
const router = express.Router();
const { createEvent, getAllEvents, joinEvent, getSport } = require("../controllers/eventController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createEvent);
router.get("/all", verifyToken, getAllEvents);
router.post("/join", verifyToken, joinEvent);
router.get("/sports", verifyToken, getSport);

module.exports = router;
