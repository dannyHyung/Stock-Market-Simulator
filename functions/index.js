/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/* eslint-disable no-undef */
const { onRequest } = require('firebase-functions/v2/https');
const cors = require('cors')({ origin: true });

// Get Finnhub API key for pricing
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Helper function for Yahoo Finance requests (search only)
async function fetchFromYahoo(endpoint, params = {}) {
  const url = new URL(endpoint);
  
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status} - ${response.statusText}`);
  }
  
  return await response.json();
}

// Helper function for Finnhub requests (pricing only)
async function fetchFromFinnhub(endpoint, params = {}) {
  if (!FINNHUB_API_KEY) {
    throw new Error('Finnhub API key not configured');
  }

  const url = new URL(`https://finnhub.io/api/v1/${endpoint}`);
  url.searchParams.append('token', FINNHUB_API_KEY);
  
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status} - ${response.statusText}`);
  }
  
  return await response.json();
}

// 🔍 SEARCH using Yahoo (this is working for you)
exports.searchStocks = onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const query = request.query.query;

      if (!query) {
        return response.status(400).json({
          error: 'Missing query parameter'
        });
      }

      // Use Yahoo Finance search (working!)
      const searchResults = await fetchFromYahoo(
        'https://query1.finance.yahoo.com/v1/finance/search',
        { 
          q: query,
          quotesCount: 15,
          newsCount: 0,
          enableFuzzyQuery: false,
          quotesQueryId: 'tss_match_phrase_query',
          multiQuoteQueryId: 'multi_quote_single_token_query',
          enableCb: true,
          enableNavLinks: true,
          enableEnhancedTrivialQuery: true
        }
      );
      
      // Filter and map results
      const quotes = searchResults.quotes || [];
      const filteredResults = quotes.filter(quote =>
        (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF') &&
        ['NMS', 'NYQ', 'PCX', 'BTS', 'NCM', 'NGM', 'NSC', 'ARCX'].includes(quote.exchange)
      );

      const mappedResults = filteredResults.map(item => ({
        symbol: item.symbol,
        longname: item.longname || item.shortname,
        shortname: item.shortname,
        exchange: item.exchange,
        quoteType: item.quoteType
      }));

      return response.json(mappedResults);
    } catch (error) {
      console.error('Error searching stocks:', error);
      return response.status(500).json({
        error: 'Failed to search stocks',
        message: error.message
      });
    }
  });
});

// 💰 STOCK PRICE using Finnhub (reliable with your API key)
exports.getStockPrice = onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const symbol = request.query.symbol;

      if (!symbol) {
        return response.status(400).json({
          error: 'Missing symbol parameter'
        });
      }

      if (!FINNHUB_API_KEY) {
        return response.status(500).json({
          error: 'Server configuration error: FINNHUB_API_KEY not set'
        });
      }

      // Get quote data from Finnhub
      const quote = await fetchFromFinnhub('quote', { symbol });
      
      // Get company profile from Finnhub
      let profile = {};
      try {
        profile = await fetchFromFinnhub('stock/profile2', { symbol });
      } catch (error) {
        console.warn('Could not fetch company profile:', error.message);
      }

      // Enhanced extended hours detection
      const marketState = getMarketState();
      let extendedHoursData = {
        postMarketPrice: null,
        postMarketChange: null,
        preMarketPrice: null,
        preMarketChange: null,
        isAfterHours: false,
        isPreMarket: false
      };

      // During extended hours, current price might reflect extended hours
      if (marketState === 'PRE' && quote.c !== quote.pc) {
        extendedHoursData.isPreMarket = true;
        extendedHoursData.preMarketPrice = quote.c;
        extendedHoursData.preMarketChange = quote.c - quote.pc;
      } else if (marketState === 'POST' && quote.c !== quote.pc) {
        extendedHoursData.isAfterHours = true;
        extendedHoursData.postMarketPrice = quote.c;
        extendedHoursData.postMarketChange = quote.c - quote.pc;
      }

      // Map response
      const mappedData = {
        regularMarketPrice: quote.c || 0,
        regularMarketChange: quote.d || 0,
        regularMarketChangePercent: quote.dp || 0,
        regularMarketOpen: quote.o || 0,
        regularMarketDayHigh: quote.h || 0,
        regularMarketDayLow: quote.l || 0,
        regularMarketPreviousClose: quote.pc || 0,
        
        longName: profile.name || '',
        shortName: profile.name || '',
        symbol: symbol,
        exchange: profile.exchange || '',
        currency: profile.currency || 'USD',
        
        marketState: marketState,
        
        // Extended hours data
        ...extendedHoursData
      };

      return response.json(mappedData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return response.status(500).json({
        error: 'Failed to fetch stock data',
        message: error.message
      });
    }
  });
});

// 📊 MULTIPLE STOCK PRICES using Finnhub (reliable batch processing)
exports.getMultipleStockPrices = onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const symbols = request.body?.symbols;

      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return response.status(400).json({
          error: 'Invalid or missing symbols array in request body'
        });
      }

      if (!FINNHUB_API_KEY) {
        return response.status(500).json({
          error: 'Server configuration error: FINNHUB_API_KEY not set'
        });
      }

      const validSymbols = symbols.filter(symbol => symbol && symbol !== "NULL");

      if (validSymbols.length === 0) {
        return response.json({});
      }

      const stockData = {};
      const marketState = getMarketState();
      
      // Make requests for each symbol
      const promises = validSymbols.map(async (symbol) => {
        try {
          const quote = await fetchFromFinnhub('quote', { symbol });
          
          // Enhanced extended hours detection for batch
          let extendedHoursData = {
            postMarketPrice: null,
            postMarketChange: null,
            preMarketPrice: null,
            preMarketChange: null,
            isAfterHours: false,
            isPreMarket: false
          };

          if (marketState === 'PRE' && quote.c !== quote.pc) {
            extendedHoursData.isPreMarket = true;
            extendedHoursData.preMarketPrice = quote.c;
            extendedHoursData.preMarketChange = quote.c - quote.pc;
          } else if (marketState === 'POST' && quote.c !== quote.pc) {
            extendedHoursData.isAfterHours = true;
            extendedHoursData.postMarketPrice = quote.c;
            extendedHoursData.postMarketChange = quote.c - quote.pc;
          }
          
          stockData[symbol] = {
            regularMarketPrice: quote.c || 0,
            regularMarketChange: quote.d || 0,
            regularMarketChangePercent: quote.dp || 0,
            regularMarketOpen: quote.o || 0,
            regularMarketDayHigh: quote.h || 0,
            regularMarketDayLow: quote.l || 0,
            regularMarketPreviousClose: quote.pc || 0,
            
            // Extended hours data
            ...extendedHoursData
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      });

      await Promise.all(promises);
      return response.json(stockData);
    } catch (error) {
      console.error('Error fetching multiple stocks:', error);
      return response.status(500).json({
        error: 'Failed to fetch multiple stocks',
        message: error.message
      });
    }
  });
});

// Helper function to determine market state
function getMarketState() {
  try {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const est = new Date(utc + (-5 * 3600000));
    
    const day = est.getDay();
    const hour = est.getHours();
    const minute = est.getMinutes();
    
    if (day === 0 || day === 6) return 'CLOSED';
    if ((hour > 9 || (hour === 9 && minute >= 30)) && hour < 16) return 'REGULAR';
    if (hour >= 4 && (hour < 9 || (hour === 9 && minute < 30))) return 'PRE';
    if (hour >= 16 && hour < 20) return 'POST';
    return 'CLOSED';
  } catch (error) {
    console.error('Error determining market state:', error);
    return 'CLOSED';
  }
}

