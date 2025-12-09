const express = require("express");
const multer = require("multer");
const path = require("path");
const { db } = require("../dbConnection");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

// configuración de multer
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Ruta para subir archivo y guardar en la base de datos
router.post("/", verifyToken, upload.single("document"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ningún archivo" });
  }

  try {
    const user_id = req.user.id;
    const nombre_archivo = req.file.originalname;
    const ruta_archivo = req.file.path;
    const nombre_usuario = req.body.user;

    // Guardar en MySQL
    await db.query(
      "INSERT INTO solicitudes_verificacion (id_user, user_name, ruta_pdf) VALUES (?, ?, ?)",
      [user_id, nombre_usuario, ruta_archivo]
    );

    res.json({
      message: "Archivo subido y guardado correctamente ✅",
      file: req.file,
    });
  } catch (error) {
    console.error("Error al guardar en la base de datos:", error);
    res.status(500).json({ message: "Error al guardar el archivo" });
  }
});

module.exports = router;
