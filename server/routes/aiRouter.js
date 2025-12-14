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
const ShippingType = require("../models/ShippingType");
const Governotate = require("../models/Governotate");

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// ================= HELPER FUNCTIONS =================

// --- DYNAMIC SYSTEM CONTEXT (Fetch from DB) ---
async function fetchDynamicSystemContext(userType, userId) {
  try {
    // ---------------- COMMON DATA ----------------
    // Fetch Weight Settings (Everyone sees pricing)
    const weightSettings = await WeightSetting.findOne().sort({
      updatedAt: -1,
    });
    const kgPrice = weightSettings?.extraKgCost || 0;
    const villagePrice = weightSettings?.villageDeliveryCost || 0;
    const limitWeight = weightSettings?.defaultWeightLimit || 0;

    // 4. Fetch Served Areas (Cities & Governorates)
    const cities = await City.find({ isActive: true }).populate("governorate");
    const cityList = cities
      .map((c) => `${c.cityName} (${c.governorate?.govName})`)
      .join(", ");

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
      const currentUser = await User.findById(userId);
      // --- A. KEY METRICS ---
      const totalOrders = await Order.countDocuments();
      const totalUsers = await User.countDocuments();

      const statusCounts = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const statusMap = statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      // --- B. FINANCIALS DEEP DIVE (Corrected for Local Day) ---
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const financialStats = await Order.aggregate([
        {
          $group: {
            _id: { status: "$status", payment: "$paymentType" },
            total: { $sum: "$orderCost" },
            count: { $sum: 1 },
          },
        },
      ]);

      // Daily Financials
      const todayFinancials = await Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        {
          $group: {
            _id: { status: "$status" },
            total: { $sum: "$orderCost" },
          },
        },
      ]);

      let todayRealized = 0;
      let todayPotential = 0;
      todayFinancials.forEach((t) => {
        if (t._id.status === "Delivered") todayRealized += t.total;
        else if (["Pending", "Processing", "On the Way"].includes(t._id.status))
          todayPotential += t.total;
      });

      // All Time Financials
      let revenueCOD = 0;
      let revenuePrepaid = 0;
      let totalRealizedRevenue = 0;

      financialStats.forEach((stat) => {
        const { status, payment } = stat._id;
        if (status === "Delivered") {
          totalRealizedRevenue += stat.total;
        }

        if (payment === "واجبة التحصيل" || payment === "طرد مقابل طرد") {
          revenueCOD += stat.total;
        } else {
          revenuePrepaid += stat.total;
        }
      });

      // --- G. BUSINESS TIMELINE (FULL HISTORY) ---

      // 1. Get Monthly Order Stats (All Time - Broken down by Status)
      const monthlyOrders = await Order.aggregate([
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
        { $sort: { "_id.month": 1 } },
      ]);

      // 2. Get Monthly User Growth (All Time)
      const monthlyUsers = await User.aggregate([
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              type: "$userType",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // 3. Merge & Format Timeline
      const timelineMap = new Map();

      // Seed with Order Months
      monthlyOrders.forEach((m) => {
        const month = m._id.month;
        const status = m._id.status;

        if (!timelineMap.has(month)) {
          timelineMap.set(month, {
            totalOrderCount: 0,
            deliveredCount: 0,
            pendingCount: 0,
            cancelledCount: 0,
            realizedRevenue: 0,
            potentialRevenue: 0,
            newUsers: [],
          });
        }

        const entry = timelineMap.get(month);
        entry.totalOrderCount += m.count;

        if (status === "Delivered") {
          entry.deliveredCount += m.count;
          entry.realizedRevenue += m.revenue;
        } else if (status === "Cancelled") {
          entry.cancelledCount += m.count;
        } else {
          // Pending, Processing, On the Way, etc.
          entry.pendingCount += m.count;
          entry.potentialRevenue += m.revenue;
        }
      });

      // Merge User Data
      monthlyUsers.forEach((u) => {
        const month = u._id.month;
        const type = u._id.type;
        const count = u.count;

        if (!timelineMap.has(month)) {
          timelineMap.set(month, {
            totalOrderCount: 0,
            deliveredCount: 0,
            pendingCount: 0,
            cancelledCount: 0,
            realizedRevenue: 0,
            potentialRevenue: 0,
            newUsers: [],
          });
        }
        const entry = timelineMap.get(month);
        entry.newUsers.push(
          `${count} ${type === "courier" ? "Drivers" : type + "s"}`
        );
      });

      // Sort keys (Months) Descending for display (Newest First)
      const sortedMonths = Array.from(timelineMap.keys()).sort().reverse();

      const fullTimeline = sortedMonths
        .map((month) => {
          const data = timelineMap.get(month);
          const userGrowthStr =
            data.newUsers.length > 0
              ? ` | Added: +${data.newUsers.join(", +")}`
              : "";

          return `> [${month}]: ${data.totalOrderCount} Total Orders (${data.realizedRevenue} EGP Realized)
           - Breakout: ${data.deliveredCount} Delivered, ${data.pendingCount} Pending, ${data.cancelledCount} Cancelled${userGrowthStr}`;
        })
        .join("\n");

      // --- C. FULL PERSONNEL LISTS (No Limits) ---
      // 1. Merchants
      const merchants = await User.find({ userType: "merchant" }).select(
        "fullName phone storeName email"
      );
      const merchantList = merchants
        .map((m) => `- ${m.storeName || m.fullName} (${m.phone})`)
        .join("\n");

      // 2. Employees
      const employees = await User.find({ userType: "employee" }).select(
        "fullName phone email"
      );
      const employeeList = employees
        .map((e) => `- ${e.fullName} (${e.phone})`)
        .join("\n");

      // 3. Drivers (With Delivered Count)
      const drivers = await User.find({ userType: "courier" }).select(
        "fullName phone isAvailable assignedCities"
      );
      // Aggregate detailed delivery counts for each driver
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

      // --- D. FULL AREA COVERAGE ---
      const governorates = await Governotate.find({ isActive: true });
      const cities = await City.find({ isActive: true });

      const areaCoverage = governorates
        .map((gov) => {
          const govCities = cities.filter(
            (c) =>
              c.governorate && c.governorate.toString() === gov._id.toString()
          );
          const cityNames = govCities.map((c) => c.cityName).join(", ");
          return `- ${gov.govName}: [${cityNames}]`;
        })
        .join("\n");

      // --- E. SHIPPING & WEIGHT CONFIG ---
      const weightSettingsAdmin = await WeightSetting.findOne();
      const shippingTypesAdmin = await ShippingType.find({ isActive: true });

      const shippingConfigStr = weightSettingsAdmin
        ? `
      - Default Weight Limit: ${weightSettingsAdmin.defaultWeightLimit}kg
      - Extra Kg Cost: ${weightSettingsAdmin.extraKgCost} EGP
      - Village Delivery Fee: ${weightSettingsAdmin.villageDeliveryCost} EGP
      > Active Services:
      ${shippingTypesAdmin
        .map((s) => `- ${s.name}: +${s.adjustmentAmount} EGP`)
        .join("\n")}
      `
        : "Weight settings not configured.";

      // --- F. OPERATIONAL INSIGHTS ---
      // Cancellations
      const cancelledOrders = await Order.find({ status: "Cancelled" })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("orderNumber changeReason notes");

      const cancelSummary = cancelledOrders
        .map(
          (o) =>
            `- ${o.orderNumber}: ${
              o.changeReason || o.notes || "No reason logged"
            }`
        )
        .join("\n");

      // --- H. RECENT GLOBAL ACTIVITY & DETAILED STATUS ---

      // Detailed Status Breakdown
      const detailedStatusList = Object.entries(statusMap)
        .map(([status, count]) => `- ${status}: ${count}`)
        .join("\n");

      // Recent Global Orders (Stream)
      const recentGlobalOrders = await Order.find()
        .sort({ updatedAt: -1 })
        .limit(15)
        .select("orderNumber status orderCost city paymentType");

      const recentGlobalSummary = recentGlobalOrders
        .map(
          (o) =>
            `- #${o.orderNumber} (${o.status}) to ${o.city}: ${o.orderCost} EGP [${o.paymentType}]`
        )
        .join("\n");

      // KPI Calculations
      const deliverySuccessRate =
        totalOrders > 0
          ? (((statusMap["Delivered"] || 0) / totalOrders) * 100).toFixed(1)
          : "0";

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Admin"}
        - Role: Super Admin
        - Email: ${currentUser?.email || "N/A"}
        - Phone: ${currentUser?.phone || "N/A"}
        - Member Since: ${
          currentUser?.createdAt || currentUser?._id?.getTimestamp()
            ? new Date(
                currentUser.createdAt || currentUser._id.getTimestamp()
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })
            : "Unknown"
        }
        
        [EXECUTIVE DASHBOARD]
        - Total Orders: ${totalOrders}
        - Total Users: ${totalUsers}
        - Current Success Rate: ${deliverySuccessRate}%
        
        [DETAILED ORDER STATUS BREAKDOWN]
        ${detailedStatusList || "No orders found."}
        
        [RECENT GLOBAL ORDER STREAM (LAST 15)]
        ${recentGlobalSummary || "No recent activity."}
        
        [FINANCIAL REPORT (TODAY)]
        - **Realized Profit (Delivered): ${todayRealized} EGP** (Since 00:00 Local)
        - Pipeline Value (Pending): ${todayPotential} EGP
        
        [BUSINESS TIMELINE (FULL HISTORY)]
        ${fullTimeline || "No history available yet."}
        
        [FINANCIAL REPORT (ALL TIME)]
        - Total Realized Revenue: ${totalRealizedRevenue} EGP
        - COD Volume: ${revenueCOD} EGP
        - Prepaid Volume: ${revenuePrepaid} EGP

        [SHIPPING CONFIGURATION]
        ${shippingConfigStr}

        [FULL PERSONNEL DIRECTORY]
        > Employees:
        ${employeeList || "No employees found."}
        
        > Merchants:
        ${merchantList || "No merchants found."}
        
        > Drivers (Stats):
        ${driverList || "No drivers found."}

        [SERVICE AREA COVERAGE]
        ${areaCoverage || "No active areas."}

        [PROBLEM AREAS - RECENT CANCELLATIONS]
        ${cancelSummary || "None"}
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
        "fullName phone email storeName"
      );

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Merchant"}
        - Role: Merchant
        - Company: ${currentUser?.storeName || "N/A"}
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
    if (userType === "employee") {
      // 1. Fetch Current Employee Info
      const currentUser = await User.findById(userId).select(
        "fullName phone email"
      );

      // 2. Order Statistics (Full Access)
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: "Pending" });
      const deliveredOrders = await Order.countDocuments({
        status: "Delivered",
      });

      // 3. Financials (Order Values)
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

      let deliveredVal = 0;
      let pendingVal = 0;
      profitStats.forEach((stat) => {
        if (stat._id === "Delivered") deliveredVal = stat.totalCost;
        else if (["Pending", "Processing", "On the Way"].includes(stat._id))
          pendingVal += stat.totalCost;
      });

      // 4. Recent Orders
      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
      const recentSummary = recentOrders
        .map(
          (o) =>
            `- Order ${o.orderNumber}: ${o.status}, Val: ${o.orderCost}, to ${o.city}`
        )
        .join("\n");

      return `
        [CURRENT USER PROFILE]
        - Name: ${currentUser?.fullName || "Employee"}
        - Role: Employee
        - Phone: ${currentUser?.phone || "N/A"}

        [ORDER MANAGEMENT DASHBOARD]
        - Total Orders: ${totalOrders}
        - Pending/Processing: ${pendingOrders}
        - Delivered: ${deliveredOrders}
        
        [ORDER FINANCIALS (Today)]
        - Realized Value (Delivered): ${deliveredVal} EGP
        - Pipeline Value (Pending): ${pendingVal} EGP
        
        [RECENT ORDERS]
        ${recentSummary}
        
        [SERVED AREAS & RULES]
        - Cities: ${cityList || "No active cities."}
        - Pricing: Limit ${limitWeight}Kg, Extra ${kgPrice}EGP, Village ${villagePrice}EGP
        
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
      try {
        const vector = await getEmbedding(docs[i]);
        embeddings.push({
          id: `doc-${Date.now()}-${i}`,
          text: docs[i],
          embedding: vector,
        });
        // Throttle to avoid 429 errors from OpenRouter
        await new Promise((r) => setTimeout(r, 200));
      } catch (embErr) {
        console.warn(
          `⚠️ Skipped chunk ${i} due to embedding error:`,
          embErr.message
        );
      }
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

    ### STRICT SCOPE & REFUSAL PROTOCOL
    1. **DOMAIN**: You are ONLY allowed to answer questions about:
       - Shipping, Logistics, Orders, Deliveries.
       - Dashboard Data (Finance, Users, Charts).
       - Using this System.
    2. **REFUSAL**: If the user asks about ANYTHING else (e.g., General Knowledge, Cooking, Coding external apps, Life advice, Religion, Politics), you MUST Refuse.
    3. **REFUSAL MESSAGE**: Return EXACTLY this Arabic message:
       "عذرًا، أنا مساعد لوجستي فقط في هذا النظام ولا يمكنني الإجابة على أسئلة عامة خارج نطاق العمل."
    4. **NO EXCEPTIONS**: Do not be helpful for out-of-scope topics.
    
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
// --- RESTORED: Deep Study Feature (Indexing Orders & Users) ---
async function indexDatabaseContent() {
  try {
    console.log("📚 Starting Database Deep Study (Indexing)...");

    // Check if collection is ready/reachable
    try {
      await client.heartbeat();
    } catch (e) {
      console.warn("⚠️ ChromaDB Heartbeat failed. Skipping indexing.");
      return;
    }

    // 1. Index Orders (Limit 300 for performance/safety on startup)
    const orders = await Order.find()
      .limit(300)
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

// --- STARTUP ORCHESTRATION ---
(async () => {
  try {
    console.log("🚀 Starting Server Initialization...");
    // 1. Reset DB to clear old/duplicate data
    await resetCollection();
    // 2. Load Default Doc
    await initDefaultDocument();
    // 3. Index Database Data (Deep Study)
    await indexDatabaseContent();
    console.log("✅ Server Initialization Complete. AI is ready.");
  } catch (err) {
    console.error("❌ Server Initialization Failed:", err);
  }
})();

// ================= API ENDPOINTS =================

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

    // --- 1. PROCESS FILE (If attached) ---
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
          // For images, we just use OCR text as context
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

      // Streaming Response Headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      finalAnswer = await generateAnswer(
        retrievedContext,
        question,
        res,
        base64Image
      );
      return; // Response ended by generateAnswer stream
    }
  } catch (error) {
    console.error("❌ Error in /chat:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

module.exports = router;
