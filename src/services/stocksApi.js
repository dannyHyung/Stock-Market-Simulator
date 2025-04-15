// src/services/stocksApi.js
import * as cloudApi from './cloudFunctionsApi';

export const getStockPrice = cloudApi.getStockPrice;
export const searchStocks = cloudApi.searchStocks;
export const getMultipleStockPrices = cloudApi.getMultipleStockPrices;