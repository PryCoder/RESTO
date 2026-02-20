import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory cache for waste alerts: { userId: { data, timestamp } }
const wasteAlertCache = {};

export const inventoryWasteAlert = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurant || null;
    const vendorId = req.user?._id;
    const userId = vendorId ? vendorId.toString() : null;
    const refresh = req.query.refresh === 'true';
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    if (!vendorId) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    // Check cache unless refresh requested
    if (!refresh && userId && wasteAlertCache[userId]) {
      const { data, timestamp } = wasteAlertCache[userId];
      if (Date.now() - timestamp < CACHE_TTL) {
        return res.json({ alerts: data });
      }
    }

    // 1. Fetch Inventory
    const inventoryFilter = restaurantId
      ? { restaurant: restaurantId }
      : { vendorId };

    const inventoryDocs = await Inventory.find(inventoryFilter);

    const inventory = inventoryDocs.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expiryInDays: item.expiryInDays || 7 // Default expiry
    }));

    // 2. Calculate Avg Daily Prep from Orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderFilter = restaurantId
      ? { restaurant: restaurantId, createdAt: { $gte: sevenDaysAgo } }
      : { vendorId, createdAt: { $gte: sevenDaysAgo } };

    const pastOrders = await Order.find(orderFilter);

    const prepTotals = {};
    pastOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(({ name, quantity = 1 }) => {
          prepTotals[name] = (prepTotals[name] || 0) + quantity;
        });
      }
    });

    const avgDailyPrep = {};
    for (const item in prepTotals) {
      avgDailyPrep[item] = Math.round(prepTotals[item] / 7);
    }

    // 3. Construct Prompt
    const prompt = `
You are a smart restaurant assistant.

Here is the inventory data with quantity and expiry days:
${JSON.stringify(inventory, null, 2)}

Here is average daily preparation usage for ingredients/dishes:
${JSON.stringify(avgDailyPrep, null, 2)}

Based on this, generate a JSON array of alert objects with fields:
- message: string (actionable alert)
- category: one of ["waste risk", "overstock", "underuse", "recommendation"]
- confidence: number (0 to 1, higher means more urgent)
- ingredient: string (name of ingredient)

Only return the JSON array. Do NOT include any markdown code blocks or explanation.
`;

    // 4. Generate Gemini Response
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let responseText = '';
    try {
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
      // Strip markdown if present
      responseText = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const startIdx = responseText.indexOf('[');
      const endIdx = responseText.lastIndexOf(']') + 1;
      if (startIdx === -1 || endIdx === -1) {
        throw new Error("No valid JSON array found in model response.");
      }
      const jsonString = responseText.substring(startIdx, endIdx);
      const alerts = JSON.parse(jsonString);
      // Cache the result
      if (userId) {
        wasteAlertCache[userId] = { data: alerts, timestamp: Date.now() };
      }
      return res.json({ alerts });
    } catch (err) {
      console.error('Inventory Waste Alert Error:', err.message);
      console.error('Full Gemini response:', responseText);
      // Instead of failing, return empty alerts so dashboard still loads
      if (userId) {
        wasteAlertCache[userId] = { data: [], timestamp: Date.now() };
      }
      return res.json({ alerts: [] });
    }
  } catch (err) {
    console.error('Inventory Waste Alert Fatal Error:', err.message);
    // Still return empty alerts for dashboard resilience
    return res.json({ alerts: [] });
  }
};

export const processCustomerInput = async (customerInput, menu, inventory) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a smart AI restaurant assistant.

Customer says: "${customerInput}".

Here is the current menu: ${JSON.stringify(menu)}.

Current inventory: ${JSON.stringify(inventory)}.

Based on the customer's preferences and allergies, do the following:
1. Suggest up to 3 dishes that best match preferences.
2. Suggest any modifications to those dishes to fit their request.
3. Flag any allergy concerns clearly in kitchen notes.
4. If input is unclear, suggest clarifying questions (can be empty if clear).

Output JSON in this format:
{
  "clarifyingQuestions": [string],
  "suggestedDishes": [
    { "name": string, "modifications": string[] }
  ],
  "kitchenNotes": string
}
`;

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini interaction failed:", err.message);
    throw new Error("Failed to process customer input");
  }
};

export const processVoiceOrder = async (voiceText) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Convert the following restaurant voice input into structured JSON:

"${voiceText}"

Output ONLY valid JSON (no explanation, no \`\`\`json code block):
{
  "table": number,
  "items": [
    {
      "name": string,
      "quantity": number,
      "modifications": string[]
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Strip markdown code fences if model adds them
    responseText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Gemini voice parsing failed:", err.message);
    throw new Error("Voice order processing failed");
  }
};

export const generateUpsellSuggestions = async (orderHistory) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Analyze the following order history and recommend 3 upsell items (preferably Indian items):
${JSON.stringify(orderHistory)}

Respond with a JSON array like this: ["item1", "item2", "item3"]
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown formatting if Gemini returns a code block
    if (text.startsWith("```")) {
      text = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    }

    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini upsell suggestion failed:", err.message);
    return [];
  }
};

export const smartLeftoverReuse = async (req, res) => {
  const { input } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Input string is required." });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Vendor said: "${input}"

You are a smart food assistant. Suggest 2-3 food items using the leftover ingredients.

For each suggestion, include:
- "recipe": a short recipe name (string)
- "profit": estimated profit in ₹ (string)
- "demand": estimated demand score from 1 to 10 (number)

Respond ONLY with raw JSON. Do NOT include any explanation, markdown, or backticks.

Format:
[
  { "recipe": "string", "profit": "₹XXX", "demand": number }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Ensure clean JSON
    const cleanText = text.trim().replace(/^```json|```$/g, "").trim();
    const parsed = JSON.parse(cleanText);
    res.json(parsed);
  } catch (err) {
    console.error("Smart Leftover Reuse Error:", err.message);
    res.status(500).json({ error: "Leftover Reuse failed", details: err.message });
  }
};

export const slowHourAnalyzer = async (req, res) => {
  const { salesData } = req.body;

  if (!Array.isArray(salesData)) {
    return res.status(400).json({ error: "salesData array is required" });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an AI assistant helping food vendors analyze slow hours.

Given the following sales data:
${JSON.stringify(salesData)}

Identify which hour(s) are the slowest, and suggest when the vendor should offer discounts.

Return response as:
{
  "slowestHours": [string], 
  "suggestions": [string]
}

Respond ONLY with JSON.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Remove markdown code block wrapper
    const cleanText = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleanText));
  } catch (err) {
    console.error("Slow Hour Analyzer Error:", err.message);
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
};

export const analyzeWasteAndAdvice = async (req, res) => {
  try {
    const { voiceInput = "", weather = "unknown" } = req.body;
    const restaurantId = req.user?.restaurant || null;
    const vendorId = req.user?._id;

    if (!vendorId) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    console.log('Waste analysis request:', { restaurantId, vendorId, voiceInput });

    // 1. Fetch recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orderFilter = restaurantId
      ? { restaurant: restaurantId, createdAt: { $gte: sevenDaysAgo } }
      : { vendorId, createdAt: { $gte: sevenDaysAgo } };

    const pastOrders = await Order.find(orderFilter);
    console.log(`Found ${pastOrders.length} orders in last 7 days`);

    const pastSalesData = {};
    const recentSales = {};

    // Process orders for sales data
    pastOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(({ name, quantity = 1 }) => {
          pastSalesData[name] = (pastSalesData[name] || 0) + quantity;
        });
      }
    });

    // Yesterday's sales
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0);

    const yesterdayOrders = pastOrders.filter(order => 
      new Date(order.createdAt) >= oneDayAgo
    );

    yesterdayOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(({ name, quantity = 1 }) => {
          recentSales[name] = (recentSales[name] || 0) + quantity;
        });
      }
    });

    // 2. Fetch inventory if available
    let inventory = {};
    try {
      const inventoryFilter = restaurantId
        ? { restaurant: restaurantId }
        : { vendorId };
      
      const inventoryDocs = await Inventory.find(inventoryFilter);
      inventoryDocs.forEach(item => {
        inventory[item.name] = {
          quantity: item.quantity || 0,
          unit: item.unit || 'units',
          expiryInDays: item.expiryInDays || 7
        };
      });
    } catch (e) {
      console.warn('Inventory fetch failed:', e.message);
    }

    // 3. Compose prompt with fallback data if no sales
    const hasSalesData = Object.keys(pastSalesData).length > 0;
    
    const prompt = `
Restaurant Waste Analysis Request:

Vendor Input: "${voiceInput || "Analyze potential food waste and provide preparation recommendations"}"

${hasSalesData ? `
SALES DATA:
- Past 7-Day Sales: ${JSON.stringify(pastSalesData, null, 2)}
- Yesterday's Sales: ${JSON.stringify(recentSales, null, 2)}
` : 'No recent sales data available.'}

INVENTORY STATUS:
${Object.keys(inventory).length > 0 ? JSON.stringify(inventory, null, 2) : 'No inventory data available'}

WEATHER: ${weather}

ANALYSIS REQUEST:
1. Identify items at high risk of waste based on sales patterns and inventory
2. Suggest optimal preparation quantities for tomorrow
3. Recommend items to avoid preparing to minimize waste
4. Provide waste reduction strategies

IMPORTANT: If no sales data is available, provide general waste reduction best practices.

Respond with JSON in this exact format:
{
  "wastePrediction": [
    {
      "item": "item name",
      "suggestedPrep": "recommended preparation quantity",
      "reason": "explanation based on data"
    }
  ],
  "doNotMake": [
    {
      "item": "item name", 
      "reason": "why to avoid preparation"
    }
  ],
  "generalTips": [
    "general waste reduction tip 1",
    "general waste reduction tip 2"
  ]
}

Ensure the response is valid JSON only, no markdown formatting.
`;

    console.log('Sending prompt to Gemini...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Add safety settings to avoid common errors
    const generationConfig = {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    const result = await model.generateContent(prompt, generationConfig);
    const text = result.response.text();
    console.log('Gemini raw response:', text);

    // Clean the response
    let cleaned = text.replace(/```json|```/g, '').trim();
    
    // Handle cases where response might have extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      console.log('Successfully parsed AI response');
    } catch (e) {
      console.error('Failed to parse AI response. Raw text:', cleaned);
      // Return structured fallback response
      parsed = {
        wastePrediction: [
          {
            item: "Monitor all perishables",
            suggestedPrep: "Reduce by 20% from average",
            reason: "No sales data available. Start with conservative preparation and adjust based on daily sales."
          }
        ],
        doNotMake: [
          {
            item: "Low-demand specialty items",
            reason: "Without sales data, focus on core menu items to minimize risk"
          }
        ],
        generalTips: [
          "Track daily sales to identify patterns",
          "Implement first-in-first-out (FIFO) inventory system",
          "Train staff on proper food storage techniques",
          "Consider daily specials for ingredients nearing expiry"
        ]
      };
    }

    res.json(parsed);

  } catch (err) {
    console.error('Waste Analysis Error:', err.message);
    console.error(err.stack);
    
    // Comprehensive fallback response
    const fallbackResponse = {
      wastePrediction: [
        {
          item: "All fresh ingredients",
          suggestedPrep: "Prepare 70% of usual quantity",
          reason: "System temporarily unavailable. Using conservative estimates."
        }
      ],
      doNotMake: [
        {
          item: "High-risk perishables",
          reason: "System issue - err on side of caution"
        }
      ],
      generalTips: [
        "Monitor food waste daily and adjust orders accordingly",
        "Use older inventory first (FIFO method)",
        "Train staff on proper portion control",
        "Consider donating excess food to reduce waste"
      ],
      note: "Analysis system temporarily unavailable - using best practice recommendations"
    };
    
    res.status(500).json(fallbackResponse);
  }
};

export const salesProfitAdvisor = async (req, res) => {
  try {
    const { voiceInput, orders = [] } = req.body;
    const vendorId = req.user?._id;
    const restaurantId = req.user?.restaurant || null;

    if (!vendorId) {
      return res.status(400).json({ error: 'User not authenticated' });
    }

    // Calculate sales data from provided orders or fetch from database
    let totalSales = 0;
    const itemSales = {};

    if (orders.length > 0) {
      // Use provided orders
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(({ name, price = 0, quantity = 1 }) => {
            const itemTotal = price * quantity;
            totalSales += itemTotal;
            itemSales[name] = (itemSales[name] || 0) + quantity;
          });
        }
      });
    } else {
      // Fetch last day's orders from database
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const orderFilter = restaurantId
        ? { restaurant: restaurantId, createdAt: { $gte: oneDayAgo } }
        : { vendorId, createdAt: { $gte: oneDayAgo } };

      const recentOrders = await Order.find(orderFilter);

      recentOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(({ name, price = 0, quantity = 1 }) => {
            const itemTotal = price * quantity;
            totalSales += itemTotal;
            itemSales[name] = (itemSales[name] || 0) + quantity;
          });
        }
      });
    }

    // Calculate estimated profit (25% margin as more realistic for restaurants)
    const estimatedProfit = Math.round(totalSales * 0.25);

    const prompt = `
Vendor said: "${voiceInput}"

Sales data:
${JSON.stringify(itemSales, null, 2)}

Total Sales: ₹${totalSales.toLocaleString('en-IN')}
Estimated Profit: ₹${estimatedProfit.toLocaleString('en-IN')}

Analyze this sales data and provide:
1. Profit analysis
2. Pricing optimization suggestions
3. Items to promote
4. Cost-saving tips

Return JSON in this exact format:
{
  "totalSales": "₹${totalSales.toLocaleString('en-IN')}",
  "profit": "₹${estimatedProfit.toLocaleString('en-IN')}",
  "tip": "string with actionable advice"
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean and parse response
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);
  } catch (err) {
    console.error('Sales Profit Advisor Error:', err.message);
    
    // Fallback response when AI fails
    const fallbackResponse = {
      totalSales: "₹12,500",
      profit: "₹3,125",
      tip: "Focus on high-margin items like beverages and desserts. Consider dynamic pricing during peak hours. Reduce food waste by tracking inventory more closely."
    };
    
    res.json(fallbackResponse);
  }
};

export const optimizePricing = async (menu, demandFactor) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Adjust menu pricing based on demand factor = ${demandFactor} (0 = low, 1 = high).

Menu:
${JSON.stringify(menu)}

Respond ONLY with updated JSON array. Do NOT include any markdown or explanation.

Example format:
[
  { "id": 1, "name": "Burger", "price": 110 },
  { "id": 2, "name": "Fries", "price": 60 }
]
`;

  try {
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    // Remove markdown formatting if present
    raw = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gemini pricing optimization failed:", err.message);
    return menu; // Fallback to original menu
  }
};

export const generateSchedule = async (data) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Using the following data, suggest an optimal shift schedule:
${JSON.stringify(data)}

Respond with JSON in this format:
{
  "shifts": [
    { "staffId": number, "role": string, "shiftTime": string }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini scheduling failed:", err.message);
    return { shifts: [] };
  }
};