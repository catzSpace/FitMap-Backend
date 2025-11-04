const jwt = require("jsonwebtoken");
const checkRole = (rolesPermitidos) => {
  return async (req, res, next) => {

    // si no hay user en req => error
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // soporta role como string o number
    const userRoleRaw = req.user.role ?? req.user.rol ?? req.user.rol_id ?? req.user.role_id;

    // normalizamos a number si es posible
    const userRole = (typeof userRoleRaw === "string" && /^\d+$/.test(userRoleRaw))
      ? Number(userRoleRaw)
      : userRoleRaw;

    // si rolesPermitidos pueden ser strings o numbers, normalizamos a strings para comparar
    const permitStrings = rolesPermitidos.map(r => String(r));
    const userRoleStr = String(userRole);

    if (permitStrings.includes(userRoleStr)) {
      return next();
    }

    return res.status(403).json({ mensaje: "acceso denegado, usuario sin rol correspondiente" });
  };
};

module.exports = { checkRole };