import { db } from '../firebase/firebase';
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    arrayUnion,
    setDoc
} from 'firebase/firestore';

// Get user portfolio
export async function getUserPortfolio(userId) {
    const docRef = doc(db, "portfolios", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

// Buy stock
export async function buyStock(userId, symbol, companyName, quantity, price) {
    const portfolioRef = doc(db, "portfolios", userId);
    const portfolioSnap = await getDoc(portfolioRef);

    if (!portfolioSnap.exists()) return false;

    const portfolio = portfolioSnap.data();
    const totalCost = price * quantity;

    // Check if user has enough cash
    if (portfolio.cash < totalCost) return false;

    // Check if user already owns this stock
    const existingStockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);
    let updatedStocks = [...portfolio.stocks];

    if (existingStockIndex >= 0) {
        // Update existing position
        const existingStock = updatedStocks[existingStockIndex];
        const newQuantity = existingStock.quantity + quantity;
        const newTotalCost = existingStock.totalCost + totalCost;

        updatedStocks[existingStockIndex] = {
            ...existingStock,
            quantity: newQuantity,
            totalCost: newTotalCost,
            averagePrice: newTotalCost / newQuantity,
            lastUpdated: new Date()
        };
    } else {
        // Add new stock to portfolio
        updatedStocks.push({
            symbol,
            companyName,
            quantity,
            totalCost,
            averagePrice: price,
            purchaseDate: new Date(),
            lastUpdated: new Date()
        });
    }

    // Update portfolio
    await updateDoc(portfolioRef, {
        cash: portfolio.cash - totalCost,
        stocks: updatedStocks,
    });

    // Add transaction to history
    await addTransaction(userId, {
        type: 'buy',
        symbol,
        companyName,
        quantity,
        price,
        total: totalCost,
        date: new Date()
    });

    return true;
}

// Sell stock
export async function sellStock(userId, symbol, quantity, price) {
    const portfolioRef = doc(db, "portfolios", userId);
    const portfolioSnap = await getDoc(portfolioRef);

    if (!portfolioSnap.exists()) return false;

    const portfolio = portfolioSnap.data();
    const stockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);

    // Check if user owns this stock and has enough shares
    if (stockIndex === -1 || portfolio.stocks[stockIndex].quantity < quantity) {
        return false;
    }

    const stock = portfolio.stocks[stockIndex];
    const totalValue = price * quantity;
    let updatedStocks = [...portfolio.stocks];

    if (stock.quantity === quantity) {
        // Remove stock from portfolio if selling all shares
        updatedStocks = updatedStocks.filter(s => s.symbol !== symbol);
    } else {
        // Update stock quantity
        const newQuantity = stock.quantity - quantity;
        const newTotalCost = (stock.averagePrice * stock.quantity) - (stock.averagePrice * quantity);

        updatedStocks[stockIndex] = {
            ...stock,
            quantity: newQuantity,
            totalCost: newTotalCost,
            lastUpdated: new Date()
        };
    }

    // Update portfolio
    await updateDoc(portfolioRef, {
        cash: portfolio.cash + totalValue,
        stocks: updatedStocks,
    });

    // Add transaction to history
    await addTransaction(userId, {
        type: 'sell',
        symbol,
        companyName: stock.companyName,
        quantity,
        price,
        total: totalValue,
        date: new Date()
    });

    return true;
}

// Add transaction to history
async function addTransaction(userId, transaction) {
    const transactionsRef = doc(db, "transactions", userId);
    const transactionsSnap = await getDoc(transactionsRef);

    if (transactionsSnap.exists()) {
        await updateDoc(transactionsRef, {
            history: arrayUnion(transaction)
        });
    } else {
        await setDoc(transactionsRef, {
            history: [transaction]
        });
    }
}

// Get transaction history
export async function getTransactionHistory(userId) {
    const transactionsRef = doc(db, "transactions", userId);
    const transactionsSnap = await getDoc(transactionsRef);

    if (transactionsSnap.exists()) {
        return transactionsSnap.data().history;
    }

    return [];
}

// Get leaderboard data
export async function getLeaderboard() {
    const portfoliosRef = collection(db, "portfolios");
    const portfoliosSnap = await getDocs(portfoliosRef);

    let leaderboard = [];

    portfoliosSnap.forEach(docSnap => {
        const data = docSnap.data();
        const userId = docSnap.id;

        // Calculate total portfolio value
        const stocksValue = data.stocks.reduce((total, stock) => {
            const currentPrice = stock.currentPrice || stock.averagePrice;
            return total + (stock.quantity * currentPrice);
        }, 0);

        const totalValue = data.cash + stocksValue;

        leaderboard.push({
            userId,
            cash: data.cash,
            stocksValue,
            totalValue,
            stockCount: data.stocks.length
        });
    });

    // Sort by total value (highest first)
    return leaderboard.sort((a, b) => b.totalValue - a.totalValue);
}

// Update stock prices in portfolio
export async function updateStockPrices(userId, stockPrices) {
    const portfolioRef = doc(db, "portfolios", userId);
    const portfolioSnap = await getDoc(portfolioRef);

    if (!portfolioSnap.exists()) return false;

    const portfolio = portfolioSnap.data();
    const updatedStocks = portfolio.stocks.map(stock => {
        if (stockPrices[stock.symbol]) {
            return {
                ...stock,
                currentPrice: stockPrices[stock.symbol].regularMarketPrice,
                lastUpdated: new Date()
            };
        }
        return stock;
    });

    await updateDoc(portfolioRef, {
        stocks: updatedStocks,
    });

    return true;
}

// Update portfolio value history (call this whenever portfolio value changes)
export async function updatePortfolioHistory(userId, totalValue) {
    const historyRef = doc(db, "portfolioHistory", userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    try {
        const historySnap = await getDoc(historyRef);

        if (historySnap.exists()) {
            const historyData = historySnap.data();
            const history = historyData.history || [];

            // Check if we already have an entry for today
            const todayEntry = history.find(entry => {
                const entryDate = entry.timestamp instanceof Date
                    ? entry.timestamp
                    : new Date(entry.timestamp.seconds * 1000);

                // Compare year, month, and day
                return entryDate.getFullYear() === today.getFullYear() &&
                    entryDate.getMonth() === today.getMonth() &&
                    entryDate.getDate() === today.getDate();
            });

            if (todayEntry) {
                // Update today's entry
                const updatedHistory = history.map(entry => {
                    const entryDate = entry.timestamp instanceof Date
                        ? entry.timestamp
                        : new Date(entry.timestamp.seconds * 1000);

                    if (entryDate.getFullYear() === today.getFullYear() &&
                        entryDate.getMonth() === today.getMonth() &&
                        entryDate.getDate() === today.getDate()) {
                        return { timestamp: today, value: totalValue };
                    }
                    return entry;
                });

                await setDoc(historyRef, { history: updatedHistory });
            } else {
                // Add new entry for today
                await updateDoc(historyRef, {
                    history: arrayUnion({ timestamp: today, value: totalValue })
                });
            }
        } else {
            // Create new history document with first entry
            await setDoc(historyRef, {
                history: [{ timestamp: today, value: totalValue }]
            });
        }
    } catch (error) {
        console.error("Error updating portfolio history:", error);
    }
}


// Get portfolio value history
export async function getPortfolioHistory(userId) {
    const historyRef = doc(db, "portfolioHistory", userId);
    const historySnap = await getDoc(historyRef);

    if (historySnap.exists()) {
        return historySnap.data().history;
    }

    return [];
}

// Get user's watchlist
export async function getUserWatchlist(userId) {
    const watchlistRef = doc(db, "watchlists", userId);
    const watchlistSnap = await getDoc(watchlistRef);

    if (watchlistSnap.exists()) {
        return watchlistSnap.data().stocks || [];
    }

    return [];
}

// Add stock to watchlist
export async function addToWatchlist(userId, stock) {
    const watchlistRef = doc(db, "watchlists", userId);
    const watchlistSnap = await getDoc(watchlistRef);

    const stockData = {
        symbol: stock.symbol,
        companyName: stock.companyName || stock.shortname || stock.longname,
        addedAt: new Date()
    };

    if (watchlistSnap.exists()) {
        // Check if stock already exists in watchlist
        const watchlist = watchlistSnap.data().stocks || [];
        if (!watchlist.some(item => item.symbol === stock.symbol)) {
            await updateDoc(watchlistRef, {
                stocks: arrayUnion(stockData)
            });
        }
    } else {
        // Create new watchlist document
        await setDoc(watchlistRef, {
            stocks: [stockData]
        });
    }

    return true;
}

// Remove stock from watchlist
export async function removeFromWatchlist(userId, symbol) {
    const watchlistRef = doc(db, "watchlists", userId);
    const watchlistSnap = await getDoc(watchlistRef);

    if (watchlistSnap.exists()) {
        const watchlist = watchlistSnap.data().stocks || [];
        const updatedWatchlist = watchlist.filter(stock => stock.symbol !== symbol);

        await updateDoc(watchlistRef, {
            stocks: updatedWatchlist
        });
    }

    return true;
}

// Check if stock is in watchlist
export async function isInWatchlist(userId, symbol) {
    const watchlist = await getUserWatchlist(userId);
    return watchlist.some(stock => stock.symbol === symbol);
}