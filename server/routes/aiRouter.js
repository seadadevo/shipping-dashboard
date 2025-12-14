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

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const client = new ChromaClient();
const COLLECTION_NAME = "rag_knowledge_base";

const Order = require("../models/Order");
const WeightSetting = require("../models/WeightSetting");
const User = require("../models/User");
const City = require("../models/City");
const ShippingType = require("../models/ShippingType");
const Governotate = require("../models/Governotate");

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function fetchDynamicSystemContext(userType, userId) {
  try {
    const weightSettings = await WeightSetting.findOne().sort({
      updatedAt: -1,
    });
    const kgPrice = weightSettings?.extraKgCost || 0;
    const villagePrice = weightSettings?.villageDeliveryCost || 0;
    const limitWeight = weightSettings?.defaultWeightLimit || 0;

    const cities = await City.find({ isActive: true }).populate("governorate");
    const cityList = cities
      .map((c) => `${c.cityName} (${c.governorate?.govName})`)
      .join(", ");

    const governorates = await Governotate.find({ isActive: true });
    const govList = governorates.map((g) => g.govName).join(", ");

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

    if (userType === "admin") {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: "Pending" });
      const deliveredOrders = await Order.countDocuments({
        status: "Delivered",
      });
      const totalUsers = await User.countDocuments();

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
      const mongoose = require("mongoose");

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

      const currentUser = await User.findById(userId).select(
        "fullName phone email storeName createdAt"
      );

      // 1. Core Counts
      const myOrdersCount = await Order.countDocuments({ createdBy: userId });
      const myPending = await Order.countDocuments({
        createdBy: userId,
        status: "Pending",
      });
      const myDelivered = await Order.countDocuments({
        createdBy: userId,
        status: "Delivered",
      });

      // 2. Today's Financials
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
      let myRealized = 0,
        myPotential = 0;
      myStats.forEach((stat) => {
        if (stat._id === "Delivered") myRealized = stat.totalCost;
        else if (["Pending", "Processing", "On the Way"].includes(stat._id))
          myPotential += stat.totalCost;
      });

      // 3. Merchant Timeline (My Orders Only)
      const myMonthlyStats = await Order.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              status: "$status",
            },
            revenue: { $sum: "$orderCost" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": -1 } },
      ]);

      const myTimelineMap = new Map();
      myMonthlyStats.forEach((m) => {
        const month = m._id.month;
        if (!myTimelineMap.has(month))
          myTimelineMap.set(month, {
            total: 0,
            revenue: 0,
            delivered: 0,
            distinctStatuses: [],
          });

        const entry = myTimelineMap.get(month);
        entry.total += m.count;
        entry.distinctStatuses.push(`${m._id.status}: ${m.count}`);
        if (m._id.status === "Delivered") {
          entry.delivered += m.count;
          entry.revenue += m.revenue;
        }
      });

      const myTimelineStr = Array.from(myTimelineMap.keys())
        .map((month) => {
          const d = myTimelineMap.get(month);
          return `> [${month}]: ${d.total} Orders (${
            d.revenue
          } EGP Realized) | Status: ${d.distinctStatuses.join(", ")}`;
        })
        .join("\n");

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Merchant"}
        - Role: Merchant
        - Store: ${currentUser?.storeName || "N/A"}
        - Member Since: ${
          currentUser?.createdAt
            ? new Date(currentUser.createdAt).toLocaleDateString()
            : "Unknown"
        }

        [MERCHANT DASHBOARD]
        - Total Orders: ${myOrdersCount}
        - Pending: ${myPending} | Delivered: ${myDelivered}
        
        [FINANCIALS (Today)]
        - Realized: ${myRealized} EGP
        - Potential: ${myPotential} EGP

        [MY BUSINESS TIMELINE (Sales History)]
        ${myTimelineStr || "No history yet."}
        
        [SHIPPING CONFIG]
        - Weight Limit: ${limitWeight}kg | Extra: ${kgPrice}EGP | Village: ${villagePrice}EGP
        ${shippingSummary}
        `;
    }

    // ---------------- EMPLOYEE CONTEXT ----------------
    if (userType === "employee") {
      const currentUser = await User.findById(userId).select(
        "fullName phone email createdAt"
      );

      // 1. Global Counts
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: "Pending" });
      const deliveredOrders = await Order.countDocuments({
        status: "Delivered",
      });

      // 2. Operational Timeline (System Wide)
      const opsMonthlyStats = await Order.aggregate([
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": -1 } },
      ]);

      const opsTimelineMap = new Map();
      opsMonthlyStats.forEach((m) => {
        const month = m._id.month;
        if (!opsTimelineMap.has(month)) opsTimelineMap.set(month, []);
        opsTimelineMap.get(month).push(`${m._id.status}: ${m.count}`);
      });

      const opsTimelineStr = Array.from(opsTimelineMap.keys())
        .map((month) => {
          return `> [${month}]: ${opsTimelineMap.get(month).join(", ")}`;
        })
        .join("\n");

      // 3. Driver Roster (Key for Employees)
      const drivers = await User.find({ userType: "courier" }).select(
        "fullName phone isAvailable assignedCities"
      );
      const driverPerformance = await Order.aggregate([
        { $match: { status: "Delivered", assignedDriver: { $exists: true } } },
        { $group: { _id: "$assignedDriver", count: { $sum: 1 } } },
      ]);
      const driverMap = {};
      driverPerformance.forEach((d) => {
        driverMap[d._id.toString()] = d.count;
      });

      const driverList = drivers
        .map((d) => {
          const count = driverMap[d._id.toString()] || 0;
          return `- ${d.fullName} (${d.phone}) [${
            d.isAvailable ? "Available" : "Busy"
          }]: ${count} Delivered`;
        })
        .join("\n");

      // 4. Merchant Directory (New Addition)
      const merchants = await User.find({ userType: "merchant" }).select(
        "fullName phone storeName email"
      );
      const merchantList = merchants
        .map((m) => `- ${m.storeName || m.fullName} (${m.phone})`)
        .join("\n");

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Employee"}
        - Role: Employee
        - Member Since: ${
          currentUser?.createdAt
            ? new Date(currentUser.createdAt).toLocaleDateString()
            : "Unknown"
        }

        [OPERATIONAL DASHBOARD]
        - Total Orders: ${totalOrders}
        - Pending: ${pendingOrders} | Delivered: ${deliveredOrders}
        
        [OPERATIONAL TIMELINE (Monthly Volume)]
        ${opsTimelineStr || "No history."}
        
        [DRIVER ROSTER & PERFORMANCE]
        ${driverList || "No drivers."}

        [MERCHANT DIRECTORY]
        ${merchantList || "No merchants found."}
        
        [SHIPPING SERVICES]
        ${shippingSummary}
        `;
    }
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
    // Ignore if it doesn't exist
    console.log(
      `ℹ️ Collection '${COLLECTION_NAME}' did not exist or could not be deleted.`
    );
  }
}
// Fire and forget on startup
resetCollection();

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

    ### SYSTEM EXPERT PROTOCOL
    You are the **Master Controller** and **Chief Analyst** of this Shipping System.
    
    **YOUR KNOWLEDGE BASE:**
    - You know **ALL** Orders (Pending, Delivered, Cancelled).
    - You know **ALL** Users (Merchants, Employees, Drivers).
    - You know **ALL** Financials (Revenue, Profit, Pricing).
    - You know **ALL** Rules (Shipping Types, Cities, Weight Limits).

    **INSTRUCTIONS:**
    1. **ANSWER FREELY**: If the user asks about people, money, boxes, cities, or time -> **ANSWER IT**.
    2. **BE DIRECT**: Don't say "I will check". Say "Here is the data: ...".
    3. **REFUSAL POLICY (Lenient)**: 
       - ONLY refuse if the user asks about something **completely unrelated** to business (e.g., "How to bake a cake", "Who won the World Cup").
       - If you refuse, say: "أنا هنا فقط لمساعدتك في إدارة أعمالك ونظام الشحن."
    
    **EXAMPLES OF ALLOWED QUESTIONS:**
    - "Who are the merchants?" (YES)
    - "How much money did we make?" (YES)
    - "List all employees." (YES)
    - "What is the status of order #123?" (YES)
    
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
      role: "system",
      content:
        "You are a helpful assistant that ALWAYS answers in Arabic. You have access to LIVE shipping data.",
    },
  ];

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

    const reader = fetchResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

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

async function indexDatabaseContent() {
  try {
    console.log("📚 Starting Database Deep Study (Indexing)...");

    // 1. Index Orders
    const orders = await Order.find()
      .limit(2000)
      .select(
        "orderNumber status orderCost city paymentType changeReason notes createdAt"
      );
    if (orders.length > 0) {
      const orderText = orders
        .map(
          (o) =>
            `[Order Record] ID: #${o.orderNumber}, Status: ${o.status}, Cost: ${
              o.orderCost
            } EGP, Dest: ${o.city}, Pay: ${o.paymentType}, Date: ${new Date(
              o.createdAt
            ).toLocaleDateString()}` +
            (o.changeReason ? `, Reason: ${o.changeReason}` : "") +
            (o.notes ? `, Note: ${o.notes}` : "")
        )
        .join("\n");

      console.log(`📚 Indexing ${orders.length} Orders...`);
      await processAndStoreDocument(orderText);
    }

    // 2. Index Users (Drivers/Merchants)
    const users = await User.find().select(
      "fullName userType phone storeName email isAvailable"
    );
    if (users.length > 0) {
      const userText = users
        .map(
          (u) =>
            `[User Record] Role: ${u.userType}, Name: ${u.fullName}, Phone: ${u.phone}, Email: ${u.email}` +
            (u.storeName ? `, Store: ${u.storeName}` : "") +
            (u.isAvailable !== undefined ? `, Active: ${u.isAvailable}` : "")
        )
        .join("\n");

      console.log(`📚 Indexing ${users.length} Users...`);
      await processAndStoreDocument(userText);
    }

    console.log("✅ Database Study Complete.");
  } catch (err) {
    console.error("❌ Database Indexing Failed:", err);
  }
}

// Run init on start
(async () => {
  await initDefaultDocument();
  await indexDatabaseContent();
})();

router.post("/chat", upload.single("file"), async (req, res) => {
  try {
    const question = req.body.question;
    const file = req.file;
    const userId = req.body.userId;
    const userType = req.body.userType;

    // Check if we have at least one of them
    if (!question && !file) {
      return res
        .status(400)
        .json({ error: "Please provide a question or a file." });
    }

    console.log(
      `💬 Request: QuestionType=${typeof question}, QuestionValue="${question}", File=${
        file ? file.originalname : "None"
      }`
    );

    let fileContext = "";
    let base64Image = null;

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
        } else if (isCsv) {
          rawText = await parseCSV(filePath);
        } else if (isImage) {
          const {
            data: { text },
          } = await tesseract.recognize(filePath, "ara+eng");
          rawText = text;
        } else {
          rawText = fs.readFileSync(filePath, "utf-8");
        }

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
        }
      } catch (fileErr) {
        console.error("Error parsing file:", fileErr);

        return res
          .status(400)
          .json({ error: `Failed to process file: ${fileErr.message}` });
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    let finalAnswer = "";

    if (file && !question) {
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
      return;
    }

    if (question) {
      // RAG Search
      let ragContext = "";
      try {
        const queryVector = await getEmbedding(question);

        let collection;
        try {
          collection = await client.getCollection({ name: COLLECTION_NAME });
        } catch (e) {
          // Collection might not exist if just cleared or empty
          collection = await client.getOrCreateCollection({
            name: COLLECTION_NAME,
            embeddingFunction: null,
          });
        }

        const results = await collection.query({
          queryEmbeddings: [queryVector],
          nResults: 5, // Top 5 relevant facts
        });

        if (
          results.metadatas &&
          results.metadatas[0] &&
          results.metadatas[0].length > 0
        ) {
          // Extract text and join
          const validFacts = results.metadatas[0]
            .map((m) => m.text)
            .filter((t) => t && t.length > 5);
          if (validFacts.length > 0) {
            ragContext = `
              [RELEVANT DATABASE RECORDS (DEEP STUDY FACTS)]
              ${validFacts.join("\n\n")}
              `;
            console.log(
              `✅ Found ${validFacts.length} relevant facts via RAG.`
            );
          }
        }
      } catch (ragErr) {
        console.warn("⚠️ Vector Search warning:", ragErr.message);
      }

      // --- 3. FETCH DYNAMIC CONTEXT (Live Stats) ---
      const dynamicContext = await fetchDynamicSystemContext(userType, userId);

      // --- 4. ASSEMBLE PROMPT CONTEXT ---
      const context = `
      ${dynamicContext}
      
      ${ragContext}
      
      ${fileContext ? `[ATTACHED FILE CONTENT]:\n${fileContext}` : ""}
      `;
      // --- 5. GENERATE ANSWER ---
      // Streaming Response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await generateAnswer(context, question, res, base64Image);
      return;
    }

    // Default Fallback
    res.json({ answer: "No question provided." });
  } catch (error) {
    console.error("Router Error:", error);
    if (!res.headersSent)
      res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
