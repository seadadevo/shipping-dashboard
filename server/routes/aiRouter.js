const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const csv = require("csv-parser");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { ChromaClient } = require("chromadb");
const dotenv = require("dotenv");
dotenv.config();

// ================= CONFIGURATION =================
const router = express.Router();
const upload = multer({ dest: "uploads/" });
const client = new ChromaClient();
const COLLECTION_NAME = "rag_knowledge_base";

// ================= HELPER FUNCTIONS =================

async function getEmbedding(text) {
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

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", () => {
        // Convert CSV rows to a readable text summary
        // E.g. "Row 1: Client=ABC, Amount=500..."
        const textSummary = rows
          .map((row, index) => {
            const rowStr = Object.entries(row)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
            return `Record ${index + 1}: ${rowStr}`;
          })
          .join("\n");
        resolve(textSummary);
      })
      .on("error", (err) => reject(err));
  });
}

async function processAndStoreDocument(rawText) {
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

    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log("Cleared old collection.");
    } catch (e) {}

    const collection = await client.createCollection({
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
           "title": "Monthly Revenue Prediction",
           "xLabel": "Month",
           "yLabel": "Revenue (EGP)",
           "data": [
             {"name": "Oct", "value": 5000},
             {"name": "Nov", "value": 7000}
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

    if (isPdf) {
      console.log("📄 Detected PDF. Parsing...");
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      rawText = data.text;
    } else if (isCsv) {
      console.log("📊 Detected CSV. Parsing...");
      rawText = await parseCSV(filePath);
    } else {
      rawText = fs.readFileSync(filePath, "utf-8");
    }

    if (!rawText.trim()) throw new Error("Parsed text is empty.");

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
      result.metadatas && result.metadatas[0]
        ? result.metadatas[0].map((m) => (m ? m.text : "")).join("\n---\n")
        : "";

    if (!contextText.trim()) {
      return res.json({
        answer:
          "I don't have enough information in the current document to answer that.",
      });
    }

    const answer = await generateAnswer(contextText, question);
    res.json({ answer });
  } catch (error) {
    console.error("❌ Error in /chat:", error);
    res.status(500).json({ error: "Failed to generate answer." });
  }
});

module.exports = router;
