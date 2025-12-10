import { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Mic,
  Sparkles,
  Edit,
  Loader2,
  Trash2,
  Menu,
  Clock,
  X,
  MessageSquare,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/ai";

const SUGGESTIONS = [
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "Free local events happening this week",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "Make a table comparing memory foam vs hybrid mattresses",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "How do I get started playing padel?",
  },
];

interface Message {
  sender: "user" | "ai";
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

// --- Component: InputBox ---
const InputBox = ({
  question,
  setQuestion,
  handleSend,
  handleUpload,
  fileInputRef,
  centered = false,
}: {
  question: string;
  setQuestion: (val: string) => void;
  handleSend: (text?: string) => void;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  centered?: boolean;
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (centered) {
      inputRef.current?.focus();
    }
  }, [centered]);

  return (
    <div
      className={`relative w-full transition-all duration-500 ease-in-out ${
        centered ? "max-w-2xl" : "max-w-4xl mx-auto"
      }`}
    >
      <div
        className={`
        relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition-all
        focus-within:border-ring focus-within:ring-1 focus-within:ring-ring
        ${centered ? "min-h-[120px]" : "min-h-[60px]"}
      `}
      >
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (question.trim()) {
                handleSend();
              }
            }
          }}
          placeholder="Ask anything..."
          className="w-full resize-none bg-transparent p-3 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ minHeight: centered ? "80px" : "40px" }}
        />

        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Attach</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt"
              onChange={handleUpload}
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Mic className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!question.trim()}
              className={`rounded-full p-2 transition-all ${
                question.trim()
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiMode = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions
  useEffect(() => {
    const saved = localStorage.getItem("ai_chat_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("ai_chat_sessions", JSON.stringify(sessions));
    } else if (localStorage.getItem("ai_chat_sessions")) {
      localStorage.removeItem("ai_chat_sessions");
    }
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const chatStarted = messages.length > 0;

  // --- Session Logic ---
  const generateId = () => Date.now().toString();

  const startNewChat = () => {
    if (messages.length === 0 && currentSessionId) return;

    const newId = generateId();
    setCurrentSessionId(newId);
    setMessages([]);
    setQuestion("");
    setShowHistory(false);
  };

  const updateSessionsList = (activeId: string, currentMessages: Message[]) => {
    setSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === activeId);
      let title = "New Chat";
      const firstUserMsg = currentMessages.find((m) => m.sender === "user");

      if (existingIndex >= 0) {
        title = prev[existingIndex].title;
        if (title === "New Chat" && firstUserMsg) {
          title =
            firstUserMsg.text.slice(0, 30) +
            (firstUserMsg.text.length > 30 ? "..." : "");
        }
      } else if (firstUserMsg) {
        title =
          firstUserMsg.text.slice(0, 30) +
          (firstUserMsg.text.length > 30 ? "..." : "");
      }

      const updatedSession: ChatSession = {
        id: activeId,
        title,
        messages: currentMessages,
        date: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const newSessions = [...prev];
        newSessions[existingIndex] = updatedSession;
        newSessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return newSessions;
      } else {
        return [updatedSession, ...prev];
      }
    });
  };

  const addMessage = (sender: "user" | "ai", text: string) => {
    setMessages((prev) => {
      const newMessages = [...prev, { sender, text }];
      let activeId = currentSessionId;
      if (!activeId) {
        activeId = generateId();
        setCurrentSessionId(activeId);
      }
      updateSessionsList(activeId, newMessages);
      return newMessages;
    });
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  // --- Handlers ---
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || question;
    if (!textToSend.trim()) return;

    addMessage("user", textToSend);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend }),
      });
      const data = await res.json();
      addMessage("ai", data.answer);
    } catch (err) {
      addMessage(
        "ai",
        "Sorry, I encountered an error. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    addMessage("user", `Uploaded: ${file.name}`);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        addMessage(
          "ai",
          `I've read **${file.name}**. Ask me anything about it!`
        );
      } else {
        addMessage("ai", `Error uploading file: ${data.error}`);
      }
    } catch (err) {
      addMessage("ai", "Failed to upload file. Is the server running?");
    }
  };

  return (
    <div className="flex bg-background h-[calc(100vh-theme(spacing.16))] w-full text-foreground font-sans overflow-hidden">
      {/* 
          UNIFIED SIDEBAR CONTAINER 
          Includes the Icon Strip (Rail) AND the Expansible History List.
          Uses a single parent div with transitions for width.
       */}
      <div
        className={`
           z-30 bg-card border-l border-border shrink-0 flex overflow-hidden transition-all duration-300 ease-in-out
           ${showHistory ? "w-80" : "w-16"}
         `}
      >
        {/* 1. Icon Strip (Always visible, fixed width 16) */}
        <div className="w-16 flex flex-col items-center py-4 gap-6 shrink-0 h-full border-r border-border/50 bg-card z-40">
          <button
            onClick={startNewChat}
            title="New Chat"
            className="flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all duration-200"
          >
            <Edit className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            title="History"
            className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
              showHistory
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Clock className="h-5 w-5" />
            {sessions.length > 0 && (
              <div className="absolute ml-6 mb-6 h-2 w-2 rounded-full bg-red-500 border border-card" />
            )}
          </button>
        </div>

        {/* 2. History List Panel (Expands out) */}
        <div
          className={`flex flex-col h-full bg-card/50 w-64 shrink-0 transition-opacity duration-300 ${
            showHistory ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="p-4 border-b border-border font-medium text-sm flex items-center justify-between shrink-0 h-16">
            <span>Recent Chats</span>
            <button onClick={() => setShowHistory(false)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 min-w-0">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">
                No history
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 transition-colors text-sm group ${
                    currentSessionId === session.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <div className="truncate flex-1">{session.title}</div>
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Mobile Header (Shows AI Mode title + Mobile Menu Toggle) */}
        <div className="md:hidden sticky top-0 z-10 flex items-center p-4 bg-background/80 backdrop-blur-sm border-b border-border justify-between">
          <span className="font-medium">AI Mode</span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 -mr-2 text-muted-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!chatStarted ? (
            <div className="flex min-h-full flex-col items-center justify-center p-4">
              <div className="mb-8 text-center animate-fade-in">
                <h1 className="mb-3 text-4xl font-medium text-foreground tracking-tight">
                  Meet AI Mode
                </h1>
                <p className="text-lg text-muted-foreground">
                  Ask detailed questions for better responses
                </p>
              </div>

              <div className="w-full max-w-2xl animate-fade-in-up">
                <InputBox
                  centered={true}
                  question={question}
                  setQuestion={setQuestion}
                  handleSend={handleSend}
                  handleUpload={handleUpload}
                  fileInputRef={fileInputRef}
                />

                <div className="mt-8 flex flex-col gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s.text)}
                      className="group flex items-center gap-3 rounded-lg p-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span className="text-muted-foreground/70 group-hover:text-foreground">
                        {s.icon}
                      </span>
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-4xl p-4 md:p-8 pb-32">
              {messages.map((msg, idx) => (
                <div key={idx} className="mb-8 animate-fade-in">
                  <div className="mb-2 flex items-center gap-3">
                    {msg.sender === "user" ? (
                      <div className="text-lg font-medium text-foreground">
                        You
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                          <Sparkles className="h-3 w-3" />
                        </div>
                        <span className="text-lg font-medium text-foreground">
                          AI Assistant
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pl-0 text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input (Chat Mode) */}
        {chatStarted && (
          <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10">
            <div className="px-4">
              <InputBox
                centered={false}
                question={question}
                setQuestion={setQuestion}
                handleSend={handleSend}
                handleUpload={handleUpload}
                fileInputRef={fileInputRef}
              />
              <div className="mt-2 text-center text-xs text-muted-foreground">
                AI can make mistakes. Please verify important information.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiMode;
