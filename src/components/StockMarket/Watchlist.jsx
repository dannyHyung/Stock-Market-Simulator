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
import { useTheme, useMediaQuery } from '@mui/material';
import { green, red } from '@mui/material/colors';

export default function Watchlist({ onSelectStock }) {
  const { currentUser } = useAuth();
  const { getMultipleStocks } = useStockData();
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        <TableRow sx={{
          '& .MuiTableCell-root': {
            py: { xs: 0.5, sm: 0.75 }, // Compact header padding
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 600
          }
        }}>
          <TableCell sx={{ width: { xs: '20%', sm: 'auto' } }}>
            Symbol
          </TableCell>
          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
            Company
          </TableCell>
          <TableCell align="right" sx={{ width: { xs: '25%', sm: 'auto' } }}>
            Price
          </TableCell>
          <TableCell align="right" sx={{ width: { xs: '35%', sm: 'auto' } }}>
            Change
          </TableCell>
          <TableCell align="right" sx={{ width: { xs: '20%', sm: 'auto' } }}>
            Actions
          </TableCell>
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
              sx={{
                cursor: onSelectStock ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark'
                    ? 'rgba(66, 153, 225, 0.08)'
                    : 'rgba(25, 118, 210, 0.04)',
                }
              }}
            >
              {/* Symbol - Show company name on mobile as subtitle */}
              <TableCell
                component="th"
                scope="row"
                sx={{
                  fontWeight: 'bold',
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    color: 'primary.main'
                  }}>
                    {stock.symbol}
                  </Typography>
                  {/* Show company name under symbol on mobile */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: { xs: 'block', sm: 'none' },
                      fontSize: '0.7rem',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '80px'
                    }}
                  >
                    {stock.companyName}
                  </Typography>
                </Box>
              </TableCell>

              {/* Company - Hidden on mobile */}
              <TableCell sx={{
                display: { xs: 'none', sm: 'table-cell' },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                {stock.companyName}
              </TableCell>

              {/* Price */}
              <TableCell align="right" sx={{
                py: { xs: 1, sm: 1.5 },
                px: { xs: 0.5, sm: 2 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: { xs: 'bold', sm: 'normal' }
              }}>
                {price ? `$${price.toFixed(2)}` : 'N/A'}
              </TableCell>

              {/* Change */}
              <TableCell align="right" sx={{
                py: { xs: 1, sm: 1.5 },
                px: { xs: 0.5, sm: 2 }
              }}>
                {change !== 0 && (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    mr : isMobile ? 1.5 : 0
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      {change >= 0 ? (
                        <ArrowDropUpIcon sx={{ color: green[500], fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      ) : (
                        <ArrowDropDownIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                      )}
                      <Typography variant="body2"
                        color={change >= 0 ? green[500] : red[500]}
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          fontWeight: 'bold',
                          lineHeight: 1.5
                        }}>
                        {change.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="caption"
                      color={change >= 0 ? green[500] : red[500]}
                      sx={{
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        lineHeight: 1
                      }}>
                      ({changePercent.toFixed(2)}%)
                    </Typography>
                  </Box>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell align="right" sx={{
                py: { xs: 0.5, sm: 1 },
                px: { xs: 0.5, sm: 1 }
              }}>
                <WatchlistToggle
                  stock={stock}
                  onToggle={(isAdded) => handleWatchlistToggle(stock.symbol, isAdded)}
                  size={isMobile ? 'small' : 'medium'} // Pass size prop if WatchlistToggle supports it
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </CustomTable >
  );
}