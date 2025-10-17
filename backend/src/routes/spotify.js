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

  console.log("🔎 REDIRECT_URI usado:", REDIRECT_URI);

  try {
    // Intercambio de code por token
    const authOptions = {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
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
    console.log("Spotify token:", tokenData);

    console.log("🎧 Código recibido de Spotify:", code);
    console.log("🔐 Token de Spotify:", tokenData.access_token);
    // Obtener perfil del usuario
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    console.log("Perfil Spotify:", profile);

    // Crear o actualizar usuario en tu base de datos
    const email = profile.email || `${profile.id}@spotify.com`; // fallback
    let userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    let user;

    if (userResult.rows.length === 0) {
      const insert = await db.query(
        `INSERT INTO users (name, email, role, spotify_id)
         VALUES ($1, $2, 'user', $3)
         RETURNING id, name, email, role`,
        [profile.display_name || "Usuario Spotify", email, profile.id]
      );
      user = insert.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Generar token JWT interno
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Redirigir al frontend
    const redirectUrl = `${FRONTEND_URL}/auth/spotify/callback?jwt=${jwtToken}&spotify=${tokenData.access_token}`;
    console.log("Redirigiendo a:", redirectUrl);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Error en el callback de Spotify:", err);
    res.status(500).json({ message: "Error en el login con Spotify" });
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

