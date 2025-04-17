import React, { createContext, useState, useContext, useCallback } from 'react';
import { getEnhancedStockPrice, getEnhancedMultipleStockPrices } from '../services/firestore';
import { isMarketHours, getCacheDuration } from '../utils/marketUtils';

const StockDataContext = createContext();

export function useStockData() {
    return useContext(StockDataContext);
}

export function StockDataProvider({ children }) {
    const [stockData, setStockData] = useState({});
    const [lastFetched, setLastFetched] = useState({});

    // Get data for a single stock
    const getStock = useCallback(async (symbol, options = {}) => {
        const {
            forceRefresh = false,
            localOnly = false,   // Add this parameter
            skipUpdate = false   // Add this parameter
        } = options;

        const now = Date.now();
        const lastFetch = lastFetched[symbol] || 0;
        const cacheAge = (now - lastFetch) / 1000; // seconds

        // First check if we have this in our local state cache
        if (stockData[symbol] && (localOnly || cacheAge < 30)) {
            return stockData[symbol];
        }

        // If localOnly is true and we don't have it cached, return null instead of fetching
        if (localOnly) {
            return null;
        }

        try {
            // Check market hours - only fetch fresh if it's market hours
            const isMarketOpen = isMarketHours();
            const shouldFetch = forceRefresh || !stockData[symbol] || 
                      (isMarketHours() && cacheAge >= 30);

            if (shouldFetch) {
                // Fetch using our enhanced function that uses Firestore cache
                const data = await getEnhancedStockPrice(symbol, !forceRefresh);

                // Only update global state if skipUpdate is false
                if (!skipUpdate) {
                    setStockData(prev => ({
                        ...prev,
                        [symbol]: data
                    }));

                    setLastFetched(prev => ({
                        ...prev,
                        [symbol]: now
                    }));
                }

                return data;
            } else {
                // Use cached data
                return stockData[symbol];
            }
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return stockData[symbol] || null;
        }
    }, [stockData, lastFetched]);

    // Get data for multiple stocks
    const getMultipleStocks = useCallback(async (symbols, forceRefresh = false) => {
        const now = Date.now();
        const symbolsToFetch = [];
        const result = {};

        // Check what we have in cache
        for (const symbol of symbols) {
            const lastFetch = lastFetched[symbol] || 0;
            const cacheAge = (now - lastFetch) / 1000; // seconds

            if (!forceRefresh && stockData[symbol] && cacheAge < 30) {
                result[symbol] = stockData[symbol];
            } else {
                symbolsToFetch.push(symbol);
            }
        }

        // Fetch only what we need
        if (symbolsToFetch.length > 0) {
            try {
                const freshData = await getEnhancedMultipleStockPrices(symbolsToFetch);

                // Update our state
                const newStockData = { ...stockData };
                const newLastFetched = { ...lastFetched };

                for (const symbol in freshData) {
                    newStockData[symbol] = freshData[symbol];
                    newLastFetched[symbol] = now;
                    result[symbol] = freshData[symbol];
                }

                setStockData(newStockData);
                setLastFetched(newLastFetched);
            } catch (error) {
                console.error("Error fetching multiple stocks:", error);
                // Use whatever cached data we have
                symbolsToFetch.forEach(symbol => {
                    if (stockData[symbol]) {
                        result[symbol] = stockData[symbol];
                    }
                });
            }
        }

        return result;
    }, [stockData, lastFetched]);

    const value = {
        stockData,
        getStock,
        getMultipleStocks
    };

    return (
        <StockDataContext.Provider value={value}>
            {children}
        </StockDataContext.Provider>
    );
}