import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStockData } from '../contexts/StockDataContext';
import { getUserPortfolio, updateStockPrices, getPortfolioHistory, updatePortfolioHistory } from '../services/firestore';
import { getMultipleStockPrices } from '../services/stocksApi';
import PortfolioChart from '../components/Dashboard/PortfolioChart';
import StocksTable from '../components/Dashboard/StocksTable';
import MarketStatusIndicator from '../components/Dashboard/MarketStatusIndicator';
import CustomCard from '../components/UI/CustomCard';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { green, red } from '@mui/material/colors';
import { getYesterdayValue } from '../utils/portfolioUtils'
import MobileStocksView from '../components/Mobile/MobileStocksView';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { getMultipleStocks } = useStockData();
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalValue, setTotalValue] = useState(0);
    const [dailyChange, setDailyChange] = useState({ value: 0, percentage: 0 });
    const [portfolioHistory, setPortfolioHistory] = useState([]);
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
                        // Use context to get stock data
                        const stockPrices = await getMultipleStocks(symbols);

                        // Update portfolio with current prices
                        await updateStockPrices(currentUser.uid, stockPrices);

                        // Fetch updated portfolio
                        const updatedPortfolio = await getUserPortfolio(currentUser.uid);
                        setPortfolio(updatedPortfolio);

                        // Calculate total value and daily change
                        let totalStocksValue = 0;
                        let yesterdayPortfolioValue = updatedPortfolio.cash; // Start with current cash value

                        updatedPortfolio.stocks.forEach(stock => {
                            // Get the most current price available (after-hours, pre-market, or regular)
                            const stockData = stockPrices[stock.symbol];
                            let currentPrice;

                            if (stockData) {
                                if (stockData.isAfterHours && stockData.postMarketPrice) {
                                    currentPrice = stockData.postMarketPrice;
                                } else if (stockData.isPreMarket && stockData.preMarketPrice) {
                                    currentPrice = stockData.preMarketPrice;
                                } else {
                                    currentPrice = stockData.regularMarketPrice;
                                }
                            } else {
                                currentPrice = stock.averagePrice;
                            }

                            // Get yesterday's closing price
                            const previousClose = stockData?.regularMarketPreviousClose || currentPrice;

                            // Calculate current value of this stock
                            const stockValue = stock.quantity * currentPrice;
                            totalStocksValue += stockValue;

                            // Calculate yesterday's value of this SAME stock position
                            const yesterdayStockValue = stock.quantity * previousClose;
                            yesterdayPortfolioValue += yesterdayStockValue;
                        });

                        // Current total portfolio value
                        const portfolioTotalValue = updatedPortfolio.cash + totalStocksValue;
                        setTotalValue(portfolioTotalValue);

                        // FIRST UPDATE HISTORY with current value
                        await updatePortfolioHistory(currentUser.uid, portfolioTotalValue);

                        // THEN get the updated portfolio history
                        const history = await getPortfolioHistory(currentUser.uid);
                        setPortfolioHistory(history);

                        // Get yesterday's portfolio value using the utility function
                        const yesterdayValue = getYesterdayValue(history);

                        if (yesterdayValue !== null) {
                            // Calculate TODAY'S CHANGE using historical data
                            const portfolioDailyChange = portfolioTotalValue - yesterdayValue;
                            const portfolioDailyChangePercentage = (portfolioDailyChange / yesterdayValue) * 100;

                            setDailyChange({
                                value: portfolioDailyChange,
                                percentage: portfolioDailyChangePercentage
                            });
                        } else {
                            // No historical data = no change to report
                            setDailyChange({
                                value: 0,
                                percentage: 0
                            });
                        }
                    } else {
                        setPortfolio(portfolioData);
                        setTotalValue(portfolioData.cash);

                        // Update portfolio history with just cash FIRST
                        await updatePortfolioHistory(currentUser.uid, portfolioData.cash);

                        // THEN get the updated portfolio history
                        const history = await getPortfolioHistory(currentUser.uid);
                        setPortfolioHistory(history);
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

    }, [currentUser, getMultipleStocks]);

    const refreshPortfolio = async () => {
        try {
            const portfolioData = await getUserPortfolio(currentUser.uid);
            setPortfolio(portfolioData);

            // Any other portfolio refresh logic you need
        } catch (error) {
            console.error('Error refreshing portfolio:', error);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
        </Box>
    );

    if (error) return <Alert severity="error">{error}</Alert>;
    if (!portfolio) return <Alert severity="info">No portfolio data available</Alert>;

    return (
        <Box sx={{
            width: '100%',
            overflow: 'hidden',
            px: isMobile ? 1 : 0,  // Add some padding on mobile if needed
        }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: isMobile ? 4 : 2,
                width: '100%',
                overflow: 'hidden',
                gap: 1,  // Add gap between title and indicator
            }}>
                <Typography variant="h4" component="h1" sx={{
                    fontSize: { xs: '1.5rem', sm: '2.125rem' }  
                }}>
                    Your Portfolio
                </Typography>
                <Box sx={{ flexShrink: 0 }}>  {/* Don't shrink the market indicator */}
                    <MarketStatusIndicator />
                </Box>
            </Box>

            {/* Portfolio Chart */}
            <Box sx={{
                mb: isMobile ? 6 : 4,
                height: isMobile ? '200px' : '300px',
                overflow: 'visible',  // Allow glow to show
                width: '100%',
                '& .MuiPaper-root': {
                    width: '100%',
                    maxWidth: '100%',
                    height: '100%',     // Ensure paper takes full height
                }
            }}>
                <PortfolioChart
                    portfolioHistory={portfolioHistory}
                    loading={loading}
                    compact={isMobile}  // Pass this flag to your PortfolioChart component
                />
            </Box>

            <Grid
                container
                spacing={isMobile ? 1.5 : 3}
                sx={{
                    mb: isMobile ? 5 : 4,
                    width: '100%',        // Ensure full width
                    ml: 0,                // Remove any margin-left
                    '& .MuiGrid-item': {  // Target all grid items
                        paddingLeft: isMobile ? '6px' : undefined,
                        paddingRight: isMobile ? '6px' : undefined,
                    }
                }}
            >
                {isMobile ? (
                    <>
                        <Grid item xs={4}>
                            <CustomCard sx={{ height: '100%' }}>
                            <CardContent sx={{ py: 1, px: 1 }}>   {/* Reduced padding */}
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                        Total Value
                                    </Typography>
                                    <Typography variant="subtitle1" component="div" sx={{ fontSize: '1rem', fontWeight: '600' }}>
                                        ${(totalValue || 0).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </CustomCard>
                        </Grid>

                        <Grid item xs={4}>
                            <CustomCard sx={{ height: '100%' }}>
                            <CardContent sx={{ py: 1, px: 1 }}>   {/* Reduced padding */}
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                        Available Cash
                                    </Typography>
                                    <Typography variant="subtitle1" component="div" sx={{ fontSize: '1rem', fontWeight: '600' }}>
                                        ${(portfolio?.cash || 0).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </CustomCard>
                        </Grid>

                        <Grid item xs={4}>
                            <CustomCard
                                sx={{
                                    borderLeft: dailyChange.value >= 0 ? `3px solid ${green[500]}` : `3px solid ${red[500]}`,  // Thinner border
                                    height: '100%'
                                }}
                            >
                                <CardContent sx={{ py: 1, px: 1 }}>   {/* Reduced padding */}
                                    <Box sx={{ mb: 0.1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                            Today's Change
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',  // Align to start instead of center
                                        gap: 0.25,
                                    }}>
                                        {dailyChange.value >= 0 ? (
                                            <ArrowDropUpIcon
                                                sx={{
                                                    color: green[500],
                                                    fontSize: '1.2rem',  // Smaller icon
                                                }}
                                            />
                                        ) : (
                                            <ArrowDropDownIcon
                                                sx={{
                                                    color: red[500],
                                                    fontSize: '1.2rem',  // Smaller icon
                                                }}
                                            />
                                        )}
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                component="div"
                                                sx={{
                                                    fontSize: '1rem',  // Smaller font
                                                    fontWeight: '600',
                                                    color: dailyChange.value >= 0 ? green[500] : red[500],
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                ${Math.abs((dailyChange.value || 0)).toFixed(2)}
                                            </Typography>
                                            <Typography
                                                component="div"
                                                variant="caption"
                                                color={dailyChange.value >= 0 ? green[500] : red[500]}
                                                sx={{
                                                    fontSize: '0.6rem',  // Very small percentage
                                                    fontWeight: '500',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ({dailyChange.value >= 0 ? '+' : ''}{(dailyChange.percentage || 0).toFixed(2)}%)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CustomCard>
                        </Grid>
                    </>
                ) : (
                    // Original desktop layout
                    <>
                        <Grid item xs={12} md={4}>
                            <CustomCard>
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Value
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        ${(totalValue || 0).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </CustomCard>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <CustomCard>
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Available Cash
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        ${(portfolio?.cash || 0).toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </CustomCard>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <CustomCard
                                sx={{
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
                            </CustomCard>
                        </Grid>
                    </>
                )}
            </Grid>
            {isMobile ? (
                <MobileStocksView portfolio={portfolio} onPortfolioUpdate={refreshPortfolio} />
            ) : (
                <StocksTable portfolio={portfolio} onPortfolioUpdate={refreshPortfolio} />
            )}
        </Box>
    );
}