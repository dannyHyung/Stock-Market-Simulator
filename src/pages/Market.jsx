import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStockData } from '../contexts/StockDataContext';
import { searchStocks, getStockPrice } from '../services/stocksApi';
import { buyStock, sellStock, getUserPortfolio } from '../services/firestore';
import ExtendedHoursPrice from '../components/StockMarket/ExtendedHoursPrice';
import { getCurrentPrice, calculateMaxBuyQuantity, calculateTransactionAmount } from '../utils/stockUtils';
import Watchlist from '../components/StockMarket/Watchlist';
import WatchlistToggle from '../components/StockMarket/WatchlistToggle';
import CustomCard from '../components/UI/CustomCard';
import CustomTable from '../components/UI/CustomTable';
import StockDetails from '../components/Dashboard/StocksDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Dialog, DialogContent, DialogTitle, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Snackbar from '@mui/material/Snackbar';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { green, red } from '@mui/material/colors';
import StockDialog from '../components/Mobile/StockDialog';

export default function Market() {
  const { currentUser } = useAuth();
  const { getStock, getMultipleStocks } = useStockData();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stockDetailsLoading, setStockDetailsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [portfolio, setPortfolio] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [showWatchlist, setShowWatchlist] = useState(true);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Search for stocks
  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchQuery) return;

    setSearchLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const results = await searchStocks(searchQuery);
      setSearchResults(results);
      setSelectedStock(null);
      setStockDetails(null);

      // Show message when no results are found
      if (results.length === 0) {
        setMessage({
          text: `No results found for "${searchQuery}". Try a different search term.`,
          type: 'info'
        });
      }

    } catch (error) {
      setMessage({ text: 'Error searching for stocks', type: 'error' });
    } finally {
      setSearchLoading(false);
    }
  }

  // Select a stock to view details
  // async function handleSelectStock(stock) {
  //   setLoading(true);
  //   setSelectedStock(stock);
  //   setStockDetails(null);
  //   setQuantity(1);

  //   try {
  //     const details = await getStock(stock.symbol);
  //     setStockDetails(details);

  //     // Get user's portfolio to check if they own this stock
  //     const portfolioData = await getUserPortfolio(currentUser.uid);
  //     setPortfolio(portfolioData);

  //     // Check if user owns this stock and set trade type
  //     const ownedStock = portfolioData.stocks.find(s => s.symbol === stock.symbol);
  //     setTradeType(ownedStock ? 'sell' : 'buy');
  //   } catch (error) {
  //     setMessage({ text: 'Error fetching stock details', type: 'error' });
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  async function handleSelectStock(stock) {
    setStockDetailsLoading(true);
    setStockDetails(null);
    setQuantity(1);

    try {
      const details = await getStock(stock.symbol);
      setStockDetails(details);

      // Get user's portfolio to check if they own this stock
      const portfolioData = await getUserPortfolio(currentUser.uid);
      setPortfolio(portfolioData);

      // Check if user owns this stock
      const ownedStock = portfolioData.stocks.find(s => s.symbol === stock.symbol);

      // Combine the search stock data with user's position data
      const stockWithPosition = {
        ...stock,
        quantity: ownedStock ? ownedStock.quantity : 0,
        averagePrice: ownedStock ? ownedStock.averagePrice : 0
      };

      setSelectedStock(stockWithPosition);
      setTradeType(ownedStock ? 'sell' : 'buy');
    } catch (error) {
      setMessage({ text: 'Error fetching stock details', type: 'error' });
    } finally {
      setStockDetailsLoading(false);
    }
  }

  // Handle buying stock
  async function handleBuyStock() {
    if (!selectedStock || !stockDetails || quantity <= 0) return;

    setStockDetailsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const currentPrice = getCurrentPrice(stockDetails);

      const success = await buyStock(
        currentUser.uid,
        selectedStock.symbol,
        selectedStock.longname || selectedStock.shortname,
        quantity,
        currentPrice
      );

      if (success) {
        setMessage({
          text: `Successfully purchased ${quantity} shares of ${selectedStock.symbol} for $${(currentPrice * quantity).toFixed(2)}`,
          type: 'success'
        });
        setQuantity(1);

        // Refresh portfolio data
        const portfolioData = await getUserPortfolio(currentUser.uid);
        setPortfolio(portfolioData);
      } else {
        setMessage({ text: 'Insufficient funds to complete purchase', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error purchasing stock', type: 'error' });
    } finally {
      setStockDetailsLoading(false);
    }
  }

  // Update handleSellStock function
  async function handleSellStock() {
    if (!selectedStock || !stockDetails || quantity <= 0) return;

    setStockDetailsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const ownedStock = portfolio.stocks.find(s => s.symbol === selectedStock.symbol);

      if (!ownedStock || ownedStock.quantity < quantity) {
        setMessage({ text: `You don't own enough shares to sell`, type: 'error' });
        setStockDetailsLoading(false);
        return;
      }

      const currentPrice = getCurrentPrice(stockDetails);

      const success = await sellStock(
        currentUser.uid,
        selectedStock.symbol,
        quantity,
        currentPrice
      );

      if (success) {
        setMessage({
          text: `Successfully sold ${quantity} shares of ${selectedStock.symbol} for $${(currentPrice * quantity).toFixed(2)}`,
          type: 'success'
        });
        setQuantity(1);

        // Refresh portfolio data
        const portfolioData = await getUserPortfolio(currentUser.uid);
        setPortfolio(portfolioData);

        // If user sold all shares, set trade type back to buy
        const updatedOwnedStock = portfolioData.stocks.find(s => s.symbol === selectedStock.symbol);
        if (!updatedOwnedStock) {
          setTradeType('buy');
        }
      } else {
        setMessage({ text: 'Error selling stock', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error selling stock', type: 'error' });
    } finally {
      setStockDetailsLoading(false);
    }
  }

  // Calculate maximum quantity user can sell
  function calculateMaxSellQuantity() {
    if (!selectedStock || !portfolio) return 0;

    const ownedStock = portfolio.stocks.find(s => s.symbol === selectedStock.symbol);
    return ownedStock ? ownedStock.quantity : 0;
  }

  // Close the message
  const handleCloseMessage = () => {
    setMessage({ text: '', type: '' });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{
        fontSize: { xs: '1.5rem', sm: '2.125rem' }
      }}>
        Stock Market
      </Typography>

      {/* Search Form */}
      <CustomCard
        sx={{
          mt: { xs: 2, sm: 4 }, // Reduced top margin on mobile
          mb: { xs: 3, sm: 4 }, // Reduced bottom margin on mobile
          transition: 'all 0.3s ease',
          '&:focus-within': {
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 0 25px rgba(66, 153, 225, 0.3), 0 0 15px rgba(66, 153, 225, 0.2)'
              : '0 15px 30px rgba(0,0,0,0.1), 0 8px 15px rgba(0,0,0,0.05)'
          }
        }}
        padding="0"
      >
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            overflow: 'hidden',
            borderRadius: '10px',
            gap: { xs: 0, sm: 0 } // Remove any gaps
          }}
        >
          <Box sx={{
            flexGrow: 1,
            width: { xs: '100%', sm: 'auto' },
            p: { xs: '12px 16px', sm: '14px 20px' } // Reduced padding on mobile
          }}>
            <TextField
              fullWidth
              variant="standard"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a stock (e.g., AAPL, Microsoft)"
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{
                      color: theme => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.5)',
                      fontSize: { xs: '1.1rem', sm: '1.25rem' } // Smaller icon on mobile
                    }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.95rem', sm: '1.1rem' }, // Smaller font on mobile
                },
                '& .MuiInputAdornment-root': {
                  marginRight: { xs: '8px', sm: '12px' } // Reduce spacing on mobile
                }
              }}
            />
          </Box>
          <Button
            type="submit"
            variant="filled"
            disabled={searchLoading}
            size={isMobile ? 'small' : 'medium'} // Add this line
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: '100%', sm: '120px' },
              mx: { xs: 2, sm: 0 }, // Add horizontal margin on mobile
              mb: { xs: 1.5, sm: 0 }, // Add bottom margin on mobile
              py: { xs: 1, sm: 1.5 }, // Reduce vertical padding on mobile
              fontSize: { xs: '0.875rem', sm: '0.9375rem' }, // Smaller font on mobile
              transition: 'all 0.2s'
            }}
          >
            {searchLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress
                  size={isMobile ? 16 : 20}
                  color="inherit"
                  sx={{ mr: 1 }}
                />
                <span>Searching...</span>
              </Box>
            ) : (
              'Search'
            )}
          </Button>
        </Box>
      </CustomCard>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedStock && (
        <>
          <Box sx={{
            p: 2,
            background: theme => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.01)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Search Results</Typography>
              <Typography variant="caption" color="text.secondary">
                {searchResults.length} stock{searchResults.length !== 1 ? 's' : ''} found
              </Typography>
            </Box>
          </Box>

          <CustomTable sx={{ '&:hover': { transform: 'none' } }}>
            <TableHead>
              <TableRow sx={{
                '& .MuiTableCell-root': {
                  py: { xs: 1, sm: 1.5 }, // Apply to all header cells
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600
                }
              }}>
                <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Symbol
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Name
                </TableCell>
                {/* Hide Exchange column on mobile */}
                <TableCell sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: { xs: 'none', sm: 'table-cell' }
                }}>
                  Exchange
                </TableCell>
                <TableCell align="right" sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  width: { xs: '80px', sm: 'auto' } // Fixed width on mobile
                }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map(stock => (
                <TableRow
                  key={stock.symbol}
                  hover
                  sx={{
                    cursor: { xs: 'pointer', sm: 'default' }, // Make row clickable on mobile
                    '&:hover': {
                      backgroundColor: theme => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                    }
                  }}
                  onClick={isMobile ? () => handleSelectStock(stock) : undefined} // Add this line
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.8rem', sm: '0.95rem' },
                      py: { xs: 1, sm: 1.5 }, // Reduced padding on mobile
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    {stock.symbol}
                  </TableCell>
                  <TableCell sx={{
                    maxWidth: { xs: 120, sm: 250 }, // Shorter max width on mobile
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 0.5, sm: 2 }
                  }}>
                    {/* Show only company name on mobile, or truncate better */}
                    <span title={stock.longname || stock.shortname}>
                      {stock.longname || stock.shortname}
                    </span>
                  </TableCell>
                  {/* Hide Exchange column on mobile */}
                  <TableCell sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', sm: 'table-cell' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    {stock.exchange}
                  </TableCell>
                  <TableCell align="right" sx={{
                    py: { xs: 0.5, sm: 1 }, // Reduced padding
                    px: { xs: 0.5, sm: 1 },
                    width: { xs: '80px', sm: 'auto' }
                  }}>
                    <Tooltip title="View stock details and trade" placement="bottom" arrow>
                      <Button
                        size="small"
                        onClick={!isMobile ? () => handleSelectStock(stock) : undefined} // Only handle click on desktop
                        disabled={stockDetailsLoading}
                        sx={{
                          minWidth: { xs: '50px', sm: 'auto' }, // Smaller button on mobile
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.5, sm: 0.75 },
                          borderRadius: '20px',
                          fontSize: { xs: '0.7rem', sm: '0.8125rem' }, // Smaller font on mobile
                          fontWeight: 600,
                          textTransform: 'none',
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(66, 153, 225, 0.08)'
                            : 'rgba(25, 118, 210, 0.08)',
                          color: theme => theme.palette.mode === 'dark'
                            ? '#90caf9'
                            : theme.palette.primary.main,
                          border: 'none',
                          boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 0 10px rgba(66, 153, 225, 0.1), 0 0 4px rgba(66, 153, 225, 0.05)'
                            : '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: theme => theme.palette.mode === 'dark'
                              ? 'rgba(66, 153, 225, 0.16)'
                              : 'rgba(25, 118, 210, 0.16)',
                            transform: 'translateY(-1px)',
                            boxShadow: theme => theme.palette.mode === 'dark'
                              ? '0 0 15px rgba(66, 153, 225, 0.15), 0 0 6px rgba(66, 153, 225, 0.08)'
                              : '0 4px 8px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        {stockDetailsLoading ?
                          <CircularProgress size={14} color="inherit" /> : 'Trade'}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </CustomTable>
        </>
      )}

      {selectedStock && (
        <StockDialog
          open={Boolean(selectedStock)}
          onClose={() => {
            setSelectedStock(null);
            setStockDetails(null);
          }}
          selectedStock={selectedStock}
          stockDetails={stockDetails}
          loading={stockDetailsLoading}
          tradeType={tradeType}
          setTradeType={setTradeType}
          quantity={quantity}
          setQuantity={setQuantity}
          portfolio={portfolio}
          onBuy={handleBuyStock}
          onSell={handleSellStock}
          calculateMaxBuyQuantity={calculateMaxBuyQuantity}
          calculateTransactionAmount={calculateTransactionAmount}
          showPortfolioInfo={true}
        />
      )}

      {/* Watchlist */}
      {!selectedStock && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Watchlist</Typography>
            <Button
              size="small"
              onClick={() => setShowWatchlist(!showWatchlist)}
              endIcon={showWatchlist ? <VisibilityOffIcon /> : <VisibilityIcon />}
              sx={{
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1.5, sm: 2 }, // Less horizontal padding on mobile
                py: { xs: 0.5, sm: 0.75 }, // Less vertical padding on mobile
                borderRadius: { xs: '16px', sm: '20px' }, // Smaller border radius on mobile
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Smaller font on mobile
                textTransform: 'none',
                backgroundColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(66, 153, 225, 0.08)'
                  : 'rgba(25, 118, 210, 0.08)',
                color: theme => theme.palette.mode === 'dark'
                  ? '#90caf9'
                  : theme.palette.primary.main,
                border: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                '& .MuiButton-endIcon': {
                  ml: { xs: 0.5, sm: 1 }, // Less margin between text and icon on mobile
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '1rem', sm: '1.25rem' } // Smaller icon on mobile
                  }
                },
                '&:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark'
                    ? 'rgba(66, 153, 225, 0.16)'
                    : 'rgba(25, 118, 210, 0.16)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              {showWatchlist ? 'Hide' : 'Show'}
            </Button>
          </Box>

          {showWatchlist && (
            <Watchlist onSelectStock={handleSelectStock} />
          )}
        </Box>
      )}

      {/* Messages */}
      <Snackbar
        open={Boolean(message.text)}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseMessage}
          // severity={message.type === 'success' ? 'success' : 'error'}
          severity={message.type}
          sx={{
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px'
          }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}