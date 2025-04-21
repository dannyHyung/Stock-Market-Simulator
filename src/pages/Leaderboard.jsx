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

  // Fetch leaderboard data
  async function fetchLeaderboard() {
    try {
      setLoading(true);
      setError('');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Leaderboard
        </Typography>
        <Button
          variant="contained"
          onClick={fetchLeaderboard}
          disabled={loading}
          sx={{
            backgroundColor: theme => theme.palette.mode === 'dark'
              ? 'rgba(66, 153, 225, 0.15)'
              : theme.palette.primary.main,
            color: theme => theme.palette.mode === 'dark'
              ? '#90caf9'
              : 'white',
            boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
            borderRadius: '8px',
            px: 2,
            py: 1,
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
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
          ) : (
            <RefreshIcon className="refresh-icon" sx={{ mr: 1, transition: 'transform 0.3s' }} />
          )}
          <Typography
            variant="button"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'none'
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
          <CustomTable>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Portfolio Value</TableCell>
                <TableCell align="right">Cash</TableCell>
                <TableCell align="right">Stocks Value</TableCell>
                <TableCell align="right">Stocks Owned</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboardData.map((entry, index) => (
                <TableRow
                  key={entry.userId}
                  hover
                  sx={{
                    bgcolor: entry.userId === currentUser.uid ? 'action.selected' : 'inherit'
                  }}
                >
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
                </TableRow>
              ))}

              {leaderboardData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No data available yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </CustomTable>
        )}
      </Paper>

      {/* User Portfolio Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  {selectedUser.name}'s Portfolio
                </Typography>
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
              ) : selectedUserPortfolio ? (
                <Box>
                  <Box sx={{ mb: 4 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Value
                          </Typography>
                          <Typography variant="h5">
                            ${(selectedUserPortfolio.cash +
                              selectedUserPortfolio.stocks.reduce((sum, stock) =>
                                sum + (stock.currentPrice || stock.averagePrice) * stock.quantity, 0
                              )).toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Cash
                          </Typography>
                          <Typography variant="h5">
                            ${selectedUserPortfolio.cash.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Stocks Owned
                          </Typography>
                          <Typography variant="h5">
                            {selectedUserPortfolio.stocks.length}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  <Typography variant="h6" gutterBottom>Stocks</Typography>

                  {selectedUserPortfolio.stocks.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      {selectedUser.name} doesn't own any stocks yet.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell align="right">Shares</TableCell>
                            <TableCell align="right">Avg. Price</TableCell>
                            <TableCell align="right">Total Investment</TableCell>
                            <TableCell align="right">% of Portfolio</TableCell>
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
                              <TableRow key={stock.symbol}>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                  {stock.symbol}
                                </TableCell>
                                <TableCell>{stock.companyName}</TableCell>
                                <TableCell align="right">{stock.quantity}</TableCell>
                                <TableCell align="right">${stock.averagePrice.toFixed(2)}</TableCell>
                                <TableCell align="right">${investment.toFixed(2)}</TableCell>
                                <TableCell align="right">{percentage.toFixed(2)}%</TableCell>
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