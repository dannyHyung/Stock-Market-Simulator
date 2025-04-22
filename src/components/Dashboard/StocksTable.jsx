import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStockData } from '../../contexts/StockDataContext';
import { buyStock, sellStock } from '../../services/firestore';
import { getStockPrice } from '../../services/stocksApi';
import ExtendedHoursPrice from '../StockMarket/ExtendedHoursPrice';
import { getCurrentPrice, calculateMaxBuyQuantity, calculateTransactionAmount } from '../../utils/stockUtils';
import WatchlistToggle from '../StockMarket/WatchlistToggle';
import CustomTable from '../UI/CustomTable';
import StockDetails from './StocksDetails';
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
    const { getStock } = useStockData();
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
        setTradeType('sell');
        setQuantity(1);

        try {
            // First try to get stock data from local cache only
            let details = await getStock(stock.symbol, { localOnly: true });

            if (!details) {
                // If not in local cache, get it with skipUpdate to avoid refreshing entire dashboard
                details = await getStock(stock.symbol, { skipUpdate: true });
            }

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
                <CustomTable>
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
                                        {/* <TableCell align="right"> // to display pre or after hours price
                                            ${(currentPrice || 0).toFixed(2)}
                                            {stock.extendedHoursInfo?.hasExtendedHours && (
                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    {stock.extendedHoursInfo.isAfterHours ? 'After Hours' : 'Pre-Market'}
                                                </Typography>
                                            )}
                                        </TableCell> */}
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
                </CustomTable>
            )}

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
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
                {selectedStock && (
                    <>
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
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                        }}
                                    >
                                        {selectedStock.symbol} - {selectedStock.companyName}
                                    </Typography>
                                    <WatchlistToggle stock={selectedStock} />
                                </Box>
                                <IconButton
                                    onClick={handleCloseDialog}
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
                                loading={dialogLoading}
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

                        <DialogActions sx={{
                            p: 2.5,
                            backgroundColor: theme => theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.02)'
                                : 'rgba(0, 0, 0, 0.01)',
                            borderTop: theme => `1px solid ${theme.palette.divider}`,
                        }}>
                            <Button
                                onClick={handleCloseDialog}
                                sx={{
                                    borderRadius: '8px',
                                    px: 3,
                                    py: 1,
                                    fontWeight: 500,
                                    textTransform: 'none'
                                }}
                            >
                                Cancel
                            </Button>
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
                                sx={{
                                    borderRadius: '8px',
                                    px: 3,
                                    py: 1,
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    textTransform: 'none',
                                    boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
                                    '&:hover': {
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 5px 10px rgba(0,0,0,0.2)',
                                    },
                                    transition: 'all 0.2s',
                                }}
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