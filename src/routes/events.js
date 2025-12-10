const express = require("express");
const router = express.Router();
const { createEvent, getAllEvents, joinEvent, getSport , getUserEvents, getEventParticipants, cancelJoinEvent} = require("../controllers/eventController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createEvent);
router.get("/all", verifyToken, getAllEvents);
router.post("/join", verifyToken, joinEvent);
router.get("/sports", verifyToken, getSport);
router.get("/user/:userId", verifyToken, getUserEvents);
router.get("/:eventId/participantes", verifyToken, getEventParticipants);
router.delete("/:id_evento/cancelar", verifyToken, cancelJoinEvent);


module.exports = router;
