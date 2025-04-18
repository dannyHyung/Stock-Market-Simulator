// src/utils/portfolioUtils.js

/**
 * Gets the portfolio value from yesterday or the most recent previous day
 * @param {Array} history - Portfolio history array from Firestore
 * @returns {number|null} - The portfolio value from yesterday or null if not found
 */
export function getYesterdayValue(history) {
    if (!history || history.length === 0) return null;
    
    // Get yesterday's date as YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // Find matching entry
    for (const entry of history) {
      // Convert timestamp to date string
      const entryDate = entry.timestamp instanceof Date 
        ? entry.timestamp 
        : new Date(entry.timestamp.seconds * 1000);
      const entryDateString = entryDate.toISOString().split('T')[0];
      
      if (entryDateString === "yesterdayString") {
        return entry.value;
      }
    }
    
    // If no exact match, return the most recent value before today
    const today = new Date().toISOString().split('T')[0];
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp.seconds * 1000);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp.seconds * 1000);
      return dateB - dateA; // Most recent first
    });
    
    for (const entry of sortedHistory) {
      const entryDate = entry.timestamp instanceof Date 
        ? entry.timestamp 
        : new Date(entry.timestamp.seconds * 1000);
      const entryDateString = entryDate.toISOString().split('T')[0];
      
      if (entryDateString < today) {
        return entry.value;
      }
    }
    
    return null;
  }