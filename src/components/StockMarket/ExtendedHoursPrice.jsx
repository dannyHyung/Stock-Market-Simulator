import React from 'react';
import { Box, Typography } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { green, red } from '@mui/material/colors';

export default function ExtendedHoursPrice({ stockDetails }) {
  if (!stockDetails) return null;

  // Check for after-hours data
  if (stockDetails.isAfterHours && stockDetails.postMarketPrice) {
    const change = stockDetails.postMarketChange;
    // Calculate percent change if not provided
    let percentChange;
    if (stockDetails.postMarketChangePercent !== undefined) {
      percentChange = stockDetails.postMarketChangePercent;
    } else {
      // Calculate percentage based on regular market price
      percentChange = (change / stockDetails.regularMarketPrice);
    }

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          After Hours: ${stockDetails.postMarketPrice.toFixed(2)}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: change >= 0 ? green[500] : red[500],
            fontSize: '0.875rem'
          }}
        >
          {change >= 0 ? (
            <ArrowDropUpIcon fontSize="small" />
          ) : (
            <ArrowDropDownIcon fontSize="small" />
          )}
          <Typography variant="body2" component="span">
            {change >= 0 ? '+' : ''}{change.toFixed(2)}
            ({percentChange.toFixed(2)}%)
          </Typography>
        </Box>
      </Box>
    );
  }

  // Check for pre-market data
  if (stockDetails.isPreMarket && stockDetails.preMarketPrice) {
    const change = stockDetails.preMarketChange;
    // Calculate percent change if not provided
    let percentChange;
    if (stockDetails.preMarketChangePercent !== undefined) {
      percentChange = stockDetails.preMarketChangePercent;
    } else {
      // Calculate percentage based on regular market price
      percentChange = (change / stockDetails.regularMarketPrice);
    }

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Pre-Market: ${stockDetails.preMarketPrice.toFixed(2)}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: change >= 0 ? green[500] : red[500],
            fontSize: '0.875rem'
          }}
        >
          {change >= 0 ? (
            <ArrowDropUpIcon fontSize="small" />
          ) : (
            <ArrowDropDownIcon fontSize="small" />
          )}
          <Typography variant="body2" component="span">
            {change >= 0 ? '+' : ''}{change.toFixed(2)}
            ({percentChange.toFixed(2)}%)
          </Typography>
        </Box>
      </Box>
    );
  }

  return null;
}