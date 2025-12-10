const { db } = require("../dbConnection");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const path = require("path");

async function registerUser(req, res) {
  try {
    const { nombres, apellidos, cedula, email, password, fechaNacimiento } = req.body;

    if (!nombres || !email || !password)
      return res.status(400).json({ error: "Campos obligatorios faltantes" });

    const [exist] = await db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (exist.length > 0)
      return res.status(409).json({ error: "Correo ya registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombres, apellidos, id_rol, cedula, email, password, fecha_nacimiento)
       VALUES (?, ?, ?, ?,?, ?, ?)`,
      [nombres, apellidos, 2, cedula, email, hashedPassword, fechaNacimiento]
    );

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ userId: result.insertId, 
                            rol: 2,
                            token });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}


async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (rows.length === 0)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const rol = user.id_rol;

    res.json({ userId: user.id, token, rol});
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}

async function getUserProfile(req, res) {
  try {
    const userId = req.body.user;
    const [rows] = await db.query("SELECT id, nombres, apellidos, id_rol, cedula, email, fecha_nacimiento FROM usuarios WHERE id = ?", [userId]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}




async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [notifications] = await db.query(
      "SELECT * FROM notificaciones WHERE id_user = ?",
      [userId]
    );

    const [notifications_events] = await db.query(
      "SELECT * FROM notificaciones_eventos WHERE id_user = ?",
      [userId]
    );

    const allNotifications = [...notifications, ...notifications_events];


    res.json(allNotifications);
  } catch (error) {
    console.error("Error al obtener las notificaciones:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

async function getNotiUnread(req, res) {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      "SELECT COUNT(*) AS count FROM notificaciones WHERE id_user = ? AND isread = 1",
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error("Error al obtener notificaciones no leídas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};


async function verifyUser(req, res) {
  try {
    const { user } = req.body;
    const userId = user.id;
    const solicitudId = req.body.solicitudId;

    const updateResult = await db.query(
      "UPDATE usuarios SET id_rol = ? WHERE id = ?", 
      [3, userId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }


    const deleteResult = await db.query(
      "DELETE FROM solicitudes_verificacion WHERE id = ?", 
      [solicitudId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada o ya eliminada" });
    }


    const message = "¡Tu solicitud de verificación ha sido aceptada!";

    const notificationResult = await db.query(
      "INSERT INTO notificaciones (id_user, mensaje, isread) VALUES (?, ?, ?)",
      [userId, message, 1]
    );

    res.json({ message: "Rol del usuario actualizado" });
  } catch (error) {
    console.error("Error al verificar al usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}

async function rejectVerifyUser(req, res) {
  try {
    const { user } = req.body;
    const userId = user.id;
    const solicitudId = req.body.solicitudId;
    
    const deleteResult = await db.query(
      "DELETE FROM solicitudes_verificacion WHERE id = ?", 
      [solicitudId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada o ya eliminada" });
    }


    const message = "Tu solicitud de verificación ha sido rechazada";

    const notificationResult = await db.query(
      "INSERT INTO notificaciones (id_user, mensaje, isread) VALUES (?, ?, ?)",
      [userId, message, 1]
    );

    res.json({ message: "Rol del usuario no actuazlizado" });
  } catch (error) {
    console.error("Error al verificar al usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
}


async function getUserVerification(req, res) {
  try {
    const [solicitudes] = await db.query("SELECT * FROM solicitudes_verificacion");
    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    res.status(500).json({ error: "Error al obtener las solicitudes" });
  }
}

async function getPdf(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../../uploads", filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error al enviar el archivo:", err);
      res.status(404).send({ message: "Archivo no encontrado" });
    }
  });
}


module.exports = { registerUser, 
                    loginUser, 
                    getUserProfile, 
                    getUserVerification, 
                    verifyUser, rejectVerifyUser, getPdf,
                    getNotiUnread, getNotifications};
