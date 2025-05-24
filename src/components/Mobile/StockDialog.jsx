import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  CircularProgress, Button, useTheme, useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { green, red } from '@mui/material/colors';
import StockDetails from '../Dashboard/StocksDetails';
import ExtendedHoursPrice from '../StockMarket/ExtendedHoursPrice';
import WatchlistToggle from '../StockMarket/WatchlistToggle';

export default function StockDialog({
  open,
  onClose,
  selectedStock,
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
  showPortfolioInfo = true
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClose = () => {
    onClose();
  };

  if (!selectedStock) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isMobile ? "xs" : "md"}
      fullWidth={!isMobile}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          m: isMobile ? 1 : 2,
          maxHeight: isMobile ? '80vh' : '90vh',
          width: isMobile ? '320px' : 'auto',
          // Add glow effect for desktop, clean for mobile
          ...(isMobile ? {} : {
            backgroundImage: theme => theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, #2d2d2d 0%, #1f1f1f 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #f7f9fc 100%)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(66, 153, 225, 0.15)'
              : '0 8px 24px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
            border: theme => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : 'none',
          })
        }
      }}
    >
      <DialogTitle sx={{
        background: theme => !isMobile ? (theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(0, 0, 0, 0.01)') : 'transparent',
        py: isMobile ? 1 : 1.5,
        px: isMobile ? 1.5 : 2.5,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 0.5 : 1,
            minWidth: 0,
            flex: 1
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
              fontWeight: 600,
              fontSize: isMobile ? '1rem' : '1.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {isMobile 
                ? selectedStock.symbol 
                : `${selectedStock.longname || selectedStock.shortname || selectedStock.companyName} (${selectedStock.symbol})`
              }
            </Typography>
            <WatchlistToggle stock={selectedStock} />
          </Box>
          <IconButton
            onClick={handleClose}
            size={isMobile ? "small" : "medium"}
            sx={{
              flexShrink: 0,
              borderRadius: '8px',
              p: isMobile ? 0.5 : 1,
              '&:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <CloseIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: isMobile ? 1 : 3,
        overflow: 'auto'
      }}>
        {isMobile ? (
          // Mobile Compact Layout
          <MobileStockContent
            selectedStock={selectedStock}
            stockDetails={stockDetails}
            loading={loading}
            tradeType={tradeType}
            setTradeType={setTradeType}
            quantity={quantity}
            setQuantity={setQuantity}
            portfolio={portfolio}
            onBuy={onBuy}
            onSell={onSell}
            calculateMaxBuyQuantity={calculateMaxBuyQuantity}
            calculateTransactionAmount={calculateTransactionAmount}
            showPortfolioInfo={showPortfolioInfo}
          />
        ) : (
          // Desktop Full Layout
          <StockDetails
            stock={selectedStock}
            stockDetails={stockDetails}
            loading={loading}
            tradeType={tradeType}
            setTradeType={setTradeType}
            quantity={quantity}
            setQuantity={setQuantity}
            portfolio={portfolio}
            onBuy={onBuy}
            onSell={onSell}
            calculateMaxBuyQuantity={calculateMaxBuyQuantity}
            calculateTransactionAmount={calculateTransactionAmount}
            showPortfolioInfo={showPortfolioInfo}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Mobile-specific content component
function MobileStockContent({
  selectedStock,
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
  showPortfolioInfo
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!stockDetails) {
    return <Typography>Could not load stock details</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Enhanced Price Section */}
      <Box sx={{ 
        p: 1.5, 
        borderRadius: 2,
        backgroundColor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.02)' 
          : 'rgba(0,0,0,0.01)',
        border: theme => `1px solid ${theme.palette.divider}`
      }}>
        {/* Company name */}
        <Typography variant="caption" color="text.secondary" sx={{ 
          fontSize: '0.7rem',
          display: 'block',
          mb: 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {selectedStock.longname || selectedStock.shortname || selectedStock.companyName}
        </Typography>

        {/* Main price */}
        <Typography variant="h4" sx={{ 
          fontSize: '1.75rem', 
          fontWeight: 'bold',
          mb: 0.5
        }}>
          ${stockDetails.regularMarketPrice.toFixed(2)}
        </Typography>
        
        {/* Change */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          {stockDetails.regularMarketChange >= 0 ? (
            <ArrowDropUpIcon sx={{ color: green[500], fontSize: '1rem' }} />
          ) : (
            <ArrowDropDownIcon sx={{ color: red[500], fontSize: '1rem' }} />
          )}
          <Typography variant="body2" color={stockDetails.regularMarketChange >= 0 ? green[500] : red[500]} sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
            {stockDetails.regularMarketChange >= 0 ? '+' : ''}{stockDetails.regularMarketChange.toFixed(2)} 
            ({stockDetails.regularMarketChangePercent.toFixed(2)}%)
          </Typography>
        </Box>

        <ExtendedHoursPrice stockDetails={stockDetails} />

        {/* Market details in two columns */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 1, 
          mt: 1,
          pt: 1,
          borderTop: theme => `1px solid ${theme.palette.divider}`
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Open
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: '500' }}>
              ${stockDetails.regularMarketOpen?.toFixed(2) || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Prev Close
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: '500' }}>
              ${stockDetails.regularMarketPreviousClose?.toFixed(2) || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Day Low
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: '500' }}>
              ${stockDetails.regularMarketDayLow?.toFixed(2) || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Day High
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: '500' }}>
              ${stockDetails.regularMarketDayHigh?.toFixed(2) || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Position Info */}
      {showPortfolioInfo && selectedStock.quantity > 0 && (
        <Box sx={{ 
          p: 1, 
          borderRadius: 2,
          backgroundColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(76, 175, 80, 0.05)' 
            : 'rgba(76, 175, 80, 0.02)',
          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)'}`
        }}>
          <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
            Your Position
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {selectedStock.quantity} shares @ ${selectedStock.averagePrice.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              ${(selectedStock.quantity * stockDetails.regularMarketPrice).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Trading Section */}
      <Box sx={{ 
        p: 1.5, 
        borderRadius: 2,
        backgroundColor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.02)' 
          : 'rgba(0,0,0,0.01)',
        border: theme => `1px solid ${theme.palette.divider}`
      }}>
        {/* Trade Type Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Button
            variant={tradeType === 'buy' ? 'contained' : 'outlined'}
            onClick={() => setTradeType('buy')}
            size="small"
            sx={{ flex: 1, py: 0.5 }}
          >
            Buy
          </Button>
          <Button
            variant={tradeType === 'sell' ? 'contained' : 'outlined'}
            onClick={() => setTradeType('sell')}
            size="small"
            color="secondary"
            sx={{ flex: 1, py: 0.5 }}
          >
            Sell
          </Button>
        </Box>

        {/* Quantity Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Qty:</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            sx={{ minWidth: '30px', width: '30px', height: '30px', p: 0 }}
          >
            <RemoveIcon fontSize="small" />
          </Button>
          
          <Typography variant="body2" sx={{ 
            minWidth: '30px', 
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            {quantity}
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => setQuantity(quantity + 1)}
            sx={{ minWidth: '30px', width: '30px', height: '30px', p: 0 }}
          >
            <AddIcon fontSize="small" />
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', ml: 1 }}>
            Max: {tradeType === 'buy' 
              ? calculateMaxBuyQuantity(stockDetails, portfolio)
              : (selectedStock.quantity || 0)
            }
          </Typography>
        </Box>

        {/* Transaction Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {tradeType === 'buy' ? 'Cost' : 'Proceeds'}:
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
            ${calculateTransactionAmount(stockDetails, quantity)}
          </Typography>
        </Box>

        {/* Cash Available */}
        {tradeType === 'buy' && portfolio && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Available Cash:
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              ${portfolio.cash.toFixed(2)}
            </Typography>
          </Box>
        )}

        {/* Action Button */}
        <Button
          variant="contained"
          color={tradeType === 'buy' ? 'primary' : 'secondary'}
          fullWidth
          size="small"
          sx={{ py: 1, fontWeight: 600 }}
          onClick={tradeType === 'buy' ? onBuy : onSell}
          disabled={
            (tradeType === 'buy' && (
              !portfolio ||
              portfolio.cash < stockDetails.regularMarketPrice * quantity
            )) ||
            (tradeType === 'sell' && (
              !selectedStock || selectedStock.quantity < quantity
            ))
          }
        >
          {tradeType === 'buy' ? 'Buy' : 'Sell'} {quantity} share{quantity !== 1 ? 's' : ''}
        </Button>
      </Box>
    </Box>
  );
}