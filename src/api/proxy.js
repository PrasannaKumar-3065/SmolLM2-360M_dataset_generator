// proxy.js
require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch"); // npm i node-fetch@2
const cors = require("cors");

const app = express();
app.use(cors()); // allow your React dev origin or use { origin: "http://localhost:3000" }
app.use(express.json());

const HF_SPACE_URL = process.env.HF_SPACE_URL || "https://huggingface.co/spaces/sanaX3065/SmolLM2-360M-Instruct_QA_demo_dataset/api/predict/";
const HF_TOKEN = process.env.HF_TOKEN || ""; // only if private

app.post("/predict", async (req, res) => {
  try {
    const resp = await fetch(HF_SPACE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
      },
      body: JSON.stringify(req.body),
    });

    const text = await resp.text();
    // preserve status if needed
    res.status(resp.status).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy listening at http://localhost:${PORT}`));
