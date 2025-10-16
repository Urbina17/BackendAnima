export const logout = () => {
  // 1️⃣ Eliminar token del almacenamiento local
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");

  // 2️⃣ Eliminar cualquier dato de usuario almacenado
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");

  // 3️⃣ Redirigir al login
  window.location.href = "/login";
};
