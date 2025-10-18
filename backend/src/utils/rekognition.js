const AWS = require("aws-sdk");
require("dotenv").config();

// Inicializa el cliente de Rekognition
const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * Detecta emociones en una imagen base64
 * @param {string} base64Image - Imagen codificada en base64
 */
exports.detectEmotions = async (base64Image) => {
  try {
    // Decodificar la imagen base64 a bytes
    const imageBytes = Buffer.from(
      base64Image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const params = {
      Image: { Bytes: imageBytes },
      Attributes: ["ALL"],
    };

    const result = await rekognition.detectFaces(params).promise();

    if (!result.FaceDetails || result.FaceDetails.length === 0) {
      return { error: "No se detectó ningún rostro" };
    }

    // Tomar la emoción principal del primer rostro detectado
    const emociones = result.FaceDetails[0].Emotions;
    const principal = emociones.reduce((a, b) =>
      a.Confidence > b.Confidence ? a : b
    );

    return {
      emociones,
      principal: principal.Type,
      confianza: principal.Confidence,
    };
  } catch (err) {
    console.error("Error en Rekognition:", err);
    return { error: "Error al analizar la imagen" };
  }
};
