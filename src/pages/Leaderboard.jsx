import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/firestore';
import { getUserDisplayNames } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
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

export default function Leaderboard() {
  const { currentUser } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Leaderboard
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchLeaderboard}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper elevation={3}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Portfolio Value</TableCell>
                  <TableCell align="right">Cash</TableCell>
                  <TableCell align="right">Stocks Value</TableCell>
                  <TableCell align="right">Stocks Owned</TableCell>
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
                  </TableRow>
                ))}
                
                {leaderboardData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No data available yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}