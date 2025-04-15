import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../services/firestore';
import IconButton from '@mui/material/IconButton';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Tooltip from '@mui/material/Tooltip';

export default function WatchlistToggle({ stock, onToggle }) {
  const { currentUser } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWatchlistStatus();
  }, [stock?.symbol]);

  async function checkWatchlistStatus() {
    if (!currentUser || !stock?.symbol) return;
    
    setLoading(true);
    try {
      const result = await isInWatchlist(currentUser.uid, stock.symbol);
      setInWatchlist(result);
    } catch (error) {
      console.error("Error checking watchlist status:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleWatchlist(event) {
    if (event) {
      event.stopPropagation(); // Prevent parent click events
      event.preventDefault();
    }
    
    if (!currentUser || !stock) return;
    
    try {
      if (inWatchlist) {
        await removeFromWatchlist(currentUser.uid, stock.symbol);
      } else {
        await addToWatchlist(currentUser.uid, stock);
      }
      
      setInWatchlist(!inWatchlist);
      if (onToggle) onToggle(!inWatchlist);
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    }
  }

  if (loading || !stock) return null;

  return (
    <Tooltip title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}>
      <IconButton 
        onClick={handleToggleWatchlist}
        color={inWatchlist ? "primary" : "default"}
        size="small"
      >
        {inWatchlist ? <StarIcon /> : <StarBorderIcon />}
      </IconButton>
    </Tooltip>
  );
}