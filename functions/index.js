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
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Get stock quote 
exports.getStockPrice = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const symbol = request.query.symbol;

            if (!symbol) {
                return response.status(400).json({
                    error: 'Missing symbol parameter'
                });
            }

            // Get quote data
            const quote = await fetchFromFinnhub('quote', { symbol });
            
            // Get company profile for additional info
            let profile = {};
            try {
                profile = await fetchFromFinnhub('stock/profile2', { symbol });
            } catch (error) {
                console.warn('Could not fetch company profile:', error.message);
            }

            // Map Finnhub response to match your frontend expectations
            const mappedData = {
                // Current price data
                regularMarketPrice: quote.c || 0,
                regularMarketChange: quote.d || 0,
                regularMarketChangePercent: quote.dp || 0,
                regularMarketOpen: quote.o || 0,
                regularMarketDayHigh: quote.h || 0,
                regularMarketDayLow: quote.l || 0,
                regularMarketPreviousClose: quote.pc || 0,
                
                // Company information
                longName: profile.name || '',
                shortName: profile.name || '',
                symbol: symbol,
                exchange: profile.exchange || '',
                currency: profile.currency || 'USD',
                
                // Market state (Finnhub doesn't provide this, so we'll determine it)
                marketState: getMarketState(),
                
                // Extended hours (Finnhub doesn't provide pre/post market in basic quote)
                // These would need additional API calls if needed
                postMarketPrice: null,
                postMarketChange: null,
                preMarketPrice: null,
                preMarketChange: null,
                isAfterHours: false,
                isPreMarket: false
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

// Search for stocks 
exports.searchStocks = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const query = request.query.query;

            if (!query) {
                return response.status(400).json({
                    error: 'Missing query parameter'
                });
            }

            // Use Finnhub symbol search
            const searchResults = await fetchFromFinnhub('search', { q: query });
            
            // Map results to match your frontend expectations
            const mappedResults = searchResults.result
                .filter(item => item.type === 'Common Stock' || item.type === 'ETF')
                .map(item => ({
                    symbol: item.symbol,
                    longname: item.description,
                    shortname: item.description,
                    exchange: 'US', // Finnhub search doesn't provide exchange in basic response
                    quoteType: item.type === 'ETF' ? 'ETF' : 'EQUITY'
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

// Get multiple stock quotes 
exports.getMultipleStockPrices = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const symbols = request.body.symbols;

            if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
                return response.status(400).json({
                    error: 'Invalid or missing symbols array in request body'
                });
            }

            const validSymbols = symbols.filter(symbol => symbol && symbol !== "NULL");

            if (validSymbols.length === 0) {
                return response.json({});
            }

            const stockData = {};
            
            // Finnhub doesn't have a batch endpoint, so we make individual requests
            // Note: Be mindful of rate limits (60 calls/minute on free tier)
            const promises = validSymbols.map(async (symbol) => {
                try {
                    const quote = await fetchFromFinnhub('quote', { symbol });
                    
                    // Map to expected format
                    stockData[symbol] = {
                        regularMarketPrice: quote.c || 0,
                        regularMarketChange: quote.d || 0,
                        regularMarketChangePercent: quote.dp || 0,
                        regularMarketOpen: quote.o || 0,
                        regularMarketDayHigh: quote.h || 0,
                        regularMarketDayLow: quote.l || 0,
                        regularMarketPreviousClose: quote.pc || 0,
                        
                        // Extended hours placeholders
                        postMarketPrice: null,
                        postMarketChange: null,
                        preMarketPrice: null,
                        preMarketChange: null,
                        isAfterHours: false,
                        isPreMarket: false
                    };
                } catch (error) {
                    console.error(`Error fetching data for ${symbol}:`, error);
                    // Don't include failed symbols in response
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
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const est = new Date(utc + (-5 * 3600000)); // EST timezone
    
    const day = est.getDay();
    const hour = est.getHours();
    const minute = est.getMinutes();
    
    // Weekend
    if (day === 0 || day === 6) {
        return 'CLOSED';
    }
    
    // Market hours (9:30 AM - 4:00 PM EST)
    if ((hour > 9 || (hour === 9 && minute >= 30)) && hour < 16) {
        return 'REGULAR';
    }
    
    // Pre-market (4:00 AM - 9:30 AM EST)
    if (hour >= 4 && (hour < 9 || (hour === 9 && minute < 30))) {
        return 'PRE';
    }
    
    // After hours (4:00 PM - 8:00 PM EST)
    if (hour >= 16 && hour < 20) {
        return 'POST';
    }
    
    return 'CLOSED';
}