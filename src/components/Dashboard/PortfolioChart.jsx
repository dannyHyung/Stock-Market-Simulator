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

export default function PortfolioChart({ portfolioHistory, loading }) {
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
          callback: function (value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, height: 300 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
          <CircularProgress />
        </Box>
      ) : portfolioHistory.length > 1 ? (
        <Line data={prepareChartData()} options={chartOptions} height={250} />
      ) : (
        <Box sx={{ display: 'flex', height: '80%', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            Not enough data to display chart. Check back later as you use the app.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}