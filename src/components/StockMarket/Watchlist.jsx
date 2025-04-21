import React, { useState, useEffect } from 'react';
import { getUserWatchlist } from '../../services/firestore';
import { getMultipleStockPrices } from '../../services/stocksApi';
import { useAuth } from '../../contexts/AuthContext';
import { useStockData } from '../../contexts/StockDataContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import WatchlistToggle from './WatchlistToggle';
import CustomTable from '../UI/CustomTable';
import Button from '@mui/material/Button';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CircularProgress from '@mui/material/CircularProgress';
import { green, red } from '@mui/material/colors';

export default function Watchlist({ onSelectStock }) {
  const { currentUser } = useAuth();
  const { getMultipleStocks } = useStockData();
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, [currentUser]);

  // // Refresh prices periodically
  // useEffect(() => {
  //   if (!watchlist.length) return;

  //   const refreshInterval = setInterval(async () => {
  //     try {
  //       const symbols = watchlist.map(stock => stock.symbol);
  //       // Use context with forced refresh
  //       const prices = await getMultipleStocks(symbols, true);
  //       setStockPrices(prices);
  //     } catch (error) {
  //       console.error("Error refreshing watchlist:", error);
  //     }
  //   }, 60000); // Refresh every minute

  //   return () => clearInterval(refreshInterval);
  // }, [watchlist, getMultipleStocks]);

  async function fetchWatchlist() {
    if (!currentUser) return;

    setLoading(true);
    try {
      const watchlistData = await getUserWatchlist(currentUser.uid);
      setWatchlist(watchlistData);

      // Fetch prices for watchlist stocks
      if (watchlistData.length > 0) {
        const symbols = watchlistData.map(stock => stock.symbol);
        const prices = await getMultipleStocks(symbols);
        setStockPrices(prices);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleWatchlistToggle(symbol, isAdded) {
    if (!isAdded) {
      setWatchlist(watchlist.filter(stock => stock.symbol !== symbol));
    }
    // Refresh the data after a change
    fetchWatchlist();
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (watchlist.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Your watchlist is empty. Add stocks by clicking the star icon.
        </Typography>
      </Paper>
    );
  }

  return (
    <CustomTable>
      <TableHead>
        <TableRow>
          <TableCell>Symbol</TableCell>
          <TableCell>Company</TableCell>
          <TableCell align="right">Price</TableCell>
          <TableCell align="right">Change</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {watchlist.map(stock => {
          const stockData = stockPrices[stock.symbol] || {};
          const price = stockData.regularMarketPrice || 0;
          const change = stockData.regularMarketChange || 0;
          const changePercent = stockData.regularMarketChangePercent || 0;

          return (
            <TableRow
              key={stock.symbol}
              hover
              onClick={() => onSelectStock && onSelectStock({
                symbol: stock.symbol,
                shortname: stock.companyName
              })}
              sx={{ cursor: onSelectStock ? 'pointer' : 'default' }}
            >
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                {stock.symbol}
              </TableCell>
              <TableCell>{stock.companyName}</TableCell>
              <TableCell align="right">
                {price ? `$${price.toFixed(2)}` : 'N/A'}
              </TableCell>
              <TableCell align="right">
                {change !== 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      color: change >= 0 ? green[500] : red[500]
                    }}
                  >
                    {change >= 0 ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    {change.toFixed(2)} ({changePercent.toFixed(2)}%)
                  </Box>
                )}
              </TableCell>
              <TableCell align="right">
                <WatchlistToggle
                  stock={stock}
                  onToggle={(isAdded) => handleWatchlistToggle(stock.symbol, isAdded)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </CustomTable>
  );
}