const express = require("express");
const { detectEmotions } = require("../utils/rekognition");

const router = express.Router();

router.post("/analizar", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No se envió ninguna imagen" });
    }

    const resultado = await detectEmotions(image);

    if (resultado.error) {
      return res.status(400).json({ message: resultado.error });
    }

    // Convertir emociones de AWS a formato más legible
    const emotionMap = {
      HAPPY: "Felicidad",
      SAD: "Tristeza",
      CALM: "Calma",
      ANGRY: "Enojo",
      CONFUSED: "Confusión",
      SURPRISED: "Sorpresa",
      FEAR: "Miedo",
      DISGUSTED: "Disgusto",
    };

    const iconMap = {
      HAPPY: "😊",
      SAD: "😔",
      CALM: "😌",
      ANGRY: "😠",
      CONFUSED: "😕",
      SURPRISED: "😮",
      FEAR: "😨",
      DISGUSTED: "🤢",
    };

    const emotionName = emotionMap[resultado.principal] || resultado.principal;
    const icon = iconMap[resultado.principal] || "🎭";

    res.json({
      emotion: {
        name: emotionName,
        icon,
        confidence: Math.round(resultado.confianza),
      },
    });
  } catch (err) {
    console.error("Error al procesar emociones:", err);
    res.status(500).json({ message: "Error interno al analizar emociones" });
  }
});

module.exports = router;
