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
const mongoose = require("mongoose");

// ================= CONFIGURATION =================
const router = express.Router();
const upload = multer({ dest: "uploads/" });
const client = new ChromaClient();
const COLLECTION_NAME = "rag_knowledge_base";

// Import Models for Dynamic Data
const Order = require("../models/Order");
const WeightSetting = require("../models/WeightSetting");
const User = require("../models/User");
const City = require("../models/City");
<<<<<<< HEAD
const ShippingType = require("../models/ShippingType");
const Governotate = require("../models/Governotate");
=======
>>>>>>> 3b899f9 (enhance ai mode)

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// ================= HELPER FUNCTIONS =================

// --- DYNAMIC SYSTEM CONTEXT (Fetch from DB) ---
<<<<<<< HEAD
async function fetchDynamicSystemContext(userType, userId) {
  try {
    // ---------------- COMMON DATA ----------------
    // Fetch Weight Settings (Everyone sees pricing)
=======
async function fetchDynamicSystemContext() {
  try {
    // 1. Fetch Key Stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
    const totalUsers = await User.countDocuments();

    // 2. Fetch Weight Settings
>>>>>>> 3b899f9 (enhance ai mode)
    const weightSettings = await WeightSetting.findOne().sort({
      updatedAt: -1,
    });
    const kgPrice = weightSettings?.extraKgCost || 0;
    const villagePrice = weightSettings?.villageDeliveryCost || 0;
    const limitWeight = weightSettings?.defaultWeightLimit || 0;

<<<<<<< HEAD
    // 4. Fetch Served Areas (Cities & Governorates)
=======
    // 3. Fetch Active Drivers (Couriers)
    const drivers = await User.find({ userType: "courier" }).select(
      "fullName phone isAvailable assignedCities"
    );
    const driverSummary = drivers
      .map(
        (d) =>
          `- ${d.fullName} (${d.phone}) [${
            d.isAvailable ? "Available" : "Busy"
          }]`
      )
      .join("\n");

    // 4. Fetch Served Areas (Cities)
>>>>>>> 3b899f9 (enhance ai mode)
    const cities = await City.find({ isActive: true }).populate("governorate");
    const cityList = cities
      .map((c) => `${c.cityName} (${c.governorate?.govName})`)
      .join(", ");

<<<<<<< HEAD
    const governorates = await Governotate.find({ isActive: true });
    const govList = governorates.map((g) => g.govName).join(", ");

    // 5. Fetch Shipping Types
    const shippingTypes = await ShippingType.find();
    const shippingSummary = shippingTypes
      .map(
        (s) =>
          `- Type: ${s.name}, Cost Adjustment: ${
            s.adjustmentAmount
          } EGP, Time: ${s.minDeliveryDays}-${
            s.maxDeliveryDays
          } days, Description: ${s.description || "N/A"}`
      )
      .join("\n");

    // ---------------- ADMIN CONTEXT ----------------
    if (userType === "admin") {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: "Pending" });
      const deliveredOrders = await Order.countDocuments({
        status: "Delivered",
      });
      const totalUsers = await User.countDocuments();

      // Admin: Drivers List
      const drivers = await User.find({ userType: "courier" }).select(
        "fullName phone isAvailable assignedCities"
      );
      const driverSummary = drivers
        .map(
          (d) =>
            `- ${d.fullName} (${d.phone}) [${
              d.isAvailable ? "Available" : "Busy"
            }]`
        )
        .join("\n");

      // Admin: Financials
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const profitStats = await Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        {
          $group: {
            _id: "$status",
            totalCost: { $sum: "$orderCost" },
            count: { $sum: 1 },
          },
        },
      ]);

      let deliveredProfit = 0;
      let pendingProfit = 0;

      profitStats.forEach((stat) => {
        if (stat._id === "Delivered") {
          deliveredProfit = stat.totalCost;
        } else if (["Pending", "Processing", "On the Way"].includes(stat._id)) {
          pendingProfit += stat.totalCost;
        }
      });

      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
      const recentSummary = recentOrders
        .map(
          (o) =>
            `- Order ${o.orderNumber}: ${o.status}, Cost: ${o.orderCost}, to ${o.city}`
        )
        .join("\n");

      // Fetch Current Admin Info
      const currentUser = await User.findById(userId).select(
        "fullName phone email"
      );

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Admin"}
        - Role: Admin
        - Phone: ${currentUser?.phone || "N/A"}

        [ADMIN DASHBOARD - FULL ACCESS]
        - Total Orders: ${totalOrders}
        - Pending: ${pendingOrders} | Delivered: ${deliveredOrders}
        - Total Users: ${totalUsers}

        [FINANCIALS (Today)]
        - Realized (Delivered): ${deliveredProfit} EGP
        - Potential (Pending): ${pendingProfit} EGP
        - Total Today: ${deliveredProfit + pendingProfit} EGP

        [DRIVERS]
        ${driverSummary || "No drivers."}

        [AREAS]
        - Cities: ${cityList || "No active cities found."}
        - Governorates: ${govList || "No active governorates."}

        [SHIPPING TYPES & SERVICES]
        ${shippingSummary || "No specific shipping types defined."}

        [PRICING]
        - Weight Limit: ${limitWeight}Kg, Extra: ${kgPrice}EGP, Village: ${villagePrice}EGP

        [RECENT SYSTEM ACTIVITY]
        ${recentSummary}
        `;
    }

    // ---------------- MERCHANT CONTEXT ----------------
    if (userType === "merchant") {
      if (!userId) return "[Merchant Data Error: No ID]";

      // Need mongoose for ObjectId casting if stored as ObjectId
      const myOrdersCount = await Order.countDocuments({ createdBy: userId });
      const myPending = await Order.countDocuments({
        createdBy: userId,
        status: "Pending",
      });
      const myDelivered = await Order.countDocuments({
        createdBy: userId,
        status: "Delivered",
      });

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const myStats = await Order.aggregate([
        {
          $match: {
            createdBy: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: "$status",
            totalCost: { $sum: "$orderCost" },
            count: { $sum: 1 },
          },
        },
      ]);

      let myRealized = 0;
      let myPotential = 0;
      myStats.forEach((stat) => {
        if (stat._id === "Delivered") myRealized = stat.totalCost;
        else if (["Pending", "Processing", "On the Way"].includes(stat._id))
          myPotential += stat.totalCost;
      });

      const myRecent = await Order.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .limit(5);
      const myRecentSummary = myRecent
        .map(
          (o) => `- Order ${o.orderNumber}: ${o.status}, Cost: ${o.orderCost}`
        )
        .join("\n");

      // Fetch Current Merchant Info
      const currentUser = await User.findById(userId).select(
        "fullName phone email companyName"
      );

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Merchant"}
        - Role: Merchant
        - Company: ${currentUser?.companyName || "N/A"}
        - Phone: ${currentUser?.phone || "N/A"}

        [MERCHANT DASHBOARD - PERSONALIZED]
        - Your Total Orders: ${myOrdersCount}
        - Your Pending: ${myPending} | Delivered: ${myDelivered}
        
        [YOUR FINANCIALS (Today)]
        - Realized: ${myRealized} EGP
        - Potential: ${myPotential} EGP
        
        [AREAS SERVED]
        - Cities: ${cityList || "No active cities found."}
        - Governorates: ${govList || "No active governorates."}

        [SHIPPING TYPES & SERVICES]
        ${shippingSummary || "No specific shipping types defined."}

        [PRICING RULES]
        - Weight Limit: ${limitWeight}Kg, Extra: ${kgPrice}EGP, Village: ${villagePrice}EGP

        [YOUR RECENT ACTIVITY]
        ${myRecentSummary}
        `;
    }

    // ---------------- EMPLOYEE CONTEXT ----------------
    // Fetch Current Employee Info
    const currentUser = await User.findById(userId).select(
      "fullName phone email"
    );

    return `
    [CURRENT USER PROFILE]
    - Name: ${currentUser?.fullName || "Employee"}
    - Role: Employee
    - Phone: ${currentUser?.phone || "N/A"}

    [EMPLOYEE VIEW]
    - Access to General Shipping Rules.
    - No Financial Access.
    - No Driver List Access.
    
    [SERVED AREAS]
    - Cities: ${cityList || "No active cities found."}
    - Governorates: ${govList || "No active governorates."}

    [SHIPPING TYPES & SERVICES]
    ${shippingSummary || "No specific shipping types defined."}
    
    [PRICING RULES]
    - Standard Weight Limit: ${limitWeight} Kg, Extra: ${kgPrice}EGP, Village: ${villagePrice}EGP
=======
    // 5. Calculate Daily Profit (Sum of orderCost for today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const profitStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: "$orderCost" },
          count: { $sum: 1 },
        },
      },
    ]);
    const dailyProfit = profitStats[0]?.totalProfit || 0;
    const dailyOrdersCount = profitStats[0]?.count || 0;

    // 6. Fetch Recent Activity (Last 5 orders)
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    const recentSummary = recentOrders
      .map(
        (o) =>
          `- Order ${o.orderNumber}: ${o.status}, Cost: ${o.orderCost}, to ${o.city}`
      )
      .join("\n");

    return `
    [LIVE SYSTEM DASHBOARD]
    - Total Registered Users: ${totalUsers}
    - Total Orders (All Time): ${totalOrders}
    - Pending Orders: ${pendingOrders}
    - Delivered Orders: ${deliveredOrders}
    - Orders Today: ${dailyOrdersCount}
    - PROFIT TODAY: ${dailyProfit} EGP

    [OUR FLEET & DRIVERS]
    ${driverSummary || "No drivers currently registered."}

    [SERVED AREAS]
    ${cityList || "No active cities found."}
    
    [PRICING RULES]
    - Standard Weight Limit: ${limitWeight} Kg
    - Cost per Extra Kg: ${kgPrice} EGP
    - Village Delivery Surcharge: ${villagePrice} EGP
    
    [RECENT ACTIVITY]
    ${recentSummary}
>>>>>>> 3b899f9 (enhance ai mode)
    `;
  } catch (err) {
    console.error("Error fetching dynamic context:", err);
    return "[System Data Unavailable]";
  }
}

// --- RESET DB ON STARTUP (Fix for Garbage Data) ---
async function resetCollection() {
  try {
    console.log(
      `🧹 Attempting to delete collection '${COLLECTION_NAME}' to clear old data...`
    );
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log(`✅ Collection '${COLLECTION_NAME}' deleted.`);
  } catch (e) {
    if (e.code === "ECONNREFUSED" || e.message.includes("fetch failed")) {
      console.warn(`⚠️ ChromaDB not reachable. RAG features will be disabled.`);
    } else {
      console.log(`ℹ️ Collection '${COLLECTION_NAME}' status: ${e.message}`);
    }
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

async function generateAnswer(context, query, res = null, base64Image = null) {
  const prompt = `
    You are a **Strategic Data Analyst & Logistics Consultant** for a Shipping Company.
    
    ### CORE DIRECTIVES
    1. **LANGUAGE**: Your response must be in **Professional Business Arabic** (العربية الفصحى المهنية).
    2. **ROLE**: Act as a senior consultant. Don't just read numbers; explain *why* they matter.
    3. **NO GENERICS**: Avoid phrases like "Perform better". Instead say "Increase delivery efficiency by 15% using...".
    
    ### ANALYSIS FRAMEWORK
    When analyzing data (CSV/PDF/Image):
    1. **Scan**: Identify totals, dates, and key metrics.
    2. **Trend**: Is performance going up or down? By how much? (Calculate percentages).
    3. **Insight**: What is the root cause? (e.g., "High costs in Village regions").
    4. **Recommendation**: actionable next step.

    ### PREDICTION LOGIC (If asked to predict)
    - **Extrapolate**: If Oct=50, Nov=70, then Dec should be ~90. Explain this linear growth.
    - **Risk**: Mention potential risks (e.g., "Unless shipping costs rise...").
    
    ### VISUALIZATION (Chart Requirment)
    If the user asks for a report, comparison, or trend, you **MUST** append a JSON chart block.
    
    Format:
    \`\`\`json-chart
    {
      "type": "bar", // Use "line" for trends over time, "bar" for comparisons
      "title": "عنوان الرسم البياني",
      "xLabel": "المحور السيني",
      "yLabel": "المحور الصادي",
      "data": [
        {"name": "عنصر 1", "value": 10},
        {"name": "عنصر 2", "value": 25}
      ]
    }
    \`\`\`
    
    ### CONTEXT & QUERY
    [SYSTEM CONTEXT]:
    ${context}
    
    [USER QUESTION]:
    ${query}
  `;

  // Construct Messages Payload
  const messages = [
    {
<<<<<<< HEAD
      role: "system",
      content:
        "You are a helpful assistant that ALWAYS answers in Arabic. You have access to LIVE shipping data.",
    },
  ];
=======
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
              "You are a helpful assistant that ALWAYS answers in Arabic. You have access to LIVE shipping data.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    }
  );
>>>>>>> 3b899f9 (enhance ai mode)

  if (base64Image) {
    // Vision Payload
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text:
            prompt +
            "\n\n[SYSTEM NOTE: The user has attached an image for analysis. Use your Vision capabilities to analyze it.]",
        },
        {
          type: "image_url",
          image_url: {
            url: base64Image, // Now checks for full data URI passed from caller
          },
        },
      ],
    });
  } else {
    // Standard Text Payload
    messages.push({ role: "user", content: prompt });
  }

  try {
    const fetchResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.2,
          stream: !!res, // Enable streaming if res is active
        }),
      }
    );

    if (!res) {
      // Non-streaming fallback (e.g. for internal use, though not used currently)
      const data = await fetchResponse.json();
      return data.choices?.[0]?.message?.content || "No response.";
    }

    // --- STREAMING HANDLER ---
    // We expect OpenRouter/OpenAI SSE format: "data: {...}"
    const reader = fetchResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = ""; // Keep for logging or fallback

    // Set headers for streaming if not already set by caller?
    // Usually caller shouldn't set json content-type if we are streaming text/plain or SSE.
    // We'll trust the caller (route handler) to manage headers or we do it here?
    // Route handler should've handled it. We just write to res.

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // OpenRouter sends SSE lines: data: {"id":..., "choices":[{"delta":{"content":"..."}}]}

      const lines = chunk.split("\n").filter((line) => line.trim() !== "");
      for (const line of lines) {
        if (line.includes("[DONE]")) continue;
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.replace("data: ", "");
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) {
              res.write(content);
              fullText += content;
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }
    }

    res.end(); // Close stream
    return fullText;
  } catch (err) {
    console.error("Generate Answer Error:", err);
    if (res) {
      res.write("\n[System Error: Failed to generate response]");
      res.end();
    }
    return "[Error]";
  }
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

router.post("/chat", upload.single("file"), async (req, res) => {
  try {
    const question = req.body.question;
    const file = req.file;
<<<<<<< HEAD
    const userId = req.body.userId;
    const userType = req.body.userType;
=======
>>>>>>> 2975ddb (enhance to read diffrent files type)

    // Check if we have at least one of them
    if (!question && !file) {
      return res
        .status(400)
        .json({ error: "Please provide a question or a file." });
    }

    console.log(
<<<<<<< HEAD
      `💬 Request: QuestionType=${typeof question}, QuestionValue="${question}", File=${
        file ? file.originalname : "None"
      }`
=======
      `💬 Request: Text="${question || "None"}", File="${
        file ? file.originalname : "None"
      }"`
>>>>>>> 2975ddb (enhance to read diffrent files type)
    );

    // --- 1. PROCESS FILE (If attached) ---
    let fileContext = "";
<<<<<<< HEAD
    let base64Image = null;
=======
>>>>>>> 2975ddb (enhance to read diffrent files type)

    if (file) {
      console.log(`📂 Processing attached file: ${file.originalname}`);
      const filePath = file.path;
      let rawText = "";

      const isPdf =
        file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf");
      const isCsv =
        file.mimetype === "text/csv" ||
        file.mimetype === "application/vnd.ms-excel" ||
        file.originalname.toLowerCase().endsWith(".csv");
      const isImage =
        file.mimetype.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp)$/.test(file.originalname.toLowerCase());

      try {
<<<<<<< HEAD
        if (isImage) {
          // Read image as Base64 for Vision API
          const imageBuffer = fs.readFileSync(filePath);
          // Construct full Data URI with correct Mime Type
          base64Image = `data:${file.mimetype};base64,${imageBuffer.toString(
            "base64"
          )}`;
        }

        if (isPdf) {
          console.log("📄 Detected PDF. Reading file...");
          const dataBuffer = fs.readFileSync(filePath);
          console.log(`📄 PDF Buffer Size: ${dataBuffer.length} bytes`);
          try {
            const data = await pdf(dataBuffer);
            rawText = data.text;
            console.log(
              `📄 PDF Extraction Success. Text Length: ${rawText.length}`
            );
          } catch (pdfErr) {
            console.error("❌ PDF Parse Error:", pdfErr);
            rawText = ""; // Treat as empty if parsing crashes
          }
=======
        if (isPdf) {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdf(dataBuffer);
          rawText = data.text;
>>>>>>> 2975ddb (enhance to read diffrent files type)
        } else if (isCsv) {
          rawText = await parseCSV(filePath);
        } else if (isImage) {
          // For images, we just use OCR text as context
          const {
            data: { text },
          } = await tesseract.recognize(filePath, "ara+eng");
          rawText = text;
        } else {
          rawText = fs.readFileSync(filePath, "utf-8");
        }

<<<<<<< HEAD
        console.log(
          `🔍 Extracted Text Length: ${rawText ? rawText.length : 0} chars`
        );
        if (rawText && rawText.length < 200)
          console.log(`🔍 Preview: ${rawText}`);

        // Index file into Vector DB, preserving Base Document context.
        // Index file into Vector DB, preserving Base Document context.
        // ENFORCE MINIMUM CONTENT: Stricter for PDF to catch scanned files. Relaxed for TXT/CSV.
        const minLength = isPdf ? 5 : 1; // WAS 50. Lowered to 5 to allow simple test PDFs.
        if (rawText && rawText.trim().length > minLength) {
          try {
            await processAndStoreDocument(rawText);
          } catch (ragErr) {
            console.warn(
              "⚠️ RAG Indexing failed (continuing with raw text):",
              ragErr.message
            );
          }
          fileContext = rawText; // Keep a reference
        } else {
          console.log(
            `⚠️ File text too short (<${minLength} chars), treating as empty/scanned.`
          );
          fileContext = ""; // Force empty to trigger the smart error handler
=======
        // Index file into Vector DB, preserving Base Document context.
        if (rawText && rawText.trim()) {
          await processAndStoreDocument(rawText);
          fileContext = rawText; // Keep a reference
>>>>>>> 2975ddb (enhance to read diffrent files type)
        }
      } catch (fileErr) {
        console.error("Error parsing file:", fileErr);
        // Continue even if file fails? Or throw? Let's inform user.
        return res
          .status(400)
          .json({ error: `Failed to process file: ${fileErr.message}` });
      } finally {
        // Cleanup temp file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    // --- 2. DETERMINE RESPONSE STRATEGY ---

    let finalAnswer = "";

    // CASE A: File ONLY (No question)
    // -> Provide a summary or confirmation
    if (file && !question) {
<<<<<<< HEAD
      console.log(
        `🔍 CASE A TRIGGERED: File Only. ContextLen=${
          fileContext.length
        }, hasBase64=${!!base64Image}`
      );
      if (fileContext || base64Image) {
        // Ask AI to summarize the new content
        const summaryPrompt =
          "I have uploaded a file (content is embedded above/below). Please analyze it and give me a comprehensive summary in Arabic.";

        // Explicitly format the context for CASE A so AI knows this IS the file
        const formattedContext = fileContext
          ? `\n=============== [EMBEDDED FILE CONTENT START] ===============\n${fileContext}\n=============== [EMBEDDED FILE CONTENT END] ===============\n`
          : "";

        // Stream the summary
        res.setHeader("Content-Type", "text/plain; charset=utf-8"); // Optional: Consider Transfer-Encoding chunked
        await generateAnswer(formattedContext, summaryPrompt, res, base64Image);
      } else {
        // Smart Error Handling
        if (isPdf) {
          return res.json({
            answer: `⚠️ **عذراً، لم أتمكن من استخراج نص من هذا الملف (PDF).**\n\n- يبدو أن الملف "ممسوح ضوئياً" (Scanned) أو عبارة عن صور.\n- ✨ **الحل:** يرجى التقاط **لقطة شاشة (Screenshot)** للصفحة ورفعها كصورة. سأستخدم "عيوني" الذكية (Vision) لقراءتها فوراً!`,
          });
        }
        return res.json({
          answer: `✅ تم رفع الملف **${file.originalname}** بنجاح، ولكن لم أتمكن من قراءة النص بوضوح. حاول رفعه كصورة أو ملف نصي.`,
        });
      }
      return; // End response handled by stream or fast return
=======
      if (fileContext) {
        // Ask AI to summarize the new content
        const summaryPrompt =
          "I just uploaded this file. Please analyze it briefly and give me a summary of what it contains in Arabic.";
        finalAnswer = await generateAnswer(fileContext, summaryPrompt);
      } else {
        finalAnswer = `✅ تم رفع الملف **${file.originalname}** بنجاح. النص فيه غير واضح أو فارغ.`;
      }
      return res.json({ answer: finalAnswer });
>>>>>>> 2975ddb (enhance to read diffrent files type)
    }

    // CASE B: Question (with or without File)
    // -> RAG Search + Answer
    if (question) {
      // RAG Search
      const queryVector = await getEmbedding(question);
      const collection = await client.getCollection({ name: COLLECTION_NAME });

      const result = await collection.query({
        queryEmbeddings: [queryVector],
        nResults: 3,
      });

      let retrievedContext =
        result.metadatas && result.metadatas[0]
          ? result.metadatas[0].map((m) => (m ? m.text : "")).join("\n---\n")
          : "";

<<<<<<< HEAD
<<<<<<< HEAD
      // If we just uploaded a file, prioritize its context if RAG didn't find it yet
      // But to be safe and "immediate", we can prepend the fileContext to the retrieved context

      // --- INJECT DYNAMIC SYSTEM DATA ---
      const systemContext = await fetchDynamicSystemContext(userType, userId);

      retrievedContext = `
      ${systemContext}

      ${
        fileContext
          ? `\n=============== [EMBEDDED FILE CONTENT START] ===============\n${fileContext}\n=============== [EMBEDDED FILE CONTENT END] ===============\n(Please analyze the content above)`
          : ""
      }

      [EXISTING KNOWLEDGE BASE]:
      ${retrievedContext}
      `;

      finalAnswer = await generateAnswer(
        retrievedContext,
        question,
        res,
        base64Image
      );
      return; // Response ended by generateAnswer stream
=======
      // If we just uploaded a file, prioritize its context if RAG didn't find it yet (though processAndStore does insert it)
=======
      // If we just uploaded a file, prioritize its context if RAG didn't find it yet
>>>>>>> 3b899f9 (enhance ai mode)
      // But to be safe and "immediate", we can prepend the fileContext to the retrieved context

      // --- INJECT DYNAMIC SYSTEM DATA ---
      const systemContext = await fetchDynamicSystemContext();

      retrievedContext = `
      ${systemContext}

      ${fileContext ? `[FRESHLY UPLOADED FILE CONTENT]:\n${fileContext}\n` : ""}

      [EXISTING KNOWLEDGE BASE]:
      ${retrievedContext}
      `;

      finalAnswer = await generateAnswer(retrievedContext, question);
      return res.json({ answer: finalAnswer });
>>>>>>> 2975ddb (enhance to read diffrent files type)
    }
  } catch (error) {
    console.error("❌ Error in /chat:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

module.exports = router;
