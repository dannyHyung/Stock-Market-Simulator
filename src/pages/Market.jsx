import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchStocks, getStockPrice } from '../services/stocksApi';
import { buyStock, sellStock, getUserPortfolio } from '../services/firestore';
import ExtendedHoursPrice from '../components/StockMarket/ExtendedHoursPrice';
import { getCurrentPrice, calculateMaxBuyQuantity, calculateTransactionAmount } from '../utils/stockUtils';
import Watchlist from '../components/StockMarket/Watchlist';
import WatchlistToggle from '../components/StockMarket/WatchlistToggle';
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
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { green, red } from '@mui/material/colors';

export default function Market() {
  const { currentUser } = useAuth();
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
    } catch (error) {
      setMessage({ text: 'Error searching for stocks', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Select a stock to view details
  async function handleSelectStock(stock) {
    setLoading(true);
    setSelectedStock(stock);
    setStockDetails(null);
    setQuantity(1);

    try {
      const details = await getStockPrice(stock.symbol);
      setStockDetails(details);

      // Get user's portfolio to check if they own this stock
      const portfolioData = await getUserPortfolio(currentUser.uid);
      setPortfolio(portfolioData);

      // Check if user owns this stock and set trade type
      const ownedStock = portfolioData.stocks.find(s => s.symbol === stock.symbol);
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
        selectedStock.shortname || selectedStock.longname,
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
      <Paper
        component="form"
        onSubmit={handleSearch}
        elevation={2}
        sx={{ p: 2, mb: 4, display: 'flex', alignItems: 'center' }}
      >
        <TextField
          fullWidth
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a stock (e.g., AAPL, Microsoft)"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ height: 56 }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Paper>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedStock && (
        <Paper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Search Results</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Exchange</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map(stock => (
                  <TableRow key={stock.symbol} hover>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      {stock.symbol}
                    </TableCell>
                    <TableCell>{stock.shortname || stock.longname}</TableCell>
                    <TableCell>{stock.exchange}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSelectStock(stock)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Stock Details */}
      {selectedStock && (
        <Paper elevation={3} sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    {selectedStock.shortname || selectedStock.longname} ({selectedStock.symbol})
                  </Typography>
                  <WatchlistToggle stock={selectedStock} />
                </Box>
                <IconButton onClick={() => {
                  setSelectedStock(null);
                  setStockDetails(null);
                }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            }
            subheader={stockDetails ? stockDetails.exchangeName : ''}
          />

          <Divider />

          <CardContent>
            {loading ? (
              <Box sx={{ p: 2 }}>
                <Skeleton variant="rectangular" height={120} />
                <Skeleton variant="text" sx={{ mt: 2 }} />
                <Skeleton variant="text" />
              </Box>
            ) : stockDetails ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h3" component="div">
                    ${stockDetails.regularMarketPrice.toFixed(2)}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: stockDetails.regularMarketChange >= 0 ? green[500] : red[500]
                    }}
                  >
                    {stockDetails.regularMarketChange >= 0 ? (
                      <ArrowDropUpIcon />
                    ) : (
                      <ArrowDropDownIcon />
                    )}
                    <Typography variant="body1" component="span">
                      {stockDetails.regularMarketChange >= 0 ? '+' : ''}
                      {stockDetails.regularMarketChange.toFixed(2)}
                      ({(stockDetails.regularMarketChangePercent * 100).toFixed(2)}%)
                    </Typography>
                  </Box>
                  <ExtendedHoursPrice stockDetails={stockDetails} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Open</Typography>
                      <Typography variant="body1">${stockDetails.regularMarketOpen.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Previous Close</Typography>
                      <Typography variant="body1">${stockDetails.regularMarketPreviousClose.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Day High</Typography>
                      <Typography variant="body1">${stockDetails.regularMarketDayHigh.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Day Low</Typography>
                      <Typography variant="body1">${stockDetails.regularMarketDayLow.toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <Typography>Loading stock details...</Typography>
            )}

            {/* Portfolio Position */}
            {portfolio && portfolio.stocks.some(stock => stock.symbol === selectedStock.symbol) && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Your Position</Typography>
                <Typography variant="body2">
                  You own {portfolio.stocks.find(stock => stock.symbol === selectedStock.symbol).quantity} shares
                  at an average price of ${portfolio.stocks.find(stock => stock.symbol === selectedStock.symbol).averagePrice.toFixed(2)}
                </Typography>
              </Box>
            )}

            {/* Trading Interface */}
            {stockDetails && (
              <Box sx={{ mt: 4 }}>
                <Tabs
                  value={tradeType}
                  onChange={(e, newValue) => setTradeType(newValue)}
                  sx={{ mb: 2 }}
                >
                  <Tab
                    label="Buy"
                    value="buy"
                  />
                  <Tab
                    label="Sell"
                    value="sell"
                    disabled={!portfolio || !portfolio.stocks.some(stock => stock.symbol === selectedStock.symbol)}
                  />
                </Tabs>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Quantity"
                      type="number"
                      fullWidth
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                      helperText={
                        tradeType === 'buy'
                          ? `Max: ${calculateMaxBuyQuantity(stockDetails, portfolio)} shares`
                          : `Max: ${calculateMaxSellQuantity()} shares`
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Estimated {tradeType === 'buy' ? 'Cost' : 'Proceeds'}
                      </Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        ${calculateTransactionAmount(stockDetails, quantity)}
                      </Typography>
                      {portfolio && (
                        <Typography variant="caption" color="text.secondary">
                          Available Cash: ${portfolio.cash.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  color={tradeType === 'buy' ? 'primary' : 'secondary'}
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={tradeType === 'buy' ? handleBuyStock : handleSellStock}
                  disabled={loading ||
                    (tradeType === 'buy' && (
                      !portfolio ||
                      portfolio.cash < stockDetails.regularMarketPrice * quantity
                    )) ||
                    (tradeType === 'sell' && (
                      !portfolio ||
                      !portfolio.stocks.some(stock => stock.symbol === selectedStock.symbol) ||
                      portfolio.stocks.find(stock => stock.symbol === selectedStock.symbol).quantity < quantity
                    ))
                  }
                >
                  {loading
                    ? 'Processing...'
                    : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${quantity} Share${quantity !== 1 ? 's' : ''}`
                  }
                </Button>
              </Box>
            )}
          </CardContent>
        </Paper>
      )}

      {/* Watchlist */}
      {!selectedStock && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Watchlist</Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowWatchlist(!showWatchlist)}
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
      >
        <Alert
          onClose={handleCloseMessage}
          severity={message.type === 'success' ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}