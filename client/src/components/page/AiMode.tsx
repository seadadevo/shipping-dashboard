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
  StopCircle,
  ChevronLeft,
  MoreVertical,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const API_URL = "http://localhost:5000/api/ai";

const SUGGESTIONS = [
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "هل يمكنني تعديل طلب بعد إنشائه؟",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "ماذا أفعل إذا واجهت خطأ في النظام؟",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "كيف أنشئ طلب شحن جديد؟ (للمسؤولين والعملاء)",
  },
];

interface Message {
  sender: "user" | "ai";
  text: string;
  isAnimated?: boolean; // New flag for typing effect
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

// --- Component: ChartRenderer ---
const ChartRenderer = ({ jsonString }: { jsonString: string }) => {
  try {
    const chartData = JSON.parse(jsonString);
    const { type, title, xLabel, yLabel, data } = chartData;

    return (
      <div className="my-4 w-full max-w-2xl rounded-xl border bg-card p-4 shadow-sm animate-fade-in-up">
        <h3 className="mb-4 text-center font-semibold text-foreground text-lg">
          {title}
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  label={{
                    value: xLabel,
                    position: "insideBottom",
                    offset: -5,
                  }}
                  stroke="#888888"
                />
                <YAxis
                  label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                  stroke="#888888"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  animationDuration={1500}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  label={{
                    value: xLabel,
                    position: "insideBottom",
                    offset: -5,
                  }}
                  stroke="#888888"
                />
                <YAxis
                  label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                  stroke="#888888"
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                >
                  {/* Subtle Gradient effect could go here */}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  } catch {
    return <div className="text-red-500 text-sm">Error rendering chart.</div>;
  }
};

// --- Component: Typewriter ---
const Typewriter = ({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    // If text is empty, just complete immediately
    if (!text) {
      if (onComplete) onComplete();
      return;
    }

    indexRef.current = 0;
    setDisplayedText("");

    const intervalId = setInterval(() => {
      // Add multiple chars per tick for speed (adjustable)
      const chunkSize = 5;
      const nextIndex = Math.min(indexRef.current + chunkSize, text.length);

      setDisplayedText(text.slice(0, nextIndex));
      indexRef.current = nextIndex;

      if (indexRef.current >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, 15); // Speed in ms

    return () => clearInterval(intervalId);
  }, [text]); // Re-run if text content changes completely (should happen once per msg)

  // Use the parent's render logic for the partial text
  // We need to pass this back up or replicate the render logic?
  // Easier: Just return the content using the logic directly here or via a render prop?
  // Let's use a render prop approach or just duplicate the renderMessageContent call if accessible?
  // Since Typewriter is defined outside AiMode, it doesn't have access to renderMessageContent easily unless passed or moved.
  // I will move renderMessageContent to be a helper outside or pass it.

  // Actually, I can render standard text here. But renderMessageContent handles Charts.
  // Let's assume Typewriter is used *inside* AiMode where renderMessageContent is available?
  // No, I'm defining it outside. I'll move renderMessageContent outside or duplicate relevant logic.
  // Actually, standardizing: The ChartRenderer is receiving a string.
  // Let's make `renderMessageContent` a standalone helper outside AiMode.
  return <>{renderMessageContent(displayedText)}</>;
};

// Helper function wrapper for external usage if needed
const renderMessageContent = (text: string) => {
  const chartRegex = /```json-chart([\s\S]*?)```/;
  const match = text.match(chartRegex);

  if (match) {
    const jsonString = match[1];
    const parts = text.split(match[0]);
    return (
      <div className="flex flex-col gap-4 w-full">
        {parts[0].trim() && (
          <div className="leading-relaxed whitespace-pre-wrap">{parts[0]}</div>
        )}
        <ChartRenderer jsonString={jsonString} />
        {parts[1] && parts[1].trim() && (
          <div className="leading-relaxed whitespace-pre-wrap">{parts[1]}</div>
        )}
      </div>
    );
  }
  return <div className="leading-relaxed whitespace-pre-wrap">{text}</div>;
};

// --- Component: InputBox ---
const InputBox = ({
  question,
  setQuestion,
  handleSend,
  handleUpload,
  fileInputRef,
  centered = false,
  startListening,
  stopListening,
  isListening,
  isLoading, // Changed from isUploading
  selectedFile,
  clearFile,
  showIntroGlow = false,
}: {
  question: string;
  setQuestion: (val: string) => void;
  handleSend: (text?: string) => void;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  centered?: boolean;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  isLoading: boolean;
  selectedFile?: File | null;
  clearFile?: () => void;
  showIntroGlow?: boolean;
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
      {/* 
         ANIMATION LAYERS (Only visible if showIntroGlow is true) 
      */}
      {showIntroGlow && (
        <>
          <div className="absolute -inset-[3px] rounded-2xl opacity-100 overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#4285F4_320deg,#EA4335_335deg,#FBBC04_350deg,#34A853_360deg)] animate-[spin_4s_linear_infinite]" />
          </div>
          <div className="absolute -inset-[3px] rounded-2xl opacity-60 blur-md overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#4285F4_320deg,#EA4335_335deg,#FBBC04_350deg,#34A853_360deg)] animate-[spin_4s_linear_infinite]" />
          </div>
        </>
      )}

      {/* Actual Input Container */}
      <div
        className={`
        relative flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-all z-10
        ${
          !showIntroGlow
            ? "border-border focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
            : "border-transparent"
        }
        ${centered ? "min-h-[120px]" : "min-h-[60px]"}
        ${isListening ? "ring-2 ring-red-500/50 border-red-500/50" : ""}
      `}
      >
        <div className="absolute inset-0 bg-card rounded-2xl -z-10" />

        {/* Pending File Chip */}
        {selectedFile && (
          <div className="mx-2 mt-2 flex items-center gap-2 w-fit bg-accent/50 px-3 py-1 rounded-lg border border-border">
            <span className="text-xs text-foreground font-medium truncate max-w-[200px]">
              {selectedFile.name}
            </span>
            <button
              onClick={clearFile}
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={false}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (question.trim() || selectedFile) {
                handleSend();
              }
            }
          }}
          placeholder={
            isLoading
              ? "Speaking with AI..."
              : isListening
              ? "جاري الاستماع..."
              : "Ask anything... | اسأل أي شيء"
          }
          dir="auto"
          className={`w-full resize-none bg-transparent p-3 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none`}
          style={{ minHeight: centered ? "80px" : "40px" }}
        />

        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">إرفاق ملف</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.csv,.pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleUpload}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`rounded-full p-2 transition-all duration-200 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isListening ? "إيقاف الاستماع" : "ابدأ التحدث"}
            >
              {isListening ? (
                <StopCircle className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => handleSend()}
              disabled={(!question.trim() && !selectedFile) || isLoading}
              className={`rounded-full p-2 transition-all ${
                (question.trim() || selectedFile) && !isLoading
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiMode = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Ref to track the current session ID without stale closures issues
  const currentSessionIdRef = useRef<string | null>(null);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intro Animation State
  const [showIntroGlow, setShowIntroGlow] = useState(true);

  useEffect(() => {
    // Turn off glow after 5 seconds (adjusted per user request)
    const timer = setTimeout(() => {
      setShowIntroGlow(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Sync ref with state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Load sessions
  useEffect(() => {
    if (!user) return;
    const storageKey = `ai_chat_sessions_${user._id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsedSessions = JSON.parse(saved);
        // Ensure legacy sessions don't animate on load
        const sanitizedSessions = parsedSessions.map((s: ChatSession) => ({
          ...s,
          messages: s.messages.map((m) => ({ ...m, isAnimated: false })),
        }));
        setSessions(sanitizedSessions);

        // CHECK LAST ACTIVE USER FOR RESTORE LOGIC
        const LAST_USER_KEY = "ai_last_active_user_id";
        const lastUserId = localStorage.getItem(LAST_USER_KEY);

        // Only auto-restore if we are returning as the SAME user
        if (lastUserId === user._id) {
          if (sanitizedSessions.length > 0) {
            const lastSession = sanitizedSessions[0];
            setCurrentSessionId(lastSession.id);
            setMessages(lastSession.messages);
          }
        } else {
          // New User Login / Switch: Start Fresh
          localStorage.setItem(LAST_USER_KEY, user._id);
          setCurrentSessionId(null);
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    } else {
      setSessions([]); // Clear sessions if none for this user
    }
    setIsHistoryLoaded(true);
  }, [user]);

  // Save sessions
  useEffect(() => {
    if (!user || !isHistoryLoaded) return;
    const storageKey = `ai_chat_sessions_${user._id}`;
    if (sessions.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    } else if (localStorage.getItem(storageKey)) {
      localStorage.removeItem(storageKey);
    }
  }, [sessions, user, isHistoryLoaded]);

  // Update session list when messages change
  useEffect(() => {
    // Use the ref to ensure we have the latest ID even if effect runs oddly
    const activeId = currentSessionIdRef.current;

    if (!activeId || messages.length === 0) return;

    setSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === activeId);
      let title = "New Chat";
      const firstUserMsg = messages.find((m) => m.sender === "user");

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
        messages,
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
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const chatStarted = messages.length > 0;

  // --- Voice Logic (Defaulted to Arabic/Auto) ---
  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Your browser does not support voice input.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "ar-EG"; // Default to Arabic as requested context implies

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // --- Session Logic ---
  const generateId = () => Date.now().toString();

  const startNewChat = () => {
    if (messages.length === 0 && currentSessionId) return;

    const newId = generateId();
    setCurrentSessionId(newId);
    currentSessionIdRef.current = newId;
    setMessages([]);
    setQuestion("");
    setMessages([]);
    setQuestion("");
    setShowHistory(false); // Close history on new chat
  };

  const addMessageSafe = (
    sender: "user" | "ai",
    text: string,
    animate = false
  ) => {
    let activeId = currentSessionIdRef.current;
    if (!activeId) {
      activeId = generateId();
      setCurrentSessionId(activeId);
      currentSessionIdRef.current = activeId;
    }
    setMessages((prev) => [...prev, { sender, text, isAnimated: animate }]);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    currentSessionIdRef.current = session.id;
    setMessages(session.messages);
    setShowHistory(false); // Close history drawer on selection
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      currentSessionIdRef.current = null;
      setMessages([]);
    }
  };

  // --- Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again if cleared
    if (e.target) e.target.value = "";
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || question;
    const hasFile = !!selectedFile;

    if (!textToSend.trim() && !hasFile) return;

    // Display User Message
    const displayMsg = hasFile
      ? textToSend
        ? `${textToSend} \n[Attached: ${selectedFile?.name}]`
        : `[Uploaded: ${selectedFile?.name}]`
      : textToSend;

    addMessageSafe("user", displayMsg);
    setQuestion("");
    clearFile(); // Remove chip immediately
    setLoading(true);

    try {
      const formData = new FormData();
      if (textToSend.trim()) formData.append("question", textToSend);
      if (hasFile && selectedFile) formData.append("file", selectedFile);

      // Inject User Context for RBAC
      if (user) {
        formData.append("userId", user._id);
        formData.append("userType", user.userType);
      }

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        body: formData, // Automatic multipart/form-data
      });

      // STREAMING RESPONSE HANDLER
      addMessageSafe("ai", ""); // Init empty AI message

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader available");

      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });

          // Handle potential JSON error response from server if it wasn't a stream?
          // Our server sets text/plain for stream. If error, it might send json.
          // Assuming stream is pure text for now.

          accumulatedText += chunk;

          setMessages((prev) => {
            const newMsgs = [...prev];
            // Update the last message (which is the AI one we just added)
            const lastIdx = newMsgs.length - 1;
            if (lastIdx >= 0 && newMsgs[lastIdx].sender === "ai") {
              newMsgs[lastIdx].text = accumulatedText;
            }
            return newMsgs;
          });
        }
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      // If we already started streaming, appending error might be weird, but okay
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.length - 1;
        if (lastIdx >= 0 && newMsgs[lastIdx].sender === "ai") {
          newMsgs[lastIdx].text += `\n⚠️ حدث خطأ: ${err.message}`;
        } else {
          // If failed before start
          newMsgs.push({ sender: "ai", text: `⚠️ حدث خطأ: ${err.message}` });
        }
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  };

  // Alias for legacy props compatibility if needed, though we should update usage
  const handleUpload = handleFileSelect;

  // --- RENDER MESSAGE HELPER MOVED OUTSIDE ---
  // Keeping this comment anchor but functionality is now external 'const renderMessageContent'

  return (
    // Main Container
    <div className="flex bg-background h-[calc(100vh-theme(spacing.16))] w-full text-foreground font-sans overflow-hidden">
      {/* 
          1. FIXED ICON RAIL
          Always visible, width 16
       */}
      <div className="w-16 flex flex-col items-center py-4 gap-6 shrink-0 h-full border-l border-border bg-card z-50 relative">
        <button
          onClick={startNewChat}
          title="محادثة جديدة"
          className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 hover:scale-105 transition-all duration-200"
        >
          <Edit className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          title="Sijil"
          className={`p-3 rounded-xl transition-all duration-200 relative ${
            showHistory
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Clock className="h-5 w-5" />
          {sessions.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-card pointer-events-none" />
          )}
        </button>
      </div>

      {/* 
          2. SLIDING DRAWER
          Sitting next to the rail. Width 0 -> 64 (16rem).
       */}
      <div
        className={`
           flex flex-col bg-card border-r border-border shrink-0 overflow-hidden transition-all duration-300 ease-in-out
           ${showHistory ? "w-64 opacity-100" : "w-0 opacity-0 border-none"}
         `}
      >
        {/* Drawer Content */}
        <div className="flex flex-col h-full w-64">
          {/* Match Image Header: Left Arrow, Right Buttons */}
          <div className="flex items-center justify-between p-4 pb-2">
            <button
              onClick={() => setShowHistory(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Close"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
                title="محادثة جديدة"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
                title="القائمة"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 font-medium text-sm text-muted-foreground text-right">
            سجل المحادثات
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 min-w-0">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">
                لا يوجد سجل
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
                  <div className="truncate flex-1 text-left">
                    {session.title}
                  </div>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 h-full">
        {/* OVERLAY: Click content to close history (Desktop & Mobile) */}
        {showHistory && (
          <div
            className="absolute inset-0 z-40 bg-black/5 cursor-pointer"
            onClick={() => setShowHistory(false)}
            title="Close History"
          />
        )}

        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 flex items-center p-4 bg-background/80 backdrop-blur-sm border-b border-border justify-between">
          <span className="font-medium">الوضع الذكي</span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 -mr-2 text-muted-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {!chatStarted ? (
            <div className="flex min-h-full flex-col items-center justify-center p-4">
              <div className="mb-8 text-center animate-fade-in">
                <h1 className="mb-3 text-4xl font-medium text-foreground tracking-tight">
                  مرحباً بك في المساعد الذكي
                </h1>
                <p className="text-lg text-muted-foreground">
                  اطرح أسئلة دقيقة للحصول على إجابات أفضل
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
                  startListening={startListening}
                  stopListening={stopListening}
                  isListening={isListening}
                  isLoading={loading}
                  selectedFile={selectedFile}
                  clearFile={clearFile}
                  showIntroGlow={showIntroGlow} // Pass the animation state
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
                  <div
                    className={`mb-2 flex items-center gap-3 ${
                      msg.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <div className="text-lg font-medium text-foreground">
                        أنت
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                          <Sparkles className="h-3 w-3" />
                        </div>
                        <span className="text-lg font-medium text-foreground">
                          المساعد الذكي
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message Content Bubble */}
                  <div
                    className={`flex w-full ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        max-w-[85%] leading-relaxed whitespace-pre-wrap
                        ${
                          msg.sender === "user"
                            ? "bg-muted/50 p-4 rounded-2xl rounded-tr-none text-foreground/90 border border-border/50"
                            : "pl-0 text-foreground/90"
                        }
                      `}
                    >
                      {msg.sender === "ai"
                        ? renderMessageContent(msg.text)
                        : msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التفكير...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating Input (Fixed at Bottom of Chat Area) */}
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
                startListening={startListening}
                stopListening={stopListening}
                isListening={isListening}
                isLoading={loading}
                selectedFile={selectedFile}
                clearFile={clearFile}
                showIntroGlow={false} // Never show glow on bottom input, only on the centered one
              />
              <div className="mt-2 text-center text-xs text-muted-foreground">
                قد ترتكب تقنيات الذكاء الاصطناعي أخطاءً، لذا يُرجى التحقق من
                المعلومات الهامة قبل الاعتماد عليها.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiMode;
