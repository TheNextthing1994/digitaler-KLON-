import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Zap, 
  Settings, 
  Plus, 
  Youtube, 
  Brain, 
  CheckCircle2, 
  Circle, 
  Clock,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Terminal,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Persona, Message, ProjectTask, YTAnalysis } from "./types";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---
const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />}
  </button>
);

const ChatMessage = ({ message }: { message: Message }) => {
  const isBot = message.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 p-6 rounded-2xl transition-all duration-300",
        isBot ? "bg-zinc-900/50 border border-zinc-800/50" : "bg-transparent"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
        isBot ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
      )}>
        {isBot ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {isBot ? (message.persona === "visionary" ? "Visionary Clone" : "Executive Clone") : "You"}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---
export default function App() {
  const [persona, setPersona] = useState<Persona>("visionary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "youtube" | "projects">("chat");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

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
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        persona,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeYoutube = async () => {
    if (!ytUrl.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl })
      });
      const data = await res.json();
      
      // Add analysis to chat
      const botMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `### YouTube Analyse abgeschlossen\n\n**Zusammenfassung:** ${data.summary}\n\n**Konzepte:** ${data.content}\n\nIch habe die Tasks in dein Projekt-Board übernommen.`,
        persona: "executive",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Add tasks if any
      if (data.tasks) {
        setTasks(prev => [...prev, ...data.tasks.map((t: string) => ({
          id: Math.random().toString(36).substr(2, 9),
          title: t,
          status: "todo",
          priority: "medium"
        }))]);
      }
      setYtUrl("");
      setActiveTab("chat");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 border-right border-zinc-800 bg-zinc-900/30 backdrop-blur-xl flex flex-col z-50"
          >
            <div className="p-6 flex items-center gap-3 border-bottom border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Digitaler Klon</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">MVP Prototype</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              <div className="space-y-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Navigation</p>
                <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
                <SidebarItem icon={Youtube} label="YouTube Analyzer" active={activeTab === "youtube"} onClick={() => setActiveTab("youtube")} />
                <SidebarItem icon={CheckCircle2} label="Projekt Board" active={activeTab === "projects"} onClick={() => setActiveTab("projects")} />
              </div>

              <div className="space-y-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Persona Modus</p>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setPersona("visionary")}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
                      persona === "visionary" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Visionary</span>
                  </button>
                  <button
                    onClick={() => setPersona("executive")}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
                      persona === "executive" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Terminal className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Executive</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Aktuelle Tasks</p>
                <div className="space-y-2">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                      <Circle className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400" />
                      <span className="text-xs text-zinc-400 truncate">{task.title}</span>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="text-xs text-zinc-600 italic px-3">Keine aktiven Tasks</p>}
                </div>
              </div>
            </div>

            <div className="p-4 border-top border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">User Account</p>
                  <p className="text-[10px] text-zinc-500 truncate">Pro Plan Active</p>
                </div>
                <Settings className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-pointer" />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-bottom border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="h-4 w-[1px] bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-400">Current Focus:</span>
              <span className="text-sm font-medium text-indigo-400">
                {activeTab === "chat" ? "AI Strategy Session" : activeTab === "youtube" ? "Knowledge Extraction" : "Project Execution"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Clone Sync Active</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full py-8 px-6">
            {activeTab === "chat" && (
              <div className="space-y-2">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                      <Bot className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">Willkommen zurück, Visionär.</h2>
                      <p className="text-zinc-500 max-w-md mx-auto">
                        Dein digitaler Klon ist bereit. Wähle eine Persona und beginne mit der Strategieplanung oder Umsetzung.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg pt-8">
                      <button onClick={() => setPersona("visionary")} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-all text-left group">
                        <Sparkles className="w-6 h-6 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-1">Visionary Mode</h3>
                        <p className="text-xs text-zinc-500">Strategie, Kritik & Hebelwirkung</p>
                      </button>
                      <button onClick={() => setPersona("executive")} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-all text-left group">
                        <Terminal className="w-6 h-6 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-1">Executive Mode</h3>
                        <p className="text-xs text-zinc-500">Umsetzung, Tasks & Struktur</p>
                      </button>
                    </div>
                  </div>
                )}
                {messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex gap-4 p-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="h-2 w-24 bg-zinc-800 rounded-full animate-pulse mb-2" />
                      <div className="h-2 w-full bg-zinc-800/50 rounded-full animate-pulse" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {activeTab === "youtube" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">YouTube Knowledge Extraction</h2>
                      <p className="text-sm text-zinc-500">Extrahiere Arbitrage-Hebel und Tasks aus Videos.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="YouTube URL einfÃ¼gen..."
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 pl-12 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    </div>
                    <button
                      onClick={analyzeYoutube}
                      disabled={isAnalyzing || !ytUrl}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      {isAnalyzing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5 fill-white" />
                      )}
                      {isAnalyzing ? "Analysiere..." : "Wissen extrahieren"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold">Letzte Erkenntnisse</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                        "Zeit-Aufwand-Arbitrage durch KI-Automatisierung..."
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                        "Kognitive Hebelwirkung in SaaS-Modellen..."
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold">History</h3>
                    </div>
                    <p className="text-xs text-zinc-600 italic">Keine kÃ¼rzlichen Analysen vorhanden.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Projekt Board</h2>
                    <p className="text-sm text-zinc-500">Verwalte die exekutiven Schritte deines Klons.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
                    <Plus className="w-4 h-4" />
                    Neuer Task
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["todo", "doing", "done"].map((status) => (
                    <div key={status} className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            status === "todo" ? "bg-zinc-500" : status === "doing" ? "bg-indigo-500" : "bg-emerald-500"
                          )} />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                            {status === "todo" ? "Backlog" : status === "doing" ? "In Arbeit" : "Erledigt"}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {tasks.filter(t => t.status === status).length}
                        </span>
                      </div>
                      
                      <div className="space-y-3 min-h-[200px] p-2 rounded-2xl bg-zinc-900/20 border border-dashed border-zinc-800">
                        {tasks.filter(t => t.status === status).map(task => (
                          <motion.div
                            layoutId={task.id}
                            key={task.id}
                            className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing group"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <p className="text-sm font-medium leading-tight">{task.title}</p>
                              <div className={cn(
                                "shrink-0 w-2 h-2 rounded-full",
                                task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                              )} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-zinc-900 flex items-center justify-center text-[8px] font-bold">EK</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                            </div>
                          </motion.div>
                        ))}
                        {tasks.filter(t => t.status === status).length === 0 && (
                          <div className="flex flex-col items-center justify-center h-40 text-zinc-700">
                            <Clock className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">Leer</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {activeTab === "chat" && (
          <div className="p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
              <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Frage deinen ${persona === "visionary" ? "visionÃ¤ren" : "exekutiven"} Klon...`}
                  className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-sm placeholder:text-zinc-600"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Brain className="w-3 h-3" /> Long-term Memory Active
                </p>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Real-time Synthesis
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
