import React from 'react';
import {
    Box, Typography, Grid, Tabs, Tab, TextField, Button,
    Skeleton, CircularProgress, Divider
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
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

    return (
        <>
            {/* Price and Info Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Box sx={{
                        p: 2.5,
                        borderRadius: '10px',
                        background: theme => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 0 10px rgba(66, 153, 225, 0.08)'
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                        border: theme => theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(0, 0, 0, 0.05)',
                    }}>
                        <Typography variant="h3" component="div" sx={{
                            fontSize: { xs: '2rem', sm: '2.5rem' },
                            fontWeight: 700,
                            mb: 1
                        }}>
                            ${stockDetails.regularMarketPrice.toFixed(2)}
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                color: stockDetails.regularMarketChange >= 0 ? green[500] : red[500],
                                mb: 1
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
                                ({stockDetails.regularMarketChangePercent.toFixed(2)}%)
                            </Typography>
                        </Box>
                        <ExtendedHoursPrice stockDetails={stockDetails} />
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{
                        height: '100%',
                        borderRadius: '10px',
                        background: theme => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                        border: theme => theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(0, 0, 0, 0.05)',
                    }}>
                        {/* If user owns this stock, show position info */}
                        {showPortfolioInfo && stock.quantity > 0 && (
                            <>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        px: 2.5,
                                        pt: 2.5,
                                        pb: 1.5,
                                        fontWeight: 600,
                                        color: theme => theme.palette.mode === 'dark' ? '#90caf9' : theme.palette.primary.main
                                    }}
                                >
                                    Your Position
                                </Typography>

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    px: 2.5,
                                    pb: 2
                                }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Shares</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            {stock.quantity}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Avg. Cost</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            ${stock.averagePrice.toFixed(2)}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Total Value</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            ${(stock.quantity * stockDetails.regularMarketPrice).toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider />
                            </>
                        )}

                        {/* Market information section */}
                        <Typography
                            variant="subtitle2"
                            sx={{
                                px: 2.5,
                                pt: 2.5,
                                pb: 1.5,
                                fontWeight: 600,
                                color: theme => theme.palette.mode === 'dark' ? '#90caf9' : theme.palette.primary.main
                            }}
                        >
                            Market Data
                        </Typography>

                        <Box sx={{ px: 2.5, pb: 2.5 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: '8px',
                                        backgroundColor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(44, 48, 52, 0.8)'
                                            : 'rgba(0, 0, 0, 0.05)',
                                        height: '100%'
                                    }}>
                                        <Typography variant="caption" color="text.secondary">Today's Open</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            ${stockDetails.regularMarketOpen.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: '8px',
                                        backgroundColor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(44, 48, 52, 0.8)'
                                            : 'rgba(0, 0, 0, 0.05)',
                                        height: '100%'
                                    }}>
                                        <Typography variant="caption" color="text.secondary">Previous Close</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            ${stockDetails.regularMarketPreviousClose.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: '8px',
                                        backgroundColor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(44, 48, 52, 0.8)'
                                            : 'rgba(0, 0, 0, 0.05)',
                                        height: '100%'
                                    }}>
                                        <Typography variant="caption" color="text.secondary">Day High</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            ${stockDetails.regularMarketDayHigh.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: '8px',
                                        backgroundColor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(44, 48, 52, 0.8)'
                                            : 'rgba(0, 0, 0, 0.05)',
                                        height: '100%'
                                    }}>
                                        <Typography variant="caption" color="text.secondary">Day Low</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                            ${stockDetails.regularMarketDayLow.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Trading Section */}
            <Box sx={{
                p: 2.5,
                borderRadius: '10px',
                background: theme => theme.palette.mode === 'dark'
                    ? 'rgba(66, 153, 225, 0.05)'
                    : 'rgba(25, 118, 210, 0.03)',
                border: theme => theme.palette.mode === 'dark'
                    ? '1px solid rgba(66, 153, 225, 0.1)'
                    : '1px solid rgba(25, 118, 210, 0.1)',
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Trade {stock.symbol}
                </Typography>

                <Tabs
                    value={tradeType}
                    onChange={(e, newValue) => setTradeType(newValue)}
                    sx={{
                        mb: 3,
                        '& .MuiTab-root': {
                            borderRadius: '8px 8px 0 0',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: theme => theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
                            }
                        }
                    }}
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
                                    : `Max: ${stock.quantity || 0} shares`
                            }
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: theme => theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(255, 255, 255, 0.9)',
                                }
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                p: 2,
                                borderRadius: '8px',
                                backgroundColor: theme => theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.03)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                border: theme => `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Estimated {tradeType === 'buy' ? 'Cost' : 'Proceeds'}
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                ${calculateTransactionAmount(stockDetails, quantity)}
                            </Typography>
                            {tradeType === 'buy' && portfolio && (
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
                    sx={{
                        mt: 3,
                        borderRadius: '8px',
                        px: 3,
                        py: 1.5,
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
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {quantity} Share{quantity !== 1 ? 's' : ''}
                </Button>
            </Box>
        </>
    );
}