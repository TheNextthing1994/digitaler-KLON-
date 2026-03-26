import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, User, Zap, Settings, Plus, Youtube, Brain, 
  CheckCircle2, Circle, LayoutDashboard, Menu, X, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Persona, Message, ProjectTask } from "./types";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function App() {
  const [persona, setPersona] = useState<Persona>("visionary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, persona, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input, 
          persona,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const botMsg: Message = { id: (Date.now()+1).toString(), role: "assistant", content: data.text, persona, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-4 hidden md:flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <Brain className="text-indigo-500 w-8 h-8" />
          <h1 className="font-bold text-xl tracking-tight">Klon MVP</h1>
        </div>
        
        <button 
          onClick={() => setPersona("visionary")}
          className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", persona === "visionary" ? "bg-indigo-600/20 text-indigo-400" : "hover:bg-slate-900 text-slate-400")}
        >
          <Sparkles size={20} /> Visionär
        </button>

        <button 
          onClick={() => setPersona("executive")}
          className={cn("flex items-center gap-3 p-3 rounded-xl transition-all", persona === "executive" ? "bg-emerald-600/20 text-emerald-400" : "hover:bg-slate-900 text-slate-400")}
        >
          <Zap size={20} /> Exekutive
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", persona === "visionary" ? "bg-indigo-500" : "bg-emerald-500")} />
            <span className="font-medium capitalize">{persona} Modus</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-4 max-w-3xl mx-auto", m.role === "user" ? "flex-row-reverse" : "")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", m.role === "assistant" ? "bg-indigo-600" : "bg-slate-700")}>
                {m.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className={cn("p-4 rounded-2xl leading-relaxed", m.role === "assistant" ? "bg-slate-900 border border-slate-800" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10")}>
                <div className="prose prose-invert max-w-none">
                  <Markdown>{m.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`${persona === "visionary" ? "Teile eine Vision..." : "Was steht an?"}`}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
            />
            <button 
              onClick={sendMessage}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
