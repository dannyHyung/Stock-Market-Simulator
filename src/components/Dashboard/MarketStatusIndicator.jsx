import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function MarketStatusIndicator() {
    const [marketStatus, setMarketStatus] = useState({
        isOpen: false,
        message: '',
        nextEvent: ''
    });

    useEffect(() => {
        // Function to check if market is open
        const checkMarketStatus = () => {
            const now = new Date();
            const day = now.getDay(); // 0 = Sunday, 6 = Saturday
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentTime = hours * 60 + minutes; // Convert to minutes since midnight

            // Market hours: 9:30 AM - 4:00 PM EST, Mon-Fri
            const marketOpen = 9 * 60 + 30;  // 9:30 AM in minutes
            const marketClose = 16 * 60;      // 4:00 PM in minutes
            const preMarketOpen = 4 * 60;     // 4:00 AM (pre-market)
            const afterHoursClose = 20 * 60;  // 8:00 PM (after hours)

            let status = {
                isOpen: false,
                message: '',
                nextEvent: ''
            };

            if (day >= 1 && day <= 5) {
                // Weekday
                if (currentTime >= marketOpen && currentTime < marketClose) {
                    // Regular trading hours
                    status.isOpen = true;
                    status.message = 'Market Open';

                    // Calculate time until close
                    const minutesToClose = marketClose - currentTime;
                    const hoursToClose = Math.floor(minutesToClose / 60);
                    const minsToClose = minutesToClose % 60;
                    status.nextEvent = `Closes in ${hoursToClose}h ${minsToClose}m`;
                } else if (currentTime >= preMarketOpen && currentTime < marketOpen) {
                    // Pre-market
                    status.isOpen = false;
                    status.message = 'Pre-Market';

                    // Calculate time until open
                    const minutesToOpen = marketOpen - currentTime;
                    const hoursToOpen = Math.floor(minutesToOpen / 60);
                    const minsToOpen = minutesToOpen % 60;
                    status.nextEvent = `Opens in ${hoursToOpen}h ${minsToOpen}m`;
                } else if (currentTime >= marketClose && currentTime < afterHoursClose) {
                    // After hours
                    status.isOpen = false;
                    status.message = 'After Hours';

                    // Calculate time until after-hours close
                    const minutesToClose = afterHoursClose - currentTime;
                    const hoursToClose = Math.floor(minutesToClose / 60);
                    const minsToClose = minutesToClose % 60;
                    status.nextEvent = `After hours ends in ${hoursToClose}h ${minsToClose}m`;
                } else {
                    // Closed
                    status.isOpen = false;
                    status.message = 'Market Closed';

                    if (currentTime >= afterHoursClose) {
                        // If after 8 PM, next event is pre-market tomorrow or Monday
                        const nextDay = day === 5 ? 8 : 1; // If Friday, next trading day is Monday (3 days ahead)
                        const daysToAdd = day === 5 ? 3 : 1;
                        const tomorrow = new Date(now);
                        tomorrow.setDate(tomorrow.getDate() + daysToAdd);
                        tomorrow.setHours(4, 0, 0, 0); // 4:00 AM

                        const diffMs = tomorrow - now;
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        status.nextEvent = `Pre-market in ${diffHrs}h ${diffMins}m`;
                    } else {
                        // Before 4 AM, next event is pre-market today
                        const minutesToPreMarket = preMarketOpen - currentTime;
                        const hoursToPreMarket = Math.floor(minutesToPreMarket / 60);
                        const minsToPreMarket = minutesToPreMarket % 60;
                        status.nextEvent = `Pre-market in ${hoursToPreMarket}h ${minsToPreMarket}m`;
                    }
                }
            } else {
                // Weekend
                status.isOpen = false;
                status.message = 'Market Closed';

                // Calculate time until Monday pre-market
                const daysUntilMonday = day === 0 ? 1 : 6 - day + 1;
                const monday = new Date(now);
                monday.setDate(monday.getDate() + daysUntilMonday);
                monday.setHours(4, 0, 0, 0); // 4:00 AM Monday

                const diffMs = monday - now;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                status.nextEvent = `Opens in ${diffDays}d ${diffHrs}h ${diffMins}m`;
            }

            setMarketStatus(status);
        };

        // Check immediately and then every minute
        checkMarketStatus();
        const intervalId = setInterval(checkMarketStatus, 60000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" />
            <Tooltip
                title={
                    <Typography variant="body2">
                        {marketStatus.nextEvent}
                    </Typography>
                }
                arrow
            >
                <Chip
                    label={marketStatus.message}
                    size="small"
                    color={marketStatus.isOpen ? "success" : "default"}
                    sx={{ height: 24, cursor: 'pointer' }}
                />
            </Tooltip>
        </Box>
    );
}