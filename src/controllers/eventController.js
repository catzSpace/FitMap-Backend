const { db } = require("../dbConnection");

async function createEvent(req, res) {
  try {
    const { nombre, fecha, hora, descripcion, deporte, ubicacion } = req.body;
    const id_organizador = req.user.id;

    const [result] = await db.query(
      `INSERT INTO eventos (nombre, id_organizador, fecha, hora, descripcion, deporte, ubicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        id_organizador,
        fecha,
        hora,
        descripcion,
        deporte,
        JSON.stringify(ubicacion),
      ]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}

const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM eventos");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ error: "Error al obtener eventos" });
  }
};


const joinEvent = async (req, res) => {
  try {
    const { id_evento } = req.body;
    const id_participante = req.user.id; 


    if (!id_evento || !id_participante) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const [existing] = await db.query(
      "SELECT * FROM inscripcion_evento WHERE id_participante = ? AND id_evento = ?",
      [id_participante, id_evento]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Ya estás inscrito en este evento" });
    }

    await db.query(
      "INSERT INTO inscripcion_evento (id_participante, id_evento) VALUES (?, ?)",
      [id_participante, id_evento]
    );

    res.status(201).json({ message: "Inscripción exitosa" });
  } catch (error) {
    console.error("Error al inscribirse en el evento:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


module.exports = { createEvent, getAllEvents, joinEvent };
