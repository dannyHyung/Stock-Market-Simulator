import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactionHistory } from '../services/firestore';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Box, Typography, TextField, MenuItem, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, useTheme, useMediaQuery, Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ClearIcon from '@mui/icons-material/Clear';

export default function TransactionHistory() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    symbol: '',
    dateFrom: null,
    dateTo: null
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        if (!currentUser) return;
        
        const history = await getTransactionHistory(currentUser.uid);
        setTransactions(history || []);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [currentUser]);
  
  // Apply filters to transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Type filter
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    
    // Symbol filter
    if (filters.symbol && 
        !transaction.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    const transactionDate = transaction.date instanceof Date 
      ? transaction.date 
      : new Date(transaction.date.seconds * 1000);
    
    if (filters.dateFrom && transactionDate < filters.dateFrom) {
      return false;
    }
    
    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (transactionDate > endOfDay) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
    return dateB - dateA;
  });
  
  // Get unique symbols for filter dropdown
  const symbols = [...new Set(transactions.map(t => t.symbol))];
  
  // Helper function to format date in EST
  function formatDateEST(date) {
    const dateObj = date instanceof Date ? date : new Date(date.seconds * 1000);
    // return formatInTimeZone(dateObj, 'America/New_York', 'MMM d, yyyy - h:mm a z');
    return formatInTimeZone(dateObj, 'America/New_York', 'MMM d, yyyy');
  }
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: 'all',
      symbol: '',
      dateFrom: null,
      dateTo: null
    });
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: { xs: '1.5rem', sm: '2.125rem' } 
        }}>
          Transaction History
        </Typography>
        
        <IconButton 
          onClick={() => setFilterOpen(!filterOpen)}
          color="primary"
          aria-label="toggle filters"
        >
          <FilterListIcon />
          {filterOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
      
      {/* Main Content */}
      <TableContainer component={Paper} sx={{ position: 'relative' }}>
        {/* Filter Row */}
        <Collapse in={filterOpen}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              {(filters.type !== 'all' || filters.symbol || filters.dateFrom || filters.dateTo) && (
                <IconButton size="small" onClick={clearFilters} title="Clear all filters">
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2 
            }}>
              <TextField
                select
                size="small"
                label="Transaction Type"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="buy">Buy</MenuItem>
                <MenuItem value="sell">Sell</MenuItem>
              </TextField>
              
              <TextField
                select
                size="small"
                label="Stock Symbol"
                value={filters.symbol}
                onChange={(e) => setFilters({...filters, symbol: e.target.value})}
              >
                <MenuItem value="">All Stocks</MenuItem>
                {symbols.map(symbol => (
                  <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                ))}
              </TextField>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => setFilters({...filters, dateFrom: date})}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => setFilters({...filters, dateTo: date})}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Box>
          </Box>
        </Collapse>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              You haven't made any transactions yet.
            </Typography>
          </Box>
        ) : (
          <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Company</TableCell>
                <TableCell align="right">Shares</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No transactions match your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((transaction, index) => {
                  const isBuy = transaction.type === 'buy';
                  
                  return (
                    <TableRow 
                      key={index}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        borderLeft: `4px solid ${isBuy ? theme.palette.success.main : theme.palette.error.main}`
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isBuy ? (
                            <ShoppingCartIcon 
                              fontSize="small" 
                              sx={{ mr: 1, color: theme.palette.success.main }} 
                            />
                          ) : (
                            <SellIcon 
                              fontSize="small" 
                              sx={{ mr: 1, color: theme.palette.error.main }} 
                            />
                          )}
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{transaction.symbol}</TableCell>
                      <TableCell>{transaction.companyName}</TableCell>
                      <TableCell align="right">{transaction.quantity}</TableCell>
                      <TableCell align="right">${transaction.price.toFixed(2)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontWeight: 'bold',
                          color: isBuy ? theme.palette.success.main : theme.palette.error.main
                        }}
                      >
                        ${transaction.total.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateEST(transaction.date)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}