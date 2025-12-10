const { db } = require("../dbConnection");


async function getSport(req, res) {
  try {
    let deportes = await db.query("SELECT * FROM deportes");
    res.json(deportes);
  } catch (error) {
    console.log("Error al obtener deportes", error)
  }
}


async function createEvent(req, res) {
  try {
    const { 
      nombre, 
      fecha, 
      hora, 
      descripcion, 
      deporte, 
      ubicacion,
      costos,
      cupos,
      requisitos
    } = req.body;

    const id_organizador = req.user.id;

    // Valores por defecto si no se envían desde el formulario
    const costosFinal = costos ?? 0;
    const cuposFinal = (cupos == '' || cupos == null) ? -1 : cupos;
    const requisitosFinal = requisitos ?? "no hay requisitos";

    const [result] = await db.query(
      `INSERT INTO eventos 
        (nombre, id_organizador, fecha, hora, descripcion, costos, cupos, requisitos, deporte, ubicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        id_organizador,
        fecha,
        hora,
        descripcion,
        costosFinal,
        cuposFinal,
        requisitosFinal,
        deporte,
        ubicacion
      ]
    );

    res.status(201).json({ id: result.insertId });

  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}


const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;

    const [rows] = await db.query(`
      SELECT u.id, u.nombres, u.email
      FROM inscripcion_evento ie
      JOIN usuarios u ON ie.id_participante = u.id
      WHERE ie.id_evento = ?
    `, [eventId]);

    res.json(rows);

  } catch (error) {
    console.error("Error al obtener participantes:", error);
    res.status(500).json({ error: "Error al obtener participantes" });
  }
};



const getAllEvents = async (req, res) => {
  try {
    const id_usuario = req.user.id;

    // Obtener eventos
    const [rows] = await db.query("SELECT * FROM eventos");

    // Obtener nombres de organizadores
    const [usrs] = await db.query("SELECT id, nombres FROM usuarios");

    // Obtener todas las inscripciones del usuario actual
    const [inscripciones] = await db.query(
      "SELECT id_evento FROM inscripcion_evento WHERE id_participante = ?",
      [id_usuario]
    );

    // Convertir a set para búsquedas rápidas
    const inscritoSet = new Set(inscripciones.map(i => i.id_evento));

    // Enriquecer los eventos con nombre del organizador + estado de inscripción
    const eventos = rows.map(evento => {
      const organizador = usrs.find(user => user.id === evento.id_organizador);

      return {
        ...evento,
        nombre_organizador: organizador ? organizador.nombres : 'Desconocido',
        estas_inscrito: inscritoSet.has(evento.id),   // <--- AQUI ESTA LO NUEVO
      };
    });

    res.json(eventos);

  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ error: "Error al obtener eventos" });
  }
};


const getUserEvents = async (req, res) => {
  try {
    const { userId } = req.params;  
    const [rows] = await db.query("SELECT * FROM eventos WHERE id_organizador = ?", [userId]);
  
    let [usrs] = await db.query("SELECT id, nombres FROM usuarios");

    const eventos = rows.map(evento => {
      const organizador = usrs.find(user => user.id === evento.id_organizador);
      return { 
        ...evento, 
        nombre_organizador: organizador ? organizador.nombres : 'Desconocido' 
      };
    });
    res.json(eventos);
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

    // 1. Validar si ya está inscrito
    const [existing] = await db.query(
      "SELECT * FROM inscripcion_evento WHERE id_participante = ? AND id_evento = ?",
      [id_participante, id_evento]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Ya estás inscrito en este evento" });
    }

    // 2. Revisar cupos del evento (la columna correcta es id)
    const [cuposRows] = await db.query(
      "SELECT cupos FROM eventos WHERE id = ?",
      [id_evento]
    );

    if (cuposRows.length === 0) {
      return res.status(404).json({ message: "El evento no existe" });
    }

    const cupos = cuposRows[0].cupos;

    // Cupos ilimitados
    if (cupos === -1) {
      // simplemente inserta la inscripción
      await db.query(
        "INSERT INTO inscripcion_evento (id_participante, id_evento) VALUES (?, ?)",
        [id_participante, id_evento]
      );

      return res.status(201).json({ message: "Inscripción exitosa" });
    }

    // Cupos limitados
    if (cupos === 0) {
      return res.status(400).json({ message: "No quedan cupos disponibles" });
    }

    // 3. Insertar inscripción
    await db.query(
      "INSERT INTO inscripcion_evento (id_participante, id_evento) VALUES (?, ?)",
      [id_participante, id_evento]
    );

    // 4. Restar cupo (CORREGIDO)
    await db.query(
      "UPDATE eventos SET cupos = cupos - 1 WHERE id = ?",
      [id_evento]
    );

    res.status(201).json({ message: "Inscripción exitosa" });

  } catch (error) {
    console.error("Error al inscribirse en el evento:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


const cancelJoinEvent = async (req, res) => {
  try {
    const { id_evento } = req.params;
    const id_participante = req.user.id;

    if (!id_evento || !id_participante) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    // 1. Verificar si estaba inscrito
    const [existing] = await db.query(
      "SELECT * FROM inscripcion_evento WHERE id_participante = ? AND id_evento = ?",
      [id_participante, id_evento]
    );

    if (existing.length === 0) {
      return res.status(400).json({ message: "No estabas inscrito en este evento" });
    }

    // 2. Eliminar inscripción
    await db.query(
      "DELETE FROM inscripcion_evento WHERE id_participante = ? AND id_evento = ?",
      [id_participante, id_evento]
    );

    // 3. Devolver cupo si no es ilimitado
    const [cuposRows] = await db.query(
      "SELECT cupos FROM eventos WHERE id = ?",
      [id_evento]
    );

    if (cuposRows.length > 0) {
      const cupos = cuposRows[0].cupos;

      if (cupos !== -1) {
        await db.query(
          "UPDATE eventos SET cupos = cupos + 1 WHERE id = ?",
          [id_evento]
        );
      }
    }

    return res.json({ message: "Inscripción cancelada correctamente" });

  } catch (error) {
    console.error("Error al cancelar inscripción:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

module.exports = { createEvent, getAllEvents, joinEvent, getSport, getUserEvents, getEventParticipants, cancelJoinEvent};
