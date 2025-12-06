const { db } = require("../dbConnection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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


module.exports = { registerUser, loginUser, getUserProfile};
