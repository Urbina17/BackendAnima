const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("../utils/tokenBlacklist");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  if (isBlacklisted(token)) {
    return res.status(403).json({ message: "Token inválido o cerrado (logout)" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verificando token:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};

