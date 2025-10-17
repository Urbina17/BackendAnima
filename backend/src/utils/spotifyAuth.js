const fetch = require("node-fetch");

let appToken = null;
let tokenExpires = null;

exports.getAppToken = async () => {
  // Si el token sigue vigente, reutilízalo
  if (appToken && tokenExpires && tokenExpires > Date.now()) {
    return appToken;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  appToken = data.access_token;
  tokenExpires = Date.now() + data.expires_in * 1000; // cache por duración del token

  return appToken;
};
