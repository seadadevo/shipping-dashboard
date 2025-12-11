const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const csv = require("csv-parser");
const tesseract = require("tesseract.js");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

// ================= CONFIGURATION =================
const router = express.Router();
const upload = multer({ dest: "uploads/" });
const client = new ChromaClient();
const COLLECTION_NAME = "rag_knowledge_base";

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// ================= HELPER FUNCTIONS =================

// --- RESET DB ON STARTUP (Fix for Garbage Data) ---
async function resetCollection() {
  try {
    console.log(
      `🧹 Attempting to delete collection '${COLLECTION_NAME}' to clear old data...`
    );
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log(`✅ Collection '${COLLECTION_NAME}' deleted.`);
  } catch (e) {
    // Ignore if it doesn't exist
    console.log(
      `ℹ️ Collection '${COLLECTION_NAME}' did not exist or could not be deleted.`
    );
  }
}
// Fire and forget on startup
resetCollection();

async function getEmbedding(text) {
  // Use OpenRouter for embeddings for consistency if specific model needed,
  // or use a local one. Here we use OpenRouter as per original code.
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
    }),
  });

  const data = await response.json();
  if (!data.data) {
    console.error("Embedding Error:", data);
    throw new Error("Failed to generate embeddings. Check API Key or Quota.");
  }
  return data.data[0].embedding;
}

// Helper: Convert tabular CSV data to semantic text for RAG
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        // Convert rows to a readable string context
        const textContext = results
          .map((row, index) => {
            return (
              `Record ${index + 1}: ` +
              Object.entries(row)
                .map(([key, val]) => `${key}: ${val}`)
                .join(", ")
            );
          })
          .join("\n");
        resolve(textContext);
      })
      .on("error", (err) => reject(err));
  });
};

async function processAndStoreDocument(rawText) {
  if (!rawText || rawText.length < 10) {
    console.warn("⚠️ Text too short to process.");
    return;
  }

  // Sanity check for binary garbage
  const sample = rawText.slice(0, 100);
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0E-\x1F]/.test(sample)) {
    console.warn(
      "🚨 BINARY DETECTED! Aborting text processing to prevent garbage index."
    );
    return;
  }

  try {
    const cleanText = rawText.replace(/\0/g, "").trim();
    console.log(`Processing document. Size: ${cleanText.length} chars.`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.splitText(cleanText);
    console.log(`ℹ️ Text split into ${docs.length} chunks.`);

    const embeddings = [];
    for (let i = 0; i < docs.length; i++) {
      const vector = await getEmbedding(docs[i]);
      embeddings.push({
        id: `doc-${Date.now()}-${i}`,
        text: docs[i],
        embedding: vector,
      });
    }

    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: null,
    });

    if (embeddings.length > 0) {
      await collection.add({
        ids: embeddings.map((e) => e.id),
        embeddings: embeddings.map((e) => e.embedding),
        metadatas: embeddings.map((e) => ({ text: e.text })),
      });
      console.log(`Inserted ${embeddings.length} embeddings.`);
    } else {
      console.warn("No embeddings generated. File might be empty.");
    }

    console.log("✅ Document processed and stored.");
    return true;
  } catch (error) {
    console.error("❌ Error processing document:", error);
    throw error;
  }
}

async function generateAnswer(context, query) {
  const prompt = `
    You are a smart and helpful assistant for a Shipping Dashboard application.
    
    INSTRUCTIONS:
    1. Analyze the user's question, which may be in English or Arabic.
    2. Analyze the provided Context, which is the knowledge base.
    3. **CRITICAL**: You MUST provide the final answer in **ARABIC** (اللغة العربية).
    4. If the question is in English, understand it, find the answer in the context, and TRANSLATE the answer to Arabic.
    5. **DATA ANALYSIS & PREDICTION**:
       - If the user provides structured data (like CSV/orders), act as a **Senior Data Analyst**.
       - Analyze trends, calculate totals, and identify patterns.
       - If asked for a "prediction" of the next 30 days, use the data trends to extrapolate a logical forecast. Explain your reasoning.
    6. **VISUAL REPORTS (CHARTS)**:
       - If the data involves numbers over time or comparisons (e.g. Sales per Month, Orders per Driver), YOU MUST provide a JSON block for a chart at the end of your response.
       - Format:
         \`\`\`json-chart
         {
           "type": "bar", // or "line"
           "title": "توقعات الأرباح الشهرية",
           "xLabel": "الشهر",
           "yLabel": "الإيرادات (جنيه مصري)",
           "data": [
             {"name": "أكتوبر", "value": 5000},
             {"name": "نوفمبر", "value": 7000}
           ]
         }
         \`\`\`
       - Ensure the JSON is valid and parsable.
    7. Be detailed, helpful, and polite. "Hold the user's hand" with step-by-step instructions if needed.
    
    Context:
    ${context}
    
    User Question: ${query}
    `;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that ALWAYS answers in Arabic.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    }
  );

  const data = await response.json();
  return data.choices[0].message.content;
}

// ================= INITIALIZATION =================
const DEFAULT_DOC_PATH = path.join(__dirname, "../../client/document.txt");

async function initDefaultDocument() {
  console.log("!!! FORCE RELOAD VERSION ACTIVE !!!");
  console.log("🔄 Checking for default document at:", DEFAULT_DOC_PATH);
  if (fs.existsSync(DEFAULT_DOC_PATH)) {
    try {
      console.log("🚀 Initializing default document (Clearing old data)...");
      const rawText = fs.readFileSync(DEFAULT_DOC_PATH, "utf-8");
      await processAndStoreDocument(rawText);
      console.log("✅ Default document loaded successfully.");
    } catch (error) {
      console.error("❌ Failed to load default document:", error);
    }
  } else {
    console.warn("⚠️ Default document.txt not found.");
  }
}

// Run init on start
initDefaultDocument();

// ================= API ENDPOINTS =================

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    console.log(
      `📂 File received: ${req.file.originalname} (${req.file.mimetype})`
    );
    const filePath = req.file.path;
    let rawText = "";

    const isPdf =
      req.file.mimetype === "application/pdf" ||
      req.file.originalname.toLowerCase().endsWith(".pdf");

    const isCsv =
      req.file.mimetype === "text/csv" ||
      req.file.mimetype === "application/vnd.ms-excel" ||
      req.file.originalname.toLowerCase().endsWith(".csv");

    const isImage =
      req.file.mimetype.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp)$/.test(req.file.originalname.toLowerCase());

    if (isPdf) {
      console.log("📄 Detected PDF. Parsing...");
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      rawText = data.text;
    } else if (isCsv) {
      console.log("📊 Detected CSV. Parsing...");
      rawText = await parseCSV(filePath);
    } else if (isImage) {
      console.log("📷 Detected Image. Performing OCR...");
      const {
        data: { text },
      } = await tesseract.recognize(filePath, "ara+eng");
      rawText = text;
    } else {
      console.log("📝 Detected Text File. Reading...");
      rawText = fs.readFileSync(filePath, "utf-8");
    }

    if (!rawText || !rawText.trim()) throw new Error("Parsed text is empty.");

    await processAndStoreDocument(rawText);
    fs.unlinkSync(filePath);
    res.json({ message: "Document processed successfully! Ready to chat." });
  } catch (error) {
    console.error("❌ Error in /upload:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "Question is required." });

    console.log(`💬 Received question: "${question}"`);
    const queryVector = await getEmbedding(question);
    const collection = await client.getCollection({ name: COLLECTION_NAME });

    const result = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 3,
    });

    console.log(
      "🔍 Retrieval Result Metadatas:",
      JSON.stringify(result.metadatas, null, 2)
    );

    const contextText =
      result.metadatas && result.metadatas[0] && result.metadatas[0].length > 0
        ? result.metadatas[0].map((m) => (m ? m.text : "")).join("\n---\n")
        : "";

    if (!contextText.trim()) {
      // If no context, just ask the AI without specific RAG context, or provide a default fallback
      // For now, let's just let it answer generally or say it doesn't know.
      // But better to give it a chance to answer general questions.
      console.log("⚠️ No context found in vector DB. Using empty context.");
    }

    const answer = await generateAnswer(contextText, question);
    res.json({ answer });
  } catch (error) {
    console.error("❌ Error in /chat:", error);
    res.status(500).json({ error: "Failed to generate answer." });
  }
});

module.exports = router;
