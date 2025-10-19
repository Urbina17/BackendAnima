const express = require("express");
const querystring = require("querystring");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { getAppToken } = require("../utils/spotifyAuth");
require("dotenv").config();

const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// 1️⃣ Redirige al usuario al login de Spotify
router.get("/login", (req, res) => {
  const scope = "user-read-email playlist-read-private playlist-read-collaborative";
  const params = querystring.stringify({
    response_type: "code",
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// 2️⃣ Spotify redirige aquí con ?code=...
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  console.log("🎧 Código recibido de Spotify:", code);
  console.log("🔎 REDIRECT_URI usado:", REDIRECT_URI);

  if (!code) {
    console.error("❌ No se recibió código de Spotify");
    return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
  }

  try {
    // Intercambio de code por token
    const authOptions = {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: querystring.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    };

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", authOptions);
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("❌ No se obtuvo access_token de Spotify:", tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=no_token`);
    }

    console.log("🔐 Token de Spotify obtenido correctamente");

    // Obtener perfil del usuario
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    
    console.log("👤 Perfil de Spotify:", profile);

    // Crear o actualizar usuario en la base de datos
    const email = profile.email || `${profile.id}@spotify.com`;
    let userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    let user;

    if (userResult.rows.length === 0) {
      console.log("🆕 Creando nuevo usuario con Spotify");
      
      // Generar un password_hash aleatorio para usuarios de Spotify
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const password_hash = await bcrypt.hash(randomPassword, 10);
      
      const insert = await db.query(
        `INSERT INTO users (name, email, password_hash, role, spotify_id)
         VALUES ($1, $2, $3, 'user', $4)
         RETURNING id, name, email, role, spotify_id`,
        [profile.display_name || "Usuario Spotify", email, password_hash, profile.id]
      );
      user = insert.rows[0];
      console.log("✅ Usuario creado:", user);
    } else {
      user = userResult.rows[0];
      
      // Actualizar spotify_id si no existe
      if (!user.spotify_id) {
        console.log("🔄 Actualizando spotify_id para usuario existente");
        await db.query(
          `UPDATE users SET spotify_id = $1 WHERE id = $2`,
          [profile.id, user.id]
        );
        user.spotify_id = profile.id;
      }
      console.log("✅ Usuario existente encontrado:", user);
    }

    // Generar token JWT interno
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Redirigir al frontend con los tokens
    const redirectUrl = `${FRONTEND_URL}/auth/spotify/callback?jwt=${jwtToken}&spotify=${tokenData.access_token}`;
    console.log("✅ Redirigiendo a:", redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (err) {
    console.error("❌ Error en el callback de Spotify:", err);
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
});


// 3️⃣ Endpoint para obtener playlists según emoción
router.get("/playlists/:emotion", async (req, res) => {
  const emotion = req.params.emotion;
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    // Usa token de aplicación si el usuario no está logueado
    token = await getAppToken();
  }

  const searchQuery =
    {
      feliz: "happy mood",
      triste: "sad songs",
      enojado: "rock rage",
      relajado: "chill vibes",
      neutral: "focus chill lo-fi",
    }[emotion.toLowerCase()] || "pop";

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        searchQuery
      )}&type=playlist&limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    res.json(data.playlists.items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener playlists" });
  }
});

module.exports = router;

