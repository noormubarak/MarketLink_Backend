import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';
import Market from '../models/Market.js';
import '../models/FarmerProfile.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const modelNames = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];

const SYSTEM_PROMPT = `
You are MarketLink's assistant for a farmers-market platform.
Answer questions using the live MarketLink website data supplied below. Treat it as the source of truth for product names, prices, stock, farmers, markets, operating days, and hours.
Always show prices in Pakistani rupees using the format Rs. <amount> per <unit>.
Never guess or invent prices, availability, market hours, or farmer details. If the requested information is not in the supplied data, say it is not listed on the website.
Keep answers under 80 words, friendly, and specific. Use plain text only: do not use Markdown, asterisks, bold markers, headings, or code formatting.
`;

const getWebsiteData = async () => {
  const [products, markets] = await Promise.all([
    Product.find({ isTemplate: false })
      .select('name category price unit stockQuantity isAvailable farmerId')
      .populate({ path: 'farmerId', select: 'stallName markets', populate: { path: 'markets', select: 'name' } })
      .sort('name')
      .limit(100)
      .lean(),
    Market.find()
      .select('name address operatingDays timings')
      .sort('name')
      .limit(50)
      .lean(),
  ]);

  return {
    products: products.map((product) => ({
      name: product.name,
      category: product.category,
      priceRs: product.price,
      unit: product.unit,
      stock: product.stockQuantity,
      available: product.isAvailable && product.stockQuantity > 0,
      farmer: product.farmerId?.stallName || 'Not listed',
      markets: product.farmerId?.markets?.map((market) => market.name) || [],
    })),
    markets: markets.map((market) => ({
      name: market.name,
      address: market.address,
      operatingDays: market.operatingDays,
      open: market.timings?.open,
      close: market.timings?.close,
    })),
  };
};

const normalizeWord = (word) => word.toLowerCase().replace(/ies$/, 'y').replace(/s$/, '');

const getPriceAnswer = (message, websiteData) => {
  if (!/\b(price|prices|cost|costs|how much|rate)\b/i.test(message)) return null;

  const questionWords = new Set(
    message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((word) => word.length > 2)
      .map(normalizeWord)
  );
  const matches = websiteData.products
    .map((product) => ({
      product,
      score: product.name.toLowerCase().split(/[^a-z0-9]+/)
        .map(normalizeWord)
        .filter((word) => word.length > 2 && questionWords.has(word)).length,
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!matches.length) {
    return 'I could not find that product in the current MarketLink listings, so I cannot confirm its price.';
  }

  return matches.map(({ product }) =>
    `${product.name}: Rs. ${product.priceRs} per ${product.unit}${product.available ? '' : ' (currently unavailable)'}`
  ).join('\n');
};

const removeMarkdown = (text) => text
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[*_`#~]/g, '')
  .replace(/^\s*[-+]\s+/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const chat = async (message, context = '') => {
  if (!process.env.GEMINI_API_KEY) {
    return `(Offline) Try searching for "${message}" on the Products page.`;
  }

  let websiteData = 'Live website data is unavailable. Do not guess prices or availability.';
  try {
    websiteData = await getWebsiteData();
    const priceAnswer = getPriceAnswer(message, websiteData);
    if (priceAnswer) return priceAnswer;
  } catch (error) {
    console.error('Could not load live chatbot data:', error.message);
  }

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(
        `${SYSTEM_PROMPT}\nLive website data: ${JSON.stringify(websiteData)}\nCurrent page: ${context}\nUser: ${message}`
      );
      return removeMarkdown(result.response.text());
    } catch (error) {
      console.error(`Gemini request failed with ${modelName}:`, error.message);
    }
  }

  return `I couldn't reach the assistant right now. Try searching products directly.`;
};