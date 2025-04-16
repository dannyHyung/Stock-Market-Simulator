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
const yahooFinance = require('yahoo-finance2').default;
const cors = require('cors')({ origin: true });

// Simple test function to verify deployment works
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   response.send("Hello from Firebase!");
// });

// Stock price function
exports.getStockPrice = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const symbol = request.query.symbol;

            if (!symbol) {
                return response.status(400).json({
                    error: 'Missing symbol parameter'
                });
            }

            const result = await yahooFinance.quoteSummary(symbol, {
                modules: ['price']
            });

            // Enhanced response with clearly marked market session data
            const priceData = result.price;

            // Add an indicator for extended hours trading
            if (priceData.postMarketPrice) {
                priceData.isAfterHours = true;
            } else if (priceData.preMarketPrice) {
                priceData.isPreMarket = true;
            }

            return response.json(priceData);
        } catch (error) {
            console.error('Error fetching stock data:', error);
            return response.status(500).json({
                error: 'Failed to fetch stock data',
                message: error.message
            });
        }
    });
});

// Stock search function
exports.searchStocks = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const query = request.query.query;

            if (!query) {
                return response.status(400).json({
                    error: 'Missing query parameter'
                });
            }

            const results = await yahooFinance.search(query);
            const filteredResults = results.quotes.filter(quote =>
                (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF') &&
                ['NMS', 'NYQ', 'PCX', 'BTS', 'NCM', 'NGM', 'NSC', 'ARCX'].includes(quote.exchange)
            );

            return response.json(filteredResults);
        } catch (error) {
            console.error('Error searching stocks:', error);
            return response.status(500).json({
                error: 'Failed to search stocks',
                message: error.message
            });
        }
    });
});

// Get multiple stock prices with batching
exports.getMultipleStockPrices = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const symbols = request.body.symbols;

            if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
                return response.status(400).json({
                    error: 'Invalid or missing symbols array in request body'
                });
            }

            // Filter out any empty symbols
            const validSymbols = symbols.filter(symbol => symbol && symbol !== "NULL");

            if (validSymbols.length === 0) {
                return response.json({});
            }

            // Get quotes for all symbols in a single request
            const quotes = await yahooFinance.quote(validSymbols);

            // Format the response to match your existing structure
            const stockData = {};

            // Handle both single quotes and array responses
            const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

            quotesArray.forEach(quote => {
                const symbol = quote.symbol;

                // Transform quote into a format similar to your current response
                stockData[symbol] = {
                    regularMarketPrice: quote.regularMarketPrice,
                    regularMarketChange: quote.regularMarketChange,
                    regularMarketChangePercent: quote.regularMarketChangePercent,
                    regularMarketOpen: quote.regularMarketOpen,
                    regularMarketDayHigh: quote.regularMarketDayHigh,
                    regularMarketDayLow: quote.regularMarketDayLow,
                    regularMarketPreviousClose: quote.regularMarketPreviousClose,

                    // Add extended hours data if available
                    postMarketPrice: quote.postMarketPrice,
                    postMarketChange: quote.postMarketChange,
                    preMarketPrice: quote.preMarketPrice,
                    preMarketChange: quote.preMarketChange
                };

                // Add indicators for extended hours trading
                if (quote.postMarketPrice) {
                    stockData[symbol].isAfterHours = true;
                } else if (quote.preMarketPrice) {
                    stockData[symbol].isPreMarket = true;
                }
            });

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