/**
 * Checks if current time falls within stock market trading hours (including extended hours)
 * @param {Date} [date=new Date()] - Date to check (defaults to current time)
 * @returns {Object} Object containing market status details
 */
export function getMarketStatus(date = new Date()) {
  const day = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    return {
      isMarketDay: false,
      isRegularHours: false,
      isExtendedHours: false,
      isPreMarket: false,
      isAfterHours: false
    };
  }
  
  // Market day (Monday-Friday)
  const isMarketDay = true;
  
  // Convert time to Eastern Time (ET) - this is simplified
  // For production, use a proper timezone library
  const estHour = hours; // Adjust this based on your server's timezone
  
  // Regular market hours: 9:30 AM - 4:00 PM ET
  const isRegularHours = 
    (estHour > 9 || (estHour === 9 && minutes >= 30)) && 
    estHour < 16;
  
  // Pre-market hours: 4:00 AM - 9:30 AM ET
  const isPreMarket = 
    estHour >= 4 && 
    (estHour < 9 || (estHour === 9 && minutes < 30));
  
  // After-hours: 4:00 PM - 8:00 PM ET
  const isAfterHours = 
    estHour >= 16 && estHour < 20;
  
  // Extended hours include both pre-market and after-hours
  const isExtendedHours = isPreMarket || isAfterHours;
  
  return {
    isMarketDay,
    isRegularHours,
    isExtendedHours,
    isPreMarket,
    isAfterHours
  };
}

/**
 * Simple check if the market is open including extended hours
 * @returns {boolean} True if market is open (including extended hours)
 */
export function isMarketHours() {
  const status = getMarketStatus();
  return status.isMarketDay && (status.isRegularHours || status.isExtendedHours);
}

/**
 * Get appropriate cache duration based on market status
 * @returns {number} Cache duration in minutes
 */
export function getCacheDuration() {
  const status = getMarketStatus();
  
  if (!status.isMarketDay) {
    return 240; // 4 hours on weekends
  }
  
  if (status.isRegularHours) {
    return 1; // 1 minute during regular hours
  }
  
  if (status.isExtendedHours) {
    return 5; // 5 minutes during extended hours
  }
  
  return 60; // 1 hour outside of any trading hours on weekdays
}