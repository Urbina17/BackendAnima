// Manejador básico de tokens inválidos (solo en memoria)
const blacklist = new Set();

exports.addToken = (token) => {
  blacklist.add(token);
};

exports.isBlacklisted = (token) => {
  return blacklist.has(token);
};
