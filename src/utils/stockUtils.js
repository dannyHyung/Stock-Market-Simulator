/**
 * Gets the current price of a stock based on market session
 * @param {Object} stockDetails - The stock details object from the API
 * @returns {number} The current stock price
 */
export function getCurrentPrice(stockDetails) {
  if (!stockDetails) return 0;

  if (stockDetails.marketState === "PREPRE") {
    return stockDetails.postMarketPrice;
  }
  if (stockDetails.marketState === "PRE") {
    return stockDetails.preMarketPrice;
  }
  return stockDetails.regularMarketPrice;
}

/**
 * Calculates the maximum shares that can be bought with available cash
 * @param {Object} stockDetails - The stock details object from the API
 * @param {Object} portfolio - The user's portfolio
 * @returns {number} Maximum number of shares that can be purchased
 */
export function calculateMaxBuyQuantity(stockDetails, portfolio) {
  if (!stockDetails || !portfolio) return 0;

  const currentPrice = getCurrentPrice(stockDetails);
  const maxQuantity = Math.floor(portfolio.cash / currentPrice);
  return maxQuantity;
}

/**
 * Calculates the estimated cost or proceeds for a transaction
 * @param {Object} stockDetails - The stock details object from the API
 * @param {number} quantity - Number of shares to buy or sell
 * @returns {string} Formatted dollar amount
 */
export function calculateTransactionAmount(stockDetails, quantity) {
  if (!stockDetails || !quantity) return '0.00';

  const currentPrice = getCurrentPrice(stockDetails);
  return (currentPrice * quantity).toFixed(2);
}