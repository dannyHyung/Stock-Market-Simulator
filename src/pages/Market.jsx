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
import { Dialog, DialogContent, DialogTitle, Tooltip } from '@mui/material';
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

export default function Market() {
  const { currentUser } = useAuth();
  const { getStock, getMultipleStocks } = useStockData();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [portfolio, setPortfolio] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [showWatchlist, setShowWatchlist] = useState(true);

  // Search for stocks
  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
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
      setLoading(false);
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
    setLoading(true);
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
      setLoading(false);
    }
  }

  // Handle buying stock
  async function handleBuyStock() {
    if (!selectedStock || !stockDetails || quantity <= 0) return;

    setLoading(true);
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
      setLoading(false);
    }
  }

  // Update handleSellStock function
  async function handleSellStock() {
    if (!selectedStock || !stockDetails || quantity <= 0) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const ownedStock = portfolio.stocks.find(s => s.symbol === selectedStock.symbol);

      if (!ownedStock || ownedStock.quantity < quantity) {
        setMessage({ text: `You don't own enough shares to sell`, type: 'error' });
        setLoading(false);
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
      setLoading(false);
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
      <Typography variant="h4" component="h1" gutterBottom>
        Stock Market
      </Typography>

      {/* Search Form */}
      <CustomCard
        sx={{
          mb: 4,
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
            borderRadius: '10px'
          }}
        >
          <Box sx={{
            flexGrow: 1,
            width: { xs: '100%', sm: 'auto' },
            p: { xs: 2, sm: '14px 20px' }
          }}>
            <TextField
              fullWidth
              variant="standard" // Changes to a cleaner look without outlines
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a stock (e.g., AAPL, Microsoft)"
              InputProps={{
                disableUnderline: true, // Removes the underline for cleaner look
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{
                      color: theme => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.5)'
                    }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1.1rem',
                }
              }}
            />
          </Box>
          <Button
            type="submit"
            variant="filled"
            disabled={loading}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: '120px' },
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
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
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Symbol</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Exchange</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map(stock => (
                <TableRow
                  key={stock.symbol}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: theme => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                    }
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    {stock.symbol}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stock.longname || stock.shortname}
                  </TableCell>
                  <TableCell>{stock.exchange}</TableCell>
                  <TableCell align="right" sx={{
                    p: 1
                  }}>
                    <Tooltip title="View stock details and trade" placement="bottom" arrow>
                      <Button
                        size="small"
                        onClick={() => handleSelectStock(stock)}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.75,
                          borderRadius: '20px',
                          fontSize: '0.8125rem',
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
                        Trade
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
        <Dialog
          open={Boolean(selectedStock)}
          onClose={() => {
            setSelectedStock(null);
            setStockDetails(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              backgroundImage: theme => theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, #2d2d2d 0%, #1f1f1f 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f7f9fc 100%)',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(66, 153, 225, 0.15)'
                : '0 8px 24px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
              border: theme => theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : 'none',
            }
          }}
        >
          <DialogTitle sx={{
            background: theme => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.01)',
            borderBottom: theme => `1px solid ${theme.palette.divider}`,
            py: 1.5,
            px: 2.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedStock.longname || selectedStock.shortname} ({selectedStock.symbol})
                </Typography>
                <WatchlistToggle stock={selectedStock} />
              </Box>
              <IconButton
                onClick={() => {
                  setSelectedStock(null);
                  setStockDetails(null);
                }}
                sx={{
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: 1 }}>
            <StockDetails
              stock={selectedStock}
              stockDetails={stockDetails}
              loading={loading}
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
          </DialogContent>
        </Dialog>
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
                minWidth: 'auto',
                px: 2,
                py: 0.75,
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.875rem',
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