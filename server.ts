import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import { YoutubeTranscript } from 'youtube-transcript';

// --- Constants & Prompts ---
const PERSONA_VISIONARY = `
Du bist der 'Visionäre Kreativpartner & Analytische Kritiker'. 
Deine Aufgabe ist es, Ideen zu hinterfragen, zu kombinieren und auf Hebelwirkungen (Arbitrage) zu prüfen.
Fokussiere dich auf:
- Zeit-Aufwand-Arbitrage: Wie erreichen wir das Maximum mit minimalem Aufwand?
- Kognitive Hebel: Welche Konzepte isolieren wir?
- Eventualitäten: Was sind Best-Case/Worst-Case Szenarien?
Sei proaktiv, kritisch und inspirierend.
`;

const PERSONA_EXECUTIVE = `
Du bist der 'Exekutive Assistent'. 
Deine Aufgabe ist die Umsetzung. Erstelle Task-Listen, Projektstrukturpläne und nutze Tools.
Fokussiere dich auf:
- Strukturierte Aufgabenplanung.
- Präzise Ausführung.
- API-Nutzung und Datenmanagement.
Sei effizient, organisiert und lösungsorientiert.
`;

// --- Memory System (Simple Prototype) ---
const MEMORY_FILE = path.join(process.cwd(), "memory.json");
if (!fs.existsSync(MEMORY_FILE)) fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));

async function memorize(text: string, metadata: any) {
  const memory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  memory.push({ text, metadata, timestamp: new Date().toISOString() });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory));
}

async function recall(query: string) {
  const memory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  // Simple keyword search for prototype
  return memory.filter((m: any) => 
    m.text.toLowerCase().includes(query.toLowerCase())
  ).slice(-5);
}

// --- Server Setup ---
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  console.log("Starting full-stack server...");
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/chat", async (req, res) => {
    const { message, persona, history } = req.body;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: persona === "visionary" ? PERSONA_VISIONARY : PERSONA_EXECUTIVE }] },
          ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.content }] })),
          { role: "user", parts: [{ text: message }] }
        ]
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/youtube", async (req, res) => {
    const { url } = req.body;
    try {
      const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      const fullText = transcript.map(t => t.text).join(" ");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analysiere dieses YouTube Transkript und extrahiere die wichtigsten Hebelwirkungen (Arbitrage), Konzepte und eine Task-Liste: ${fullText}`,
        config: { responseMimeType: "application/json" }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("YouTube API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/memory/save", async (req, res) => {
    const { text, metadata } = req.body;
    await memorize(text, metadata);
    res.json({ success: true });
  });

  app.get("/api/memory/recall", async (req, res) => {
    const { query } = req.query;
    const results = await recall(query as string);
    res.json(results);
  });

  // Vite middleware
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized.");
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }
  } catch (err) {
    console.error("Vite initialization failed:", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
