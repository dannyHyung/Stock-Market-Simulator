import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStockData } from '../../contexts/StockDataContext';
import { getCurrentPrice, calculateMaxBuyQuantity, calculateTransactionAmount } from '../../utils/stockUtils';
import { buyStock, sellStock } from '../../services/firestore';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Button, Dialog, DialogContent, DialogTitle, IconButton,
    Snackbar, Alert, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { green, red } from '@mui/material/colors';
import StockDetails from './StocksDetails';

export default function MobileStocksView({ portfolio, onPortfolioUpdate }) {
    const { currentUser } = useAuth();
    const { getStock } = useStockData();
    const [selectedStock, setSelectedStock] = useState(null);
    const [stockDetails, setStockDetails] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [tradeType, setTradeType] = useState('sell');
    const [quantity, setQuantity] = useState(1);
    const [transactionMessage, setTransactionMessage] = useState({ text: '', type: '' });

    // Stock handling functions - same as your existing code
    const handleStockClick = async (stock) => {
        setSelectedStock(stock);
        setDialogOpen(true);
        setDialogLoading(true);
        setTradeType('sell');
        setQuantity(1);

        try {
            let details = await getStock(stock.symbol, { localOnly: true });
            if (!details) {
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

    // Other handler functions - copy from your code

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
                if (onPortfolioUpdate) onPortfolioUpdate();
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

    const handleCloseMessage = () => {
        setTransactionMessage({ text: '', type: '' });
    };

    // Empty state handling
    if (!portfolio) return null;

    if (portfolio.stocks.length === 0) {
        return (
            <Box>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontSize: '1.1rem' }}>
                    Your Stocks
                </Typography>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                        You don't own any stocks yet.
                    </Typography>
                    <Button
                        variant="contained"
                        component={Link}
                        to="/market"
                        size="small"
                        startIcon={<AddCircleOutlineIcon />}
                    >
                        Go to Market
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Main table view
    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ fontSize: '1.1rem' }}>
                Your Stocks
            </Typography>

            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    // Add the same glow effect as CustomCard
                    boxShadow: theme => theme.palette.mode === 'dark'
                        ? '0 0 15px rgba(66, 153, 225, 0.15), 0 0 8px rgba(66, 153, 225, 0.08)'
                        : '0 6px 16px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.08)',
                    border: theme => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    transition: 'all 0.2s',
                    background: theme => theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, #2d2d2d 0%, #1f1f1f 100%)'
                        : 'linear-gradient(145deg, #ffffff 0%, #f7f9fc 100%)',
                    '&:hover': {
                        boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 0 20px rgba(66, 153, 225, 0.25), 0 0 10px rgba(66, 153, 225, 0.15)'
                            : '0 10px 20px rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.08)',
                        border: theme => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                    },
                }}
            >
                <Table size="small" sx={{ minWidth: 320 }}>
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: theme => theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.04)',
                            borderBottom: theme => `2px solid ${theme.palette.divider}`
                        }}>
                            <TableCell sx={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                py: 1.5,  // Increased padding
                                px: 1.5,
                                letterSpacing: '0.025em'
                            }}>
                                Stock
                            </TableCell>
                            <TableCell align="right" sx={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                py: 1.5,  // Increased padding
                                px: 1,
                                letterSpacing: '0.025em'
                            }}>
                                Shares
                            </TableCell>
                            <TableCell align="right" sx={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                py: 1.5,  // Increased padding
                                px: 1,
                                letterSpacing: '0.025em'
                            }}>
                                Price
                            </TableCell>
                            <TableCell align="right" sx={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                py: 1.5,  // Increased padding
                                px: 1,
                                letterSpacing: '0.025em'
                            }}>
                                Value
                            </TableCell>
                            <TableCell align="right" sx={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                py: 1.5,  // Increased padding
                                px: 1,
                                letterSpacing: '0.025em'
                            }}>
                                P&L
                            </TableCell>
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
                                    sx={{
                                        cursor: 'pointer',
                                        minHeight: '60px',  // Increased row height
                                        '&:hover': {
                                            backgroundColor: theme => theme.palette.mode === 'dark'
                                                ? 'rgba(66, 153, 225, 0.08)'
                                                : 'rgba(25, 118, 210, 0.04)',
                                            transform: 'scale(1.01)',  // Subtle scale on hover
                                            transition: 'all 0.2s ease'
                                        },
                                        '&:last-child td': {
                                            borderBottom: 'none'
                                        }
                                    }}
                                >
                                    {/* Stock Symbol & Company */}
                                    <TableCell sx={{ py: 1.5, px: 1.5, minWidth: 0 }}>  {/* Increased padding */}
                                        <Box>
                                            <Typography variant="body2" sx={{
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                lineHeight: 1.3,
                                                color: theme => theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2'
                                            }}>
                                                {stock.symbol}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    lineHeight: 1.2,
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                    maxWidth: '90px',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {stock.companyName}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Shares */}
                                    <TableCell align="center" sx={{ py: 1.5, px: 1 }}>  {/* Increased padding */}
                                        <Typography variant="body2" sx={{
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}>
                                            {stock.quantity}
                                        </Typography>
                                    </TableCell>

                                    {/* Current Price */}
                                    <TableCell align="right" sx={{ py: 1.5, px: 1 }}>  {/* Increased padding */}
                                        <Typography variant="body2" sx={{
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                            ${currentPrice.toFixed(2)}
                                        </Typography>
                                    </TableCell>

                                    {/* Total Value */}
                                    <TableCell align="right" sx={{ py: 1.5, px: 1 }}>  {/* Increased padding */}
                                        <Typography variant="body2" sx={{
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}>
                                            ${totalValue.toFixed(2)}
                                        </Typography>
                                    </TableCell>

                                    {/* Gain/Loss */}
                                    <TableCell align="right" sx={{ py: 1.5, px: 1 }}>  {/* Increased padding */}
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            minWidth: 0,
                                            gap: 0.5
                                        }}>
                                            {gainLoss >= 0 ? (
                                                <ArrowDropUpIcon sx={{
                                                    color: green[500],
                                                    fontSize: '1.1rem',
                                                    filter: 'drop-shadow(0 0 2px rgba(76, 175, 80, 0.3))'  // Subtle glow
                                                }} />
                                            ) : (
                                                <ArrowDropDownIcon sx={{
                                                    color: red[500],
                                                    fontSize: '1.1rem',
                                                    filter: 'drop-shadow(0 0 2px rgba(244, 67, 54, 0.3))'  // Subtle glow
                                                }} />
                                            )}
                                            <Box sx={{ textAlign: 'right', minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    color={gainLoss >= 0 ? green[500] : red[500]}
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    ${Math.abs(gainLoss).toFixed(2)}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color={gainLoss >= 0 ? green[500] : red[500]}
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        lineHeight: 1,
                                                        display: 'block',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Stock Details Dialog - Full screen for mobile */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                fullScreen={true}
                PaperProps={{
                    sx: {
                        m: 0,
                        p: 0,
                        borderRadius: 0,
                        height: '100%'
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
                            py: 1,
                            px: 1.5,
                            minHeight: '48px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                {selectedStock.symbol} - {selectedStock.companyName}
                            </Typography>
                            <IconButton
                                onClick={handleCloseDialog}
                                size="small"
                                edge="end"
                                sx={{ p: 0.5 }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ p: 1.5, pt: 2 }}>
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
                    </>
                )}
            </Dialog>

            {/* Message Snackbar */}
            <Snackbar
                open={Boolean(transactionMessage.text)}
                autoHideDuration={6000}
                onClose={handleCloseMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ bottom: { xs: 16, sm: 24 } }}
            >
                <Alert
                    onClose={handleCloseMessage}
                    severity={transactionMessage.type === 'success' ? 'success' : 'error'}
                    sx={{
                        width: '100%',
                        maxWidth: '340px',  // Optimized for 390px screens
                        fontSize: '0.8rem'
                    }}
                >
                    {transactionMessage.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}