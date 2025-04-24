import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Tabs, Tab, TextField, Button,
    Skeleton, CircularProgress, Divider, Paper, Stack, ButtonGroup
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExtendedHoursPrice from '../StockMarket/ExtendedHoursPrice';
import { green, red } from '@mui/material/colors';

export default function StockDetails({
    stock,
    stockDetails,
    loading,
    tradeType,
    setTradeType,
    quantity,
    setQuantity,
    portfolio,
    onBuy,
    onSell,
    calculateMaxBuyQuantity,
    calculateTransactionAmount,
    showPortfolioInfo = false
}) {
    const [inputValue, setInputValue] = useState(quantity.toString());

    // When the quantity prop changes from outside, update the input value
    React.useEffect(() => {
        setInputValue(quantity.toString());
    }, [quantity]);

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <Skeleton variant="rectangular" height={120} />
                <Skeleton variant="text" sx={{ mt: 2 }} />
                <Skeleton variant="text" />
            </Box>
        );
    }

    if (!stockDetails) {
        return <Typography>Could not load stock details</Typography>;
    }

    const isPositive = stockDetails.regularMarketChange >= 0;
    const positiveColor = green[500];
    const negativeColor = red[500];
    const changeColor = isPositive ? positiveColor : negativeColor;

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            {/* Header with Symbol and Name */}
            <Box sx={{
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="700">{stock.symbol}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {stockDetails.shortName || 'Stock'}
                    </Typography>
                </Box>

                {/* Trading Tabs - Moved to header */}
                <ButtonGroup
                    variant="outlined"
                    size="small"
                    sx={{
                        height: 36,
                        '& .MuiButton-root': {
                            px: 3,
                            fontWeight: 600
                        }
                    }}
                >
                    <Button
                        color="primary"
                        variant={tradeType === 'buy' ? 'contained' : 'outlined'}
                        onClick={() => setTradeType('buy')}
                    >
                        Buy
                    </Button>
                    <Button
                        color="secondary"
                        variant={tradeType === 'sell' ? 'contained' : 'outlined'}
                        onClick={() => setTradeType('sell')}
                    >
                        Sell
                    </Button>
                </ButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left Section: Price and Position */}
                <Box sx={{ flex: 1, p: 3, borderRight: { xs: 'none', md: '1px solid' }, borderColor: 'divider', borderBottom: { xs: '1px solid', md: 'none' }, mb: { xs: 2, md: 0 } }}>
                    {/* Price Display */}
                    <Box mb={3}>
                        <Typography variant="h3" component="div" fontWeight="700" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                            ${stockDetails.regularMarketPrice.toFixed(2)}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: changeColor,
                                }}
                            >
                                {isPositive ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                                <Typography variant="body2" component="span" fontWeight="600">
                                    {isPositive ? '+' : ''}
                                    {stockDetails.regularMarketChange.toFixed(2)}
                                </Typography>
                            </Box>

                            <Typography variant="body2" component="span" fontWeight="600" color={changeColor}>
                                ({stockDetails.regularMarketChangePercent.toFixed(2)}%)
                            </Typography>
                        </Stack>

                        <ExtendedHoursPrice stockDetails={stockDetails} />
                    </Box>

                    {/* Position Info */}
                    {showPortfolioInfo && stock.quantity > 0 && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="600" color="primary" mb={1.5}>
                                Your Position
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Shares</Typography>
                                    <Typography variant="body1" fontWeight="700">
                                        {stock.quantity}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Avg. Cost</Typography>
                                    <Typography variant="body1" fontWeight="700">
                                        ${stock.averagePrice.toFixed(2)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Value</Typography>
                                    <Typography variant="body1" fontWeight="700">
                                        ${(stock.quantity * stockDetails.regularMarketPrice).toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* Market Data - Redesigned as horizontal stats */}
                    <Typography variant="subtitle2" fontWeight="600" color="primary" mb={1.5}>
                        Market Data
                    </Typography>

                    <Stack spacing={1.5}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Open</Typography>
                            <Typography variant="body2" fontWeight="600">${stockDetails.regularMarketOpen.toFixed(2)}</Typography>
                        </Stack>

                        <Divider sx={{ opacity: 0.4 }} />

                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Previous Close</Typography>
                            <Typography variant="body2" fontWeight="600">${stockDetails.regularMarketPreviousClose.toFixed(2)}</Typography>
                        </Stack>

                        <Divider sx={{ opacity: 0.4 }} />

                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Day Range</Typography>
                            <Typography variant="body2" fontWeight="600">
                                ${stockDetails.regularMarketDayLow.toFixed(2)} - ${stockDetails.regularMarketDayHigh.toFixed(2)}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                {/* Right Section: Trading Panel */}
                <Box sx={{
                    flex: 1,
                    p: 3,
                    background: theme => theme.palette.mode === 'dark'
                        ? 'rgba(66, 153, 225, 0.03)'
                        : 'rgba(25, 118, 210, 0.01)'
                }}>
                    <Typography variant="subtitle1" fontWeight="600" mb={2}>
                        {tradeType === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
                    </Typography>

                    {/* Quantity Selector with +/- buttons */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                            Quantity
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                sx={{ minWidth: '36px', width: '36px', height: '36px', p: 0 }}
                            >
                                <RemoveIcon fontSize="small" />
                            </Button>

                            <TextField
                                type="number"
                                value={inputValue}
                                onChange={(e) => {
                                    // Allow any value during typing, including empty string
                                    setInputValue(e.target.value);
                                }}
                                onBlur={() => {
                                    // When focus leaves the field, enforce the minimum value
                                    const newValue = parseInt(inputValue) || 1;
                                    setQuantity(newValue);
                                    setInputValue(newValue.toString());
                                }}
                                onKeyDown={(e) => {
                                    // Also update quantity on Enter key
                                    if (e.key === 'Enter') {
                                        const newValue = parseInt(inputValue) || 1;
                                        setQuantity(newValue);
                                        setInputValue(newValue.toString());
                                    }
                                }}
                                InputProps={{
                                    inputProps: {
                                        style: {
                                            textAlign: 'center',
                                            padding: '8px',
                                            // Remove the spinner arrows
                                            MozAppearance: 'textfield',
                                        }
                                    },
                                    // Remove the spinner arrows with a global style
                                    sx: {
                                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                    }
                                }}
                                sx={{
                                    width: '80px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                    }
                                }}
                            />

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setQuantity(quantity + 1)}
                                sx={{ minWidth: '36px', width: '36px', height: '36px', p: 0 }}
                            >
                                <AddIcon fontSize="small" />
                            </Button>

                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                Max: {
                                    tradeType === 'buy'
                                        ? calculateMaxBuyQuantity(stockDetails, portfolio)
                                        : (stock.quantity || 0)
                                }
                            </Typography>
                        </Stack>
                    </Box>

                    {/* Transaction Summary */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            backgroundColor: theme => theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.03)'
                                : 'rgba(0, 0, 0, 0.02)',
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {tradeType === 'buy' ? 'Cost' : 'Proceeds'}
                                </Typography>
                                <Typography variant="h6" fontWeight="700">
                                    ${calculateTransactionAmount(stockDetails, quantity)}
                                </Typography>
                            </Box>

                            {tradeType === 'buy' && portfolio && (
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Available Cash
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        ${portfolio.cash.toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>

                    {/* Action Button - Now aligned to the right */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color={tradeType === 'buy' ? 'primary' : 'secondary'}
                            sx={{
                                borderRadius: 2,
                                py: 1,
                                fontWeight: 600,
                                textTransform: 'none',
                                width: 'auto',
                                display: 'inline-block',
                                minWidth: '120px',
                                boxShadow: 1
                            }}
                            onClick={tradeType === 'buy' ? onBuy : onSell}
                            disabled={
                                (tradeType === 'buy' && (
                                    !portfolio ||
                                    portfolio.cash < stockDetails.regularMarketPrice * quantity
                                )) ||
                                (tradeType === 'sell' && (
                                    !stock || stock.quantity < quantity
                                ))
                            }
                        >
                            {tradeType === 'buy' ? 'Buy' : 'Sell'} {quantity} share{quantity !== 1 ? 's' : ''}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
}