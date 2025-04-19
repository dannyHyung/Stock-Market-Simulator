import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StockDataProvider } from './contexts/StockDataContext';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Leaderboard from './pages/Leaderboard';
import Market from './pages/Market';
import TransactionHistory from './pages/TransactionHistory';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StockDataProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="market" element={<Market />} />
              <Route path="/history" element={<TransactionHistory />} /> 
            </Route>
          </Routes>
        </StockDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;