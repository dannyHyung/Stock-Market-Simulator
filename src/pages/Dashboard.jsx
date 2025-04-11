import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserPortfolio, updateStockPrices, getPortfolioHistory, updatePortfolioHistory } from '../services/firestore';
import { getMultipleStockPrices } from '../services/stocksApi';
import StocksTable from '../components/Dashboard/StocksTable';
import { format, subDays, isAfter } from 'date-fns';
import { Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { green, red } from '@mui/material/colors';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Dashboard() {
    const { currentUser } = useAuth();
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

                        // Update portfolio history
                        await updatePortfolioHistory(currentUser.uid, portfolioTotalValue);

                        // Get portfolio history
                        const history = await getPortfolioHistory(currentUser.uid);
                        setPortfolioHistory(history);
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

    const refreshPortfolio = async () => {
        try {
          const portfolioData = await getUserPortfolio(currentUser.uid);
          setPortfolio(portfolioData);
          
          // Any other portfolio refresh logic you need
        } catch (error) {
          console.error('Error refreshing portfolio:', error);
        }
      };

    // Prepare chart data
    const prepareChartData = () => {
        // Sort history by timestamp
        const sortedHistory = [...portfolioHistory].sort((a, b) =>
            new Date(a.timestamp.seconds * 1000) - new Date(b.timestamp.seconds * 1000)
        );

        // Get data for the last 7 days
        const sevenDaysAgo = subDays(new Date(), 7);
        const recentHistory = sortedHistory.filter(item =>
            isAfter(new Date(item.timestamp.seconds * 1000), sevenDaysAgo)
        );

        // Format data for Chart.js
        const labels = recentHistory.map(item =>
            format(new Date(item.timestamp.seconds * 1000), 'MMM dd')
        );

        const data = recentHistory.map(item => item.value);

        return {
            labels,
            datasets: [
                {
                    label: 'Portfolio Value',
                    data,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.4,
                },
            ],
        };
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `$${context.raw.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    callback: function (value) {
                        return '$' + value.toFixed(2);
                    }
                }
            }
        },
        maintainAspectRatio: false
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
            <Typography variant="h4" component="h1" gutterBottom>
                Your Portfolio
            </Typography>

            {/* Portfolio Chart */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, height: 300 }}>
                {/* <Typography variant="h6" gutterBottom>
                    Portfolio Value History
                </Typography> */}
                {portfolioHistory.length > 1 ? (
                    <Line data={prepareChartData()} options={chartOptions} height={250} />
                ) : (
                    <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">
                            Not enough data to display chart. Check back later as you use the app.
                        </Typography>
                    </Box>
                )}
            </Paper>

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

            <StocksTable portfolio={portfolio} onPortfolioUpdate={refreshPortfolio} />
        </Box>
    );
}