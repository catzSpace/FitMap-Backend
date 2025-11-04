const express = require("express");
const router = express.Router();
const { createEvent, getAllEvents, joinEvent } = require("../controllers/eventController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkroleMiddleware");//se trae la funcion para verificar el rol

router.post("/create", verifyToken,checkRole(["2","3"]), createEvent); //se incluye la funcion de verificar si cumple deja continuar con la funcion
router.get("/all", verifyToken, getAllEvents);
router.post("/join", verifyToken, joinEvent);

module.exports = router;
