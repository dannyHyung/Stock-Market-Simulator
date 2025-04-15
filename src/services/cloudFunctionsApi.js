const BASE_URL = import.meta.env.VITE_FUNCTION_URL;

// Get stock price information
export async function getStockPrice(symbol) {
  try {
    const response = await fetch(`${BASE_URL}/getStockPrice?symbol=${symbol}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching stock data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

// Search for stocks by name or symbol
export async function searchStocks(query) {
  try {
    const response = await fetch(`${BASE_URL}/searchStocks?query=${query}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error searching stocks');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}

// Get multiple stock quotes
export async function getMultipleStockPrices(symbols) {
  try {
    const response = await fetch(`${BASE_URL}/getMultipleStockPrices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching multiple stocks');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    return {};
  }
}