/**
 * Gets current market status information, always using Eastern Time
 * @returns {Object} Object with market status flags
 */
export function getMarketStatus() {
  // Get current time in user's timezone
  const now = new Date();
  
  // Convert to ET (Eastern Time)
  const etOptions = { timeZone: 'America/New_York' };
  
  // Get date parts in ET
  const etDateString = now.toLocaleString('en-US', etOptions);
  const etDate = new Date(etDateString);
  
  // Get ET day (0-6), hours (0-23), and minutes (0-59)
  const etDay = etDate.getDay();
  const etHours = etDate.getHours();
  const etMinutes = etDate.getMinutes();
  
  // Weekend check (0 = Sunday, 6 = Saturday)
  if (etDay === 0 || etDay === 6) {
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
  
  // Regular market hours: 9:30 AM - 4:00 PM ET
  const isRegularHours = 
    (etHours > 9 || (etHours === 9 && etMinutes >= 30)) && 
    etHours < 16;
  
  // Pre-market hours: 4:00 AM - 9:30 AM ET
  const isPreMarket = 
    etHours >= 4 && 
    (etHours < 9 || (etHours === 9 && etMinutes < 30));
  
  // After-hours: 4:00 PM - 8:00 PM ET
  const isAfterHours = 
    etHours >= 16 && etHours < 20;
  
  // Extended hours include both pre-market and after-hours
  const isExtendedHours = isPreMarket || isAfterHours;
  
  return {
    isMarketDay,
    isRegularHours,
    isExtendedHours,
    isPreMarket,
    isAfterHours,
    // For debugging
    etHours, 
    etMinutes
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