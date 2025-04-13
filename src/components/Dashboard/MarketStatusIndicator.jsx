import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function MarketStatusIndicator() {
  const [marketStatus, setMarketStatus] = useState({
    isOpen: false,
    type: 'closed', // 'pre', 'regular', 'after', 'closed'
    message: '',
    nextEvent: '',
    tooltipText: ''
  });

  useEffect(() => {
    // Function to check if market is open
    const checkMarketStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes; // Convert to minutes since midnight
      
      // Market hours in minutes since midnight (Eastern Time)
      const preMarketOpen = 4 * 60;     // 4:00 AM
      const regularMarketOpen = 9 * 60 + 30;  // 9:30 AM
      const regularMarketClose = 16 * 60;     // 4:00 PM
      const afterHoursClose = 20 * 60;  // 8:00 PM
      
      let status = {
        isOpen: false,
        type: 'closed',
        message: '',
        nextEvent: '',
        tooltipText: ''
      };
      
      if (day >= 1 && day <= 5) {
        // Weekday
        if (currentTime >= regularMarketOpen && currentTime < regularMarketClose) {
          // Regular trading hours
          status.isOpen = true;
          status.type = 'regular';
          status.message = 'Market Open';
          
          // Calculate time until close
          const minutesToClose = regularMarketClose - currentTime;
          const hoursToClose = Math.floor(minutesToClose / 60);
          const minsToClose = minutesToClose % 60;
          status.nextEvent = `Closes in ${hoursToClose}h ${minsToClose}m`;
          status.tooltipText = `Regular market is open. Trading will close in ${hoursToClose} hours and ${minsToClose} minutes.`;
        
        } else if (currentTime >= preMarketOpen && currentTime < regularMarketOpen) {
          // Pre-market
          status.isOpen = true;
          status.type = 'pre';
          status.message = 'Pre-Market Open';
          
          // Calculate time until regular open
          const minutesToOpen = regularMarketOpen - currentTime;
          const hoursToOpen = Math.floor(minutesToOpen / 60);
          const minsToOpen = minutesToOpen % 60;
          status.nextEvent = `Regular opens in ${hoursToOpen}h ${minsToOpen}m`;
          status.tooltipText = `Pre-market trading is active. Regular market opens in ${hoursToOpen} hours and ${minsToOpen} minutes.`;
        
        } else if (currentTime >= regularMarketClose && currentTime < afterHoursClose) {
          // After hours
          status.isOpen = true;
          status.type = 'after';
          status.message = 'After Hours Open';
          
          // Calculate time until after-hours close
          const minutesToClose = afterHoursClose - currentTime;
          const hoursToClose = Math.floor(minutesToClose / 60);
          const minsToClose = minutesToClose % 60;
          status.nextEvent = `Closes in ${hoursToClose}h ${minsToClose}m`;
          status.tooltipText = `After-hours trading is active. Trading will end in ${hoursToClose} hours and ${minsToClose} minutes.`;
        
        } else {
          // Closed for the day
          status.isOpen = false;
          status.type = 'closed';
          status.message = 'Market Closed';
          
          // Calculate time until next session
          if (currentTime >= afterHoursClose) {
            // After 8 PM, next event is pre-market tomorrow or Monday
            const nextDay = day === 5 ? 8 : 1; // If Friday, add 3 days to get to Monday
            const daysToAdd = day === 5 ? 3 : 1;
            const nextMarketDay = new Date(now);
            nextMarketDay.setDate(nextMarketDay.getDate() + daysToAdd);
            nextMarketDay.setHours(4, 0, 0, 0); // 4:00 AM
            
            const diffMs = nextMarketDay - now;
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            status.nextEvent = `Pre-market in ${diffHrs}h ${diffMins}m`;
            status.tooltipText = `All trading is closed for today. Pre-market trading begins in ${diffHrs} hours and ${diffMins} minutes.`;
          } else {
            // Before 4 AM, next event is pre-market today
            const minutesToPreMarket = preMarketOpen - currentTime;
            const hoursToPreMarket = Math.floor(minutesToPreMarket / 60);
            const minsToPreMarket = minutesToPreMarket % 60;
            
            status.nextEvent = `Pre-market in ${hoursToPreMarket}h ${minsToPreMarket}m`;
            status.tooltipText = `Markets are closed. Pre-market trading begins in ${hoursToPreMarket} hours and ${minsToPreMarket} minutes.`;
          }
        }
      } else {
        // Weekend
        status.isOpen = false;
        status.type = 'closed';
        status.message = 'Weekend - Closed';
        
        // Calculate time until Monday pre-market
        const daysUntilMonday = day === 0 ? 1 : 7 - day + 1;
        const monday = new Date(now);
        monday.setDate(monday.getDate() + daysUntilMonday);
        monday.setHours(4, 0, 0, 0); // 4:00 AM Monday
        
        const diffMs = monday - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        status.nextEvent = `Opens in ${diffDays}d ${diffHrs}h ${diffMins}m`;
        status.tooltipText = `Markets are closed for the weekend. Pre-market trading begins on Monday in ${diffDays} days, ${diffHrs} hours, and ${diffMins} minutes.`;
      }
      
      setMarketStatus(status);
    };
    
    // Check immediately and then every minute
    checkMarketStatus();
    const intervalId = setInterval(checkMarketStatus, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Determine chip color based on market status
  const getChipColor = () => {
    switch (marketStatus.type) {
      case 'regular':
        return "success"; // Green
      case 'pre':
        return "primary"; // Blue
      case 'after':
        return "secondary"; // Purple
      default:
        return "default"; // Gray
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccessTimeIcon fontSize="small" color={marketStatus.isOpen ? "primary" : "action"} />
      <Tooltip 
        title={<Typography variant="body2">{marketStatus.tooltipText}</Typography>}
        arrow
      >
        <Chip 
          label={marketStatus.message}
          size="small"
          color={getChipColor()}
          sx={{ height: 24, cursor: 'pointer' }}
        />
      </Tooltip>
    </Box>
  );
}