import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
// @ts-ignore
import YoutubeTranscript from 'youtube-transcript';
import dotenv from "dotenv";

console.log("🟢 Server script starting...");

dotenv.config();

const app = express();
app.use(express.json());

// --- Personas ---
const PERSONA_VISIONARY = `Du bist der 'Visionäre Kreativpartner'. Hinterfrage Ideen, suche nach Arbitrage-Möglichkeiten und kognitiven Hebeln. Sei inspirierend und kritisch.`;
const PERSONA_EXECUTIVE = `Du bist der 'Exekutive Assistent'. Erstelle Aufgabenlisten, Projektpläne und fokussiere dich auf Struktur und effiziente Ausführung.`;

// --- Speicher-Logik ---
const MEMORY_FILE = "memory.json";
if (!fs.existsSync(MEMORY_FILE)) fs.writeFileSync(MEMORY_FILE, JSON.stringify({ tasks: [], notes: [] }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });

// --- API Endpunkte ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, persona, history } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: persona === "visionary" ? PERSONA_VISIONARY : PERSONA_EXECUTIVE }] },
        ...(history || []).map((h: any) => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: "user", parts: [{ text: message }] }
      ]
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Fehler bei der KI-Anfrage" });
  }
});

app.post("/api/youtube", async (req, res) => {
  try {
    const { url } = req.body;
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const text = transcript.map(t => t.text).join(" ");
    res.json({ transcript: text.substring(0, 5000) }); // Kürzen für die KI
  } catch (error) {
    console.error("YouTube Error:", error);
    res.status(500).json({ error: "YouTube-Fehler" });
  }
});

// --- Vite Integration & Statische Dateien ---
const isProd = process.env.NODE_ENV === "production";

async function setupVite() {
  if (!isProd) {
    console.log("🛠️ Initializing Vite dev server...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("✅ Vite middleware integrated.");
    } catch (error) {
      console.error("❌ Failed to initialize Vite server:", error);
    }
  } else {
    console.log("🚀 Serving production build from dist...");
    const distPath = path.resolve("dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
}

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Digitaler Klon läuft auf Port ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  
  // Initialize Vite after starting the server to ensure port 3000 is open immediately
  setupVite().catch(err => {
    console.error("❌ Vite initialization error:", err);
  });
});
