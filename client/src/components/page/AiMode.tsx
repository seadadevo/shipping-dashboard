// App.jsx
import { useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Button,
} from "@mui/material";
import { Send, UploadFile } from "@mui/icons-material";

const API_URL = "http://localhost:3000";

const AiMode = () => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [chatEnabled, setChatEnabled] = useState(false);

  const fileInputRef = useRef();

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  const handleSend = async () => {
    if (!question.trim()) return;
    addMessage("user", question);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      addMessage("ai", data.answer);
    } catch (err) {
      addMessage("ai", "Sorry, I encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setUploadStatus("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploadStatus("Processing file...");

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus(data.message);
        setChatEnabled(true);
        setMessages([
          {
            sender: "ai",
            text: "Hello! I've read your file. Ask me anything about it.",
          },
        ]);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setUploadStatus("Failed to connect to server. Is Node running?");
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ color: "#06b6d4", display: "flex", alignItems: "center", gap: 1 }}
      >
        <UploadFile /> RAG Chatbot
      </Typography>

      <Paper
        elevation={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "70vh",
          overflow: "hidden",
          bgcolor: "#1e293b",
        }}
      >
        {/* Chat Header */}
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #334155",
            bgcolor: "#0f172a",
          }}
        >
          <Typography sx={{ color: "#facc15" }}>AI Assistant</Typography>
          <Button variant="text" color="error" onClick={handleClear}>
            Clear Chat
          </Button>
        </Box>

        {/* Chat Messages */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            bgcolor: "#0f172a",
          }}
        >
          {messages.length === 0 && (
            <Box textAlign="center" sx={{ mt: 10, opacity: 0.6 }}>
              <Typography color="gray">Waiting for a file to start chatting...</Typography>
            </Box>
          )}

          {messages.map((msg, idx) => (
            <Box
              key={idx}
              display="flex"
              justifyContent={msg.sender === "user" ? "flex-end" : "flex-start"}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: "80%",
                  bgcolor: msg.sender === "user" ? "linear-gradient(to right, #06b6d4, #10b981)" : "#334155",
                  color: msg.sender === "user" ? "white" : "white",
                  borderRadius: 2,
                  borderTopLeftRadius: msg.sender === "user" ? 16 : 0,
                  borderTopRightRadius: msg.sender === "user" ? 0 : 16,
                }}
              >
                {msg.text}
              </Paper>
            </Box>
          ))}
        </Box>

        {loading && (
          <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} sx={{ color: "#06b6d4" }} />
            <Typography color="#94a3b8" variant="body2">
              Thinking...
            </Typography>
          </Box>
        )}

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: "1px solid #334155", display: "flex", gap: 1 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".txt"
            onChange={handleUpload}
          />
          <IconButton
            color="primary"
            onClick={() => fileInputRef.current.click()}
            disabled={chatEnabled}
          >
            <UploadFile />
          </IconButton>

          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ask a question about your file..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={!chatEnabled}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#1e293b",
                color: "white",
              },
            }}
          />

          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!chatEnabled || !question.trim()}
          >
            <Send />
          </IconButton>
        </Box>

        {uploadStatus && (
          <Typography align="center" variant="caption" sx={{ color: "#94a3b8", mt: 0.5 }}>
            {uploadStatus}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default AiMode;
