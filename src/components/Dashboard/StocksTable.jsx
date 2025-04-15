import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buyStock, sellStock } from '../../services/firestore';
import { getStockPrice } from '../../services/stocksApi';
import ExtendedHoursPrice from '../StockMarket/ExtendedHoursPrice';
import { getCurrentPrice, calculateMaxBuyQuantity, calculateTransactionAmount } from '../../utils/stockUtils';
import WatchlistToggle from '../StockMarket/WatchlistToggle';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { green, red } from '@mui/material/colors';

export default function StocksTable({ portfolio, onPortfolioUpdate }) {
    const { currentUser } = useAuth();
    const [selectedStock, setSelectedStock] = useState(null);
    const [stockDetails, setStockDetails] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [tradeType, setTradeType] = useState('buy');
    const [quantity, setQuantity] = useState(1);
    const [transactionMessage, setTransactionMessage] = useState({ text: '', type: '' });
    const [dialogLoading, setDialogLoading] = useState(false);

    // Handle clicking on a stock row
    const handleStockClick = async (stock) => {
        setSelectedStock(stock);
        setDialogOpen(true);
        setDialogLoading(true);
        setTradeType('sell'); // Default to sell since they already own it
        setQuantity(1);

        try {
            const details = await getStockPrice(stock.symbol);
            setStockDetails(details);
        } catch (error) {
            console.error('Error fetching stock details:', error);
            setTransactionMessage({
                text: 'Error fetching stock details',
                type: 'error'
            });
        } finally {
            setDialogLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedStock(null);
        setStockDetails(null);
    };

    async function handleBuyStock() {
        if (!selectedStock || !stockDetails || quantity <= 0) return;

        setDialogLoading(true);

        try {

            const currentPrice = getCurrentPrice(stockDetails);

            const success = await buyStock(
                currentUser.uid,
                selectedStock.symbol,
                selectedStock.companyName,
                quantity,
                currentPrice
            );

            if (success) {
                setTransactionMessage({
                    text: `Successfully purchased ${quantity} shares of ${selectedStock.symbol} for $${(currentPrice * quantity).toFixed(2)}`,
                    type: 'success'
                });
                setQuantity(1);

                // Notify parent component to refresh portfolio data
                if (onPortfolioUpdate) onPortfolioUpdate();
            } else {
                setTransactionMessage({
                    text: 'Insufficient funds to complete purchase',
                    type: 'error'
                });
            }
        } catch (error) {
            setTransactionMessage({
                text: 'Error purchasing stock',
                type: 'error'
            });
        } finally {
            setDialogLoading(false);
        }
    }

    async function handleSellStock() {
        if (!selectedStock || !stockDetails || quantity <= 0) return;

        setDialogLoading(true);

        try {
            if (selectedStock.quantity < quantity) {
                setTransactionMessage({
                    text: `You don't own enough shares to sell`,
                    type: 'error'
                });
                setDialogLoading(false);
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
                setTransactionMessage({
                    text: `Successfully sold ${quantity} shares of ${selectedStock.symbol} for $${(currentPrice * quantity).toFixed(2)}`,
                    type: 'success'
                });
                setQuantity(1);

                // Notify parent component to refresh portfolio data
                if (onPortfolioUpdate) onPortfolioUpdate();

                // Close dialog if all shares were sold
                if (selectedStock.quantity === quantity) {
                    handleCloseDialog();
                }
            } else {
                setTransactionMessage({
                    text: 'Error selling stock',
                    type: 'error'
                });
            }
        } catch (error) {
            setTransactionMessage({
                text: 'Error selling stock',
                type: 'error'
            });
        } finally {
            setDialogLoading(false);
        }
    }

    // Clear transaction message
    const handleCloseMessage = () => {
        setTransactionMessage({ text: '', type: '' });
    };

    return (
        <Box>
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
                                <TableCell align="right">Total Gain/Loss</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {portfolio.stocks.map(stock => {
                                const currentPrice = stock.currentPrice || stock.averagePrice;
                                const totalValue = stock.quantity * currentPrice;
                                const gainLoss = totalValue - (stock.quantity * stock.averagePrice);
                                const gainLossPercentage = (gainLoss / (stock.quantity * stock.averagePrice)) * 100;

                                return (
                                    <TableRow
                                        key={stock.symbol}
                                        hover
                                        onClick={() => handleStockClick(stock)}
                                        sx={{ cursor: 'pointer' }}
                                    >
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

            {/* Stock Details Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                {selectedStock && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="h6">
                                        {selectedStock.symbol} - {selectedStock.companyName}
                                    </Typography>
                                    <WatchlistToggle stock={selectedStock} />
                                </Box>
                                <IconButton onClick={handleCloseDialog}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <Divider />
                        <DialogContent>
                            {dialogLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : stockDetails ? (
                                <>
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
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
                                                    <Typography variant="caption" color="text.secondary">Your Position</Typography>
                                                    <Typography variant="body1">{selectedStock.quantity} shares</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Avg. Cost</Typography>
                                                    <Typography variant="body1">${selectedStock.averagePrice.toFixed(2)}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Total Value</Typography>
                                                    <Typography variant="body1">${(selectedStock.quantity * stockDetails.regularMarketPrice).toFixed(2)}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Today's Open</Typography>
                                                    <Typography variant="body1">${stockDetails.regularMarketOpen.toFixed(2)}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                    <Typography variant="h6" gutterBottom>Trade {selectedStock.symbol}</Typography>

                                    <Tabs
                                        value={tradeType}
                                        onChange={(e, newValue) => setTradeType(newValue)}
                                        sx={{ mb: 2 }}
                                    >
                                        <Tab label="Buy" value="buy" />
                                        <Tab label="Sell" value="sell" />
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
                                                        : `Max: ${selectedStock.quantity} shares`
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
                                                {tradeType === 'buy' && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Available Cash: ${portfolio.cash.toFixed(2)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </>
                            ) : (
                                <Typography>Could not load stock details</Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button
                                variant="contained"
                                color={tradeType === 'buy' ? 'primary' : 'secondary'}
                                disabled={dialogLoading ||
                                    (tradeType === 'buy' && (
                                        !portfolio ||
                                        portfolio.cash < (stockDetails?.regularMarketPrice || 0) * quantity
                                    )) ||
                                    (tradeType === 'sell' && (
                                        !selectedStock || selectedStock.quantity < quantity
                                    ))
                                }
                                onClick={tradeType === 'buy' ? handleBuyStock : handleSellStock}
                            >
                                {dialogLoading
                                    ? 'Processing...'
                                    : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${quantity} Share${quantity !== 1 ? 's' : ''}`
                                }
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Message Snackbar */}
            <Snackbar
                open={Boolean(transactionMessage.text)}
                autoHideDuration={6000}
                onClose={handleCloseMessage}
            >
                <Alert
                    onClose={handleCloseMessage}
                    severity={transactionMessage.type === 'success' ? 'success' : 'error'}
                    sx={{ width: '100%' }}
                >
                    {transactionMessage.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}