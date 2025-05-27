import React, { useState, useEffect } from 'react';
import { getLeaderboard, getUserPortfolio } from '../services/firestore';
import { getUserDisplayNames } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import CustomTable from '../components/UI/CustomTable';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, useMediaQuery } from '@mui/material';

export default function Leaderboard() {
  const { currentUser } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserPortfolio, setSelectedUserPortfolio] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch leaderboard data
  async function fetchLeaderboard() {
    try {
      setLoading(true);
      setError('');

      // This might take a bit longer now due to real-time price fetching
      const data = await getLeaderboard();

      // Get display names for all users
      const userIds = data.map(entry => entry.userId);
      const displayNames = await getUserDisplayNames(userIds);

      setLeaderboardData(data);
      setUserDisplayNames(displayNames);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Get medal for top performers
  const getMedalColor = (index) => {
    if (index === 0) return "gold";
    if (index === 1) return "silver";
    if (index === 2) return "#cd7f32"; // bronze
    return null;
  };

  // View user portfolio
  const handleViewPortfolio = async (userId, userName) => {
    setSelectedUser({ userId, name: userName });
    setDialogOpen(true);
    setDialogLoading(true);

    try {
      const portfolio = await getUserPortfolio(userId);
      setSelectedUserPortfolio(portfolio);
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
    } finally {
      setDialogLoading(false);
    }
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setSelectedUserPortfolio(null);
  };

  // Calculate total investment for a stock
  const calculateTotalInvestment = (stock) => {
    return stock.quantity * stock.averagePrice;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{
          fontSize: { xs: '1.5rem', sm: '2.125rem' }
        }}>
          Leaderboard
        </Typography>
        <Button
          variant="contained"
          onClick={fetchLeaderboard}
          disabled={loading}
          size={isMobile ? 'small' : 'medium'} // Add responsive size
          sx={{
            backgroundColor: theme => theme.palette.mode === 'dark'
              ? 'rgba(66, 153, 225, 0.15)'
              : theme.palette.primary.main,
            color: theme => theme.palette.mode === 'dark'
              ? '#90caf9'
              : 'white',
            boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
            borderRadius: '8px',
            px: { xs: 1.5, sm: 2 }, // Smaller horizontal padding on mobile
            py: { xs: 0.75, sm: 1 }, // Smaller vertical padding on mobile
            minWidth: { xs: 'auto', sm: 'auto' }, // Remove minimum width constraints
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: theme => theme.palette.mode === 'dark'
                ? 'rgba(66, 153, 225, 0.25)'
                : theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 10px rgba(0,0,0,0.2)',
              '& .refresh-icon': {
                transform: 'rotate(180deg)',
              }
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }
          }}
        >
          {loading ? (
            <CircularProgress
              size={isMobile ? 16 : 20} // Smaller spinner on mobile
              color="inherit"
              sx={{ mr: { xs: 0.5, sm: 1 } }} // Less margin on mobile
            />
          ) : (
            <RefreshIcon
              className="refresh-icon"
              sx={{
                mr: { xs: 0.5, sm: 1 }, // Less margin on mobile
                fontSize: { xs: '1.1rem', sm: '1.25rem' }, // Smaller icon on mobile
                transition: 'transform 0.3s'
              }}
            />
          )}
          <Typography
            variant="button"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '0.875rem' }, // Smaller font on mobile
              display: 'inline'
            }}
          >
            Refresh
          </Typography>
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={3}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <CustomTable size="small" sx={{ minWidth: isMobile ? 320 : 650 }}>
            <TableHead>
              <TableRow sx={{
                backgroundColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.04)',
                borderBottom: theme => `2px solid ${theme.palette.divider}`
              }}>
                {isMobile ? (
                  // Mobile headers - only 3 columns
                  <>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, px: 1 }}>
                      Rank
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, px: 1 }}>
                      User
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, px: 1 }}>
                      Portfolio
                    </TableCell>
                  </>
                ) : (
                  // Desktop headers - all columns
                  <>
                    <TableCell>Rank</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Portfolio Value</TableCell>
                    <TableCell align="right">Cash</TableCell>
                    <TableCell align="right">Stocks Value</TableCell>
                    <TableCell align="right">Stocks Owned</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboardData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isMobile ? 3 : 7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No data available yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leaderboardData.map((entry, index) => (
                  <TableRow
                    key={entry.userId}
                    hover
                    sx={{
                      bgcolor: entry.userId === currentUser.uid ? 'action.selected' : 'inherit',
                      cursor: isMobile ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: theme => theme.palette.mode === 'dark'
                          ? 'rgba(66, 153, 225, 0.08)'
                          : 'rgba(25, 118, 210, 0.04)',
                        transform: isMobile ? 'scale(1.01)' : 'none',
                        transition: 'all 0.2s ease'
                      }
                    }}
                    onClick={isMobile ? () => handleViewPortfolio(
                      entry.userId,
                      userDisplayNames[entry.userId] || `User ${index + 1}`
                    ) : undefined}
                  >
                    {isMobile ? (
                      // Mobile layout - compact 3 columns
                      <>
                        {/* Rank */}
                        <TableCell sx={{ py: 1, px: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
                            {index < 3 ? (
                              <EmojiEventsIcon sx={{
                                color: getMedalColor(index),
                                fontSize: '1.5rem',
                                filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.3))'
                              }} />
                            ) : (
                              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {index + 1}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* User Info */}
                        <TableCell sx={{ py: 1, px: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color: entry.userId === currentUser.uid
                                ? (theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2')
                                : 'inherit',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '120px'
                            }}>
                              {userDisplayNames[entry.userId] || `User ${index + 1}`}
                            </Typography>
                            {entry.userId === currentUser.uid && (
                              <Chip
                                size="small"
                                label="You"
                                color="primary"
                                variant="outlined"
                                sx={{
                                  height: '16px',
                                  fontSize: '0.6rem',
                                  ml: 0.5,
                                  '& .MuiChip-label': { px: 0.5 }
                                }}
                              />
                            )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{
                              fontSize: '0.7rem',
                              display: 'block',
                              lineHeight: 1.2,
                              mt: 0.25
                            }}>
                              {entry.stockCount} stock{entry.stockCount <= 1 ? "" : "s"} • ${entry.cash.toFixed(0)} cash
                            </Typography>
                        </TableCell>

                        {/* Portfolio Value */}
                        <TableCell align="right" sx={{ py: 1, px: 1 }}>
                          <Typography variant="body1" sx={{
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32'
                          }}>
                            ${entry.totalValue.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{
                            fontSize: '0.65rem',
                            display: 'block',
                            lineHeight: 1
                          }}>
                            ${entry.stocksValue.toFixed(0)} in stocks
                          </Typography>
                        </TableCell>
                      </>
                    ) : (
                      // Desktop layout - all columns (your existing code)
                      <>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {index < 3 ? (
                              <EmojiEventsIcon sx={{ color: getMedalColor(index), mr: 1 }} />
                            ) : (
                              index + 1
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {userDisplayNames[entry.userId] || `User ${index + 1}`}
                            {entry.userId === currentUser.uid && (
                              <Chip
                                size="small"
                                label="You"
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${entry.totalValue.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">${entry.cash.toFixed(2)}</TableCell>
                        <TableCell align="right">${entry.stocksValue.toFixed(2)}</TableCell>
                        <TableCell align="right">{entry.stockCount}</TableCell>
                        <TableCell align="right" sx={{ py: 0.75 }}>
                          <Tooltip title="View Portfolio" placement="bottom" arrow>
                            <Button
                              size="small"
                              onClick={() => handleViewPortfolio(
                                entry.userId,
                                userDisplayNames[entry.userId] || `User ${index + 1}`
                              )}
                              sx={{
                                minWidth: 'auto',
                                px: 2,
                                borderRadius: '16px',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                boxShadow: theme => theme.palette.mode === 'dark'
                                  ? '0 0 10px rgba(66, 153, 225, 0.1), 0 0 4px rgba(66, 153, 225, 0.05)'
                                  : '0 2px 6px rgba(0,0,0,0.06)',
                                border: theme => theme.palette.mode === 'dark'
                                  ? '1px solid rgba(255, 255, 255, 0.1)'
                                  : '1px solid rgba(0, 0, 0, 0.08)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'translate(2px, -2px)',
                                  boxShadow: theme => theme.palette.mode === 'dark'
                                    ? '0 0 15px rgba(66, 153, 225, 0.2), 0 0 8px rgba(66, 153, 225, 0.1)'
                                    : '0 6px 12px rgba(0,0,0,0.1)',
                                  backgroundColor: theme => theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                },
                              }}
                            >
                              View
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </CustomTable>
        )}
      </Paper>

      {/* User Portfolio Dialog */}
      {/* User Portfolio Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        // Remove fullScreen completely
        PaperProps={{
          sx: {
            borderRadius: '12px',
            m: isMobile ? 1 : 2,  // Smaller margins on mobile
            maxHeight: '90vh',
            width: isMobile ? '80%' : 'auto',  // Almost full width on mobile
            // Remove custom background colors - use default
          }
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{
              // Remove custom background - use default
              borderBottom: theme => `1px solid ${theme.palette.divider}`,
              py: isMobile ? 1.5 : 2,
              px: isMobile ? 2 : 3,
              position: 'sticky',
              top: 0,
              zIndex: 1,
              // Use default background
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{
                  fontSize: isMobile ? '1.1rem' : '1.5rem',
                  fontWeight: 600
                }}>
                  {selectedUser.name}'s Portfolio
                </Typography>
                <IconButton
                  onClick={handleCloseDialog}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    borderRadius: '8px',
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
            <Divider />
            <DialogContent sx={{
              p: isMobile ? 1.5 : 3,  // Reduced padding on mobile
              overflow: 'auto'
            }}>
              {dialogLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : selectedUserPortfolio ? (
                <Box>
                  {/* Portfolio Summary Cards */}
                  <Box sx={{ mb: 3 }}>  {/* Reduced margin bottom */}
                    <Grid container spacing={isMobile ? 1.5 : 3}>  {/* Smaller spacing on mobile */}
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{
                          p: isMobile ? 1.5 : 2,
                          borderRadius: 2,
                          // Use simple elevation instead of custom background
                          elevation: 2,
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem'
                          }}>
                            Total Value
                          </Typography>
                          <Typography variant={isMobile ? "h6" : "h5"} sx={{
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: 'bold',
                            color: theme => theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32'
                          }}>
                            ${(selectedUserPortfolio.cash +
                              selectedUserPortfolio.stocks.reduce((sum, stock) =>
                                sum + (stock.currentPrice || stock.averagePrice) * stock.quantity, 0
                              )).toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Paper sx={{
                          p: isMobile ? 1.5 : 2,
                          borderRadius: 2,
                          elevation: 2,
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem'
                          }}>
                            Cash
                          </Typography>
                          <Typography variant={isMobile ? "h6" : "h5"} sx={{
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: 'bold'
                          }}>
                            ${selectedUserPortfolio.cash.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      {!isMobile &&
                        <Grid item xs={6} sm={4}>
                          <Paper sx={{
                            p: 2,
                            borderRadius: 2,
                            elevation: 2,
                          }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{
                              fontSize:'0.875rem'
                            }}>
                              Stocks Owned
                            </Typography>
                            <Typography variant="h5" sx={{
                              fontSize: '1.5rem',
                              fontWeight: 'bold'
                            }}>
                              {selectedUserPortfolio.stocks.length}
                            </Typography>
                          </Paper>
                        </Grid>
                      }
                    </Grid>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: 600,
                    mb: 2  // Add some space before table
                  }}>
                    Stocks
                  </Typography>

                  {selectedUserPortfolio.stocks.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      {selectedUser.name} doesn't own any stocks yet.
                    </Typography>
                  ) : (
                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: 2,  // Simpler border radius
                        overflow: 'hidden',
                        elevation: 2,  // Simple elevation instead of custom shadows
                      }}
                    >
                      <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow sx={{
                            backgroundColor: theme => theme.palette.action.hover,  // Use theme colors
                          }}>
                            {isMobile ? (
                              // Mobile headers - 3 columns
                              <>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, px: 1.5 }}>
                                  Stock
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, px: 1 }}>
                                  Shares
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', py: 1, px: 1 }}>
                                  Investment
                                </TableCell>
                              </>
                            ) : (
                              // Desktop headers - all columns
                              <>
                                <TableCell>Symbol</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell align="right">Shares</TableCell>
                                <TableCell align="right">Avg. Price</TableCell>
                                <TableCell align="right">Total Investment</TableCell>
                                <TableCell align="right">% of Portfolio</TableCell>
                              </>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedUserPortfolio.stocks.map(stock => {
                            const investment = calculateTotalInvestment(stock);
                            const totalInvestment = selectedUserPortfolio.stocks.reduce(
                              (sum, s) => sum + calculateTotalInvestment(s), 0
                            );
                            const percentage = (investment / totalInvestment) * 100;

                            return (
                              <TableRow
                                key={stock.symbol}
                                hover
                              >
                                {isMobile ? (
                                  // Mobile layout - 3 columns
                                  <>
                                    {/* Stock Info */}
                                    <TableCell sx={{ py: 1.5, px: 1.5, minWidth: 0 }}>
                                      <Box>
                                        <Typography variant="body2" sx={{
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          color: 'primary.main'
                                        }}>
                                          {stock.symbol}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{
                                            fontSize: '0.7rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '120px',
                                            lineHeight: 1.2
                                          }}
                                        >
                                          {stock.companyName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{
                                          fontSize: '0.65rem',
                                          display: 'block',
                                          lineHeight: 1
                                        }}>
                                          @${stock.averagePrice.toFixed(2)}
                                        </Typography>
                                      </Box>
                                    </TableCell>

                                    {/* Shares */}
                                    <TableCell align="right" sx={{ py: 1.5, px: 1 }}>
                                      <Typography variant="body2" sx={{
                                        fontSize: '0.85rem',
                                        fontWeight: '500'
                                      }}>
                                        {stock.quantity}
                                      </Typography>
                                    </TableCell>

                                    {/* Investment & Percentage */}
                                    <TableCell align="right" sx={{ py: 1.5, px: 1 }}>
                                      <Typography variant="body2" sx={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                      }}>
                                        ${investment.toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{
                                        fontSize: '0.65rem',
                                        display: 'block',
                                        lineHeight: 1
                                      }}>
                                        {percentage.toFixed(1)}%
                                      </Typography>
                                    </TableCell>
                                  </>
                                ) : (
                                  // Desktop layout - all columns (same as before)
                                  <>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                      {stock.symbol}
                                    </TableCell>
                                    <TableCell>{stock.companyName}</TableCell>
                                    <TableCell align="right">{stock.quantity}</TableCell>
                                    <TableCell align="right">${stock.averagePrice.toFixed(2)}</TableCell>
                                    <TableCell align="right">${investment.toFixed(2)}</TableCell>
                                    <TableCell align="right">{percentage.toFixed(2)}%</TableCell>
                                  </>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Could not load portfolio data.
                </Typography>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}