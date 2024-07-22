const { StructuredTool } = require("@langchain/core/tools");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { z } = require("zod");
const dotenv = require('dotenv');
dotenv.config();
const yahooFinance = require('yahoo-finance2').default;
const readlineSync = require('readline-sync');


const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  maxTokens: 100,
  temperature: 0.7,
  topP: 1,
  topK: 0,
  maxOutputTokens: 2048,
});

async function getStockPrice(symbol) {
  try {
    const results = await yahooFinance.quote(symbol);
    return {
      symbol: symbol,
      price: results.regularMarketPrice,
      currency: results.currency,
      volume: results.regularMarketVolume,
      name: results.longName
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    throw new Error("Failed to fetch stock price");
  }
}

// Define your tool
class StockPriceTool extends StructuredTool {
  schema = z.object({
    symbol: z.string().describe("The stock symbol, like AAPL"),
  });

  name = "stock_price";

  description = "Get the current stock price of a company using its stock symbol";

  async _call(input) {
    const { symbol } = input;
    try {
      const result = await getStockPrice(symbol);
      return JSON.stringify(result);
    } catch (error) {
      return `I apologize, but it seems that I am unable to fetch the stock price for ${symbol}.`;
    }
  }
}

async function main() {
  const modelWithTools = model.bind({
    tools: [new StockPriceTool()],
  });

  const userInput = readlineSync.question("Enter the symbol: ")
  const res = await modelWithTools.invoke([
    [
      "human",
      userInput,
    ],
  ]);

  console.log(res.tool_calls);

  // Assuming the tool call response is in the res.tool_calls array
  for (const toolCall of res.tool_calls) {
    if (toolCall.name === "stock_price") {
      const stockPriceResult = await getStockPrice(toolCall.args.symbol);
      console.log(stockPriceResult);
    }
  }
}

main();
