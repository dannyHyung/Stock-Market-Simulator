import React from 'react';
import { format, subDays, parseISO, isAfter } from 'date-fns';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PortfolioChart({ portfolioHistory, loading, compact = false }) {
  // Prepare chart data
  const prepareChartData = () => {
    if (!portfolioHistory || portfolioHistory.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Convert Firestore timestamps to JavaScript Date objects
    const historyWithDates = portfolioHistory.map(item => ({
      timestamp: item.timestamp instanceof Date
        ? item.timestamp
        : new Date(item.timestamp.seconds * 1000),
      value: item.value
    }));

    // Sort history by timestamp (oldest first)
    const sortedHistory = [...historyWithDates].sort((a, b) =>
      a.timestamp - b.timestamp
    );

    // Group by day to ensure one data point per day
    const dailyData = {};
    sortedHistory.forEach(item => {
      const dateKey = format(item.timestamp, 'yyyy-MM-dd');
      // Take the latest entry for each day
      dailyData[dateKey] = item.value;
    });

    // Get the earliest timestamp for limit calculation
    const firstEntryDate = sortedHistory[0].timestamp;
    const daysSinceStart = Math.ceil(
      (new Date() - firstEntryDate) / (1000 * 60 * 60 * 24)
    );

    // Determine how many days to show (up to 30 days or all available days)
    const daysToShow = Math.min(30, daysSinceStart);
    const cutoffDate = subDays(new Date(), daysToShow);

    // Filter to only include data points after the cutoff date
    const filteredDailyData = Object.entries(dailyData)
      .filter(([dateStr]) => isAfter(parseISO(dateStr), cutoffDate))
      .reduce((acc, [dateStr, value]) => {
        acc[dateStr] = value;
        return acc;
      }, {});

    // Format for chart.js
    const labels = Object.keys(filteredDailyData).map(dateStr =>
      format(parseISO(dateStr), 'MMM d')
    );

    const data = Object.values(filteredDailyData);

    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data,
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.4,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          maxTicksLimit: compact ? 4 : 8,
          callback: function (value) {
            return '$' + value.toFixed(2);
          }
        }
      },
      x: {
        ticks: {
          maxTicksLimit: compact ? 5 : 10,
          maxRotation: compact ? 0 : 45,
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: compact ? 2 : 3,
        height: '100%',
        borderRadius: '10px',
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Line data={prepareChartData()} options={chartOptions} height={250} />
      )}
    </Paper>
  );
}