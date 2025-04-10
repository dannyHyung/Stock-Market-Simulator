import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserPortfolio, updateStockPrices } from '../services/firestore';
import { getMultipleStockPrices } from '../services/stocksApi';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { green, red } from '@mui/material/colors';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalValue, setTotalValue] = useState(0);
  const [dailyChange, setDailyChange] = useState({ value: 0, percentage: 0 });

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        if (!currentUser) return;
        
        setLoading(true);
        const portfolioData = await getUserPortfolio(currentUser.uid);
        
        if (portfolioData) {
          // Get stock symbols for price updates
          const symbols = portfolioData.stocks.map(stock => stock.symbol);
          
          if (symbols.length > 0) {
            const stockPrices = await getMultipleStockPrices(symbols);
            
            // Update portfolio with current prices
            await updateStockPrices(currentUser.uid, stockPrices);
            
            // Fetch updated portfolio
            const updatedPortfolio = await getUserPortfolio(currentUser.uid);
            setPortfolio(updatedPortfolio);
            
            // Calculate total value and daily change
            let totalStocksValue = 0;
            let totalDailyChange = 0;
            
            updatedPortfolio.stocks.forEach(stock => {
              const currentPrice = stockPrices[stock.symbol]?.regularMarketPrice || stock.averagePrice;
              const previousClose = stockPrices[stock.symbol]?.regularMarketPreviousClose || currentPrice;
              const stockValue = stock.quantity * currentPrice;
              const dailyChangeValue = stock.quantity * (currentPrice - previousClose);
              
              totalStocksValue += stockValue;
              totalDailyChange += dailyChangeValue;
            });
            
            const portfolioTotalValue = updatedPortfolio.cash + totalStocksValue;
            setTotalValue(portfolioTotalValue);
            
            // Calculate daily change percentage
            const dailyChangePercentage = (totalDailyChange / portfolioTotalValue) * 100;
            setDailyChange({
              value: totalDailyChange,
              percentage: dailyChangePercentage
            });
          } else {
            setPortfolio(portfolioData);
            setTotalValue(portfolioData.cash);
          }
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPortfolio();
    
    // Set up interval to refresh data (during market hours)
    const intervalId = setInterval(() => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      
      // Only refresh during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
      if (day >= 1 && day <= 5 && ((hours >= 9 && now.getMinutes() >= 30) || hours > 9) && hours < 16) {
        fetchPortfolio();
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [currentUser]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!portfolio) return <Alert severity="info">No portfolio data available</Alert>;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Portfolio
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h4" component="div">
                ${(totalValue || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Available Cash
              </Typography>
              <Typography variant="h4" component="div">
                ${(portfolio?.cash || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderLeft: dailyChange.value >= 0 ? `4px solid ${green[500]}` : `4px solid ${red[500]}`
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Today's Change
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {dailyChange.value >= 0 ? (
                  <ArrowDropUpIcon sx={{ color: green[500] }} />
                ) : (
                  <ArrowDropDownIcon sx={{ color: red[500] }} />
                )}
                <Typography 
                  variant="h4" 
                  component="div" 
                  color={dailyChange.value >= 0 ? green[500] : red[500]}
                >
                  ${Math.abs((dailyChange.value || 0)).toFixed(2)}
                  <Typography 
                    component="span" 
                    variant="body2" 
                    color={dailyChange.value >= 0 ? green[500] : red[500]}
                    sx={{ ml: 1 }}
                  >
                    ({dailyChange.value >= 0 ? '+' : ''}{(dailyChange.percentage || 0).toFixed(2)}%)
                  </Typography>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h5" component="h2" gutterBottom>
        Your Stocks
      </Typography>
      
      {portfolio.stocks.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">
            You don't own any stocks yet.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/market" 
            startIcon={<AddCircleOutlineIcon />}
          >
            Go to Market
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Company</TableCell>
                <TableCell align="right">Shares</TableCell>
                <TableCell align="right">Avg. Price</TableCell>
                <TableCell align="right">Current Price</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Gain/Loss</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.stocks.map(stock => {
                const currentPrice = stock.currentPrice || stock.averagePrice;
                const totalValue = stock.quantity * currentPrice;
                const gainLoss = totalValue - (stock.quantity * stock.averagePrice);
                const gainLossPercentage = (gainLoss / (stock.quantity * stock.averagePrice)) * 100;
                
                return (
                  <TableRow key={stock.symbol} hover>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      {stock.symbol}
                    </TableCell>
                    <TableCell>{stock.companyName}</TableCell>
                    <TableCell align="right">{stock.quantity}</TableCell>
                    <TableCell align="right">${(stock.averagePrice || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(currentPrice || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(totalValue || 0).toFixed(2)}</TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        color: gainLoss >= 0 ? green[500] : red[500],
                        fontWeight: 'medium'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {gainLoss >= 0 ? (
                          <ArrowDropUpIcon fontSize="small" />
                        ) : (
                          <ArrowDropDownIcon fontSize="small" />
                        )}
                        ${Math.abs((gainLoss || 0)).toFixed(2)}
                        <Typography 
                          variant="caption" 
                          component="span" 
                          sx={{ ml: 0.5 }}
                        >
                          ({gainLoss >= 0 ? '+' : ''}{(gainLossPercentage || 0).toFixed(2)}%)
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}