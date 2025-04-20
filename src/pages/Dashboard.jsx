import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStockData } from '../contexts/StockDataContext';
import { getUserPortfolio, updateStockPrices, getPortfolioHistory, updatePortfolioHistory } from '../services/firestore';
import { getMultipleStockPrices } from '../services/stocksApi';
import PortfolioChart from '../components/Dashboard/PortfolioChart';
import StocksTable from '../components/Dashboard/StocksTable';
import MarketStatusIndicator from '../components/Dashboard/MarketStatusIndicator';
import CustomCard from '../components/UI/CustomCard';
import ResponsiveChartContainer from '../components/UI/ResponsiveChartContainer';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { green, red } from '@mui/material/colors';
import { getYesterdayValue } from '../utils/portfolioUtils'

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { getMultipleStocks } = useStockData();
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalValue, setTotalValue] = useState(0);
    const [dailyChange, setDailyChange] = useState({ value: 0, percentage: 0 });
    const [portfolioHistory, setPortfolioHistory] = useState([]);

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

                        // Get portfolio history
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

                        // Update portfolio history with current value (for tomorrow's comparison)
                        await updatePortfolioHistory(currentUser.uid, portfolioTotalValue);
                    } else {
                        setPortfolio(portfolioData);
                        setTotalValue(portfolioData.cash);

                        // Update portfolio history with just cash
                        await updatePortfolioHistory(currentUser.uid, portfolioData.cash);

                        // Get portfolio history
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

        // // Set up interval to refresh data (during market hours)
        // const intervalId = setInterval(() => {
        //     const now = new Date();
        //     const day = now.getDay();
        //     const hours = now.getHours();
        //     const minutes = now.getMinutes();

        //     // Extended hours: 4:00 AM - 8:00 PM EST, Mon-Fri
        //     const isMarketDay = day >= 1 && day <= 5;
        //     const isExtendedHours = isMarketDay && hours >= 4 && hours < 20;

        //     // Only update when the market is open (including extended hours)
        //     if (isExtendedHours) {
        //         fetchPortfolio();
        //     }
        // }, 60000); // Update every minute

        // return () => clearInterval(intervalId);
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
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Your Portfolio
                </Typography>
                <MarketStatusIndicator />
            </Box>

            {/* Portfolio Chart */}
            <PortfolioChart portfolioHistory={portfolioHistory} loading={loading} />

            <Grid container spacing={3} sx={{ mb: 4 }}>
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
            </Grid>

            <StocksTable portfolio={portfolio} onPortfolioUpdate={refreshPortfolio} />
        </Box>
    );
}