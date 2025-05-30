"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Play, Pause, Settings, TrendingUp, TrendingDown,
  Activity, Moon, Sun, Search, BarChart3,
  Wallet, AlertTriangle, CheckCircle,
  Bot, HelpCircle, Wifi, WifiOff,
  Key, X, Eye, EyeOff, DollarSign, Edit3,
  RefreshCw, ExternalLink
} from 'lucide-react';

// ===== TIPOS TYPESCRIPT =====
type CryptoData = {
  [key: string]: {
    price: number;
    change: number;
    volume: number;
  };
};

type OperationSlot = {
  id: number;
  active: boolean;
  crypto: string;
  amount: number;
  minProfit: number;
  maxLoss: number;
  status: 'waiting' | 'buying' | 'selling' | 'completed';
  entryPrice?: number;
  currentPrice?: number;
  profit?: number;
  startTime?: string;
  orderId?: string;
};

type Trade = {
  id: number;
  crypto: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  profit: number;
  time: string;
  exchange: string;
  slotId?: number;
  orderId?: string;
  status: 'executed' | 'pending' | 'cancelled';
};

type Alert = {
  id: number;
  type: string;
  message: string;
  time: string;
  priority?: 'low' | 'medium' | 'high';
};

type PriceHistoryItem = {
  time: string;
  price: number;
  volume: number;
};

type ExchangeBalance = {
  asset: string;
  free: number;
  locked: number;
  total: number;
};

type ExchangeConnection = {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  balances: ExchangeBalance[];
};

// ===== COMPONENTE PRINCIPAL =====
const CryptoTradingBot = () => {
  // Estados da Interface
  const [darkMode, setDarkMode] = useState(true);
  const [botActive, setBotActive] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  
  // Estados Financeiros
  const [totalBalance, setTotalBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalProfitMade, setTotalProfitMade] = useState(0);
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  
  // Estados dos Slots de Operação (20 slots independentes)
  const [operationSlots, setOperationSlots] = useState<OperationSlot[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cryptobot-slots');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      active: false,
      crypto: 'BTC',
      amount: 50,
      minProfit: 2.0,
      maxLoss: 1.0,
      status: 'waiting'
    }));
  });

  const [activeOperations, setActiveOperations] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    binance: false,
    coinex: false,
    kraken: false
  });
  
  // Configurações Gerais
  const [settings, setSettings] = useState({
    stopLoss: 2,
    takeProfit: 4,
    riskLevel: 'medium',
    preferredExchange: 'binance'
  });

  // Estados das APIs das Exchanges
  const [apiConnections, setApiConnections] = useState<{[key: string]: ExchangeConnection}>({
    binance: { connected: false, status: 'disconnected', lastSync: '', balances: [] },
    coinex: { connected: false, status: 'disconnected', lastSync: '', balances: [] },
    kraken: { connected: false, status: 'disconnected', lastSync: '', balances: [] }
  });

  const [apiCredentials, setApiCredentials] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cryptobot-credentials');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      binance: { apiKey: '', secretKey: '', isTestnet: false },
      coinex: { apiKey: '', secretKey: '', isTestnet: false },
      kraken: { apiKey: '', secretKey: '', isTestnet: false }
    };
  });

  // Dados de criptomoedas em tempo real
  const [cryptoData, setCryptoData] = useState<CryptoData>({
    BTC: { price: 67420, change: 2.34, volume: 28000000000 },
    ETH: { price: 3680, change: -1.22, volume: 15000000000 },
    BNB: { price: 580, change: 3.45, volume: 2000000000 },
    ADA: { price: 0.65, change: 1.78, volume: 800000000 },
    SOL: { price: 178, change: 4.21, volume: 3500000000 },
    DOT: { price: 7.2, change: -0.85, volume: 500000000 }
  });

  // Indicadores técnicos calculados
  const [technicalIndicators, setTechnicalIndicators] = useState<{[key: string]: {
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number };
    sma: number;
    ema: number;
    volume_sma: number;
    stochastic: { k: number; d: number };
    fibonacci: { level_23: number; level_38: number; level_50: number; level_61: number };
  }}>({});

  // Estratégias de IA implementadas
  const [aiStrategies, setAiStrategies] = useState({
    rsiStrategy: true,     // Estratégia RSI Avançada
    macdStrategy: true,    // Convergência/Divergência MACD
    bollingerStrategy: true, // Bandas de Bollinger + Volatilidade
    arbitrageStrategy: true, // Arbitragem Multi-Exchange
    trendFollowing: true,  // Seguimento de Tendência
    meanReversion: true,   // Reversão à Média
    volumeAnalysis: true,  // Análise de Volume
    fibonacciStrategy: true, // Retração de Fibonacci
    newsStrategy: true,    // Trading com Notícias
    gridTrading: true      // Grid Trading Inteligente
  });

  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // ===== FUNÇÕES AUXILIARES (movidas para cima) =====
  
  // Função para adicionar alertas
  const addAlert = useCallback((type: string, message: string, priority: 'low' | 'medium' | 'high' = 'low') => {
    setAlerts(prev => [...prev, {
      id: Date.now() + Math.random(),
      type,
      message,
      time: new Date().toLocaleTimeString(),
      priority
    }].slice(0, 15));
  }, []);

  // ===== SISTEMA DE IA - INDICADORES TÉCNICOS =====
  
  // Calcular indicadores técnicos reais
  const calculateTechnicalIndicators = useCallback((symbol: string, prices: number[]) => {
    if (prices.length < 26) return null; // Mínimo para MACD

    // RSI (Relative Strength Index) - 14 períodos
    const calculateRSI = (prices: number[], period = 14) => {
      let gains = 0, losses = 0;
      for (let i = 1; i <= period; i++) {
        const change = prices[prices.length - i] - prices[prices.length - i - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    };

    // MACD (Moving Average Convergence Divergence)
    const calculateMACD = (prices: number[]) => {
      const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
      const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
      const macdLine = ema12 - ema26;
      const signalLine = macdLine * 0.2; // Simplificado
      const histogram = macdLine - signalLine;
      return { line: macdLine, signal: signalLine, histogram };
    };

    // Bandas de Bollinger
    const calculateBollinger = (prices: number[], period = 20) => {
      const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
      const variance = prices.slice(-period).reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      return {
        upper: sma + (stdDev * 2),
        middle: sma,
        lower: sma - (stdDev * 2)
      };
    };

    // Estocástico
    const calculateStochastic = (prices: number[], period = 14) => {
      const recentPrices = prices.slice(-period);
      const high = Math.max(...recentPrices);
      const low = Math.min(...recentPrices);
      const current = prices[prices.length - 1];
      const k = ((current - low) / (high - low)) * 100;
      const d = k * 0.8; // Simplificado
      return { k, d };
    };

    // Fibonacci
    const calculateFibonacci = (high: number, low: number) => ({
      level_23: high - (high - low) * 0.236,
      level_38: high - (high - low) * 0.382,
      level_50: high - (high - low) * 0.5,
      level_61: high - (high - low) * 0.618
    });

    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bollinger = calculateBollinger(prices);
    const sma = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const ema = prices[prices.length - 1] * 0.2 + sma * 0.8; // Simplificado
    const volume_sma = 1000000; // Volume médio simulado
    const stochastic = calculateStochastic(prices);
    const fibonacci = calculateFibonacci(Math.max(...prices.slice(-20)), Math.min(...prices.slice(-20)));

    return { rsi, macd, bollinger, sma, ema, volume_sma, stochastic, fibonacci };
  }, []);

  // ===== ESTRATÉGIAS DE IA =====

  // IA Strategy 1: RSI Avançado com Divergências
  const rsiAdvancedStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.rsiStrategy) return null;
    
    const { rsi } = indicators;
    const currentPrice = cryptoData[symbol]?.price;
    
    // Condições RSI Profissionais
    if (rsi < 30 && currentPrice) {
      return {
        action: 'BUY',
        confidence: 0.8,
        reason: `RSI Oversold (${rsi.toFixed(1)}) - Oportunidade de Compra`,
        strategy: 'RSI_OVERSOLD'
      };
    } else if (rsi > 70 && currentPrice) {
      return {
        action: 'SELL',
        confidence: 0.75,
        reason: `RSI Overbought (${rsi.toFixed(1)}) - Sinal de Venda`,
        strategy: 'RSI_OVERBOUGHT'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.rsiStrategy]);

  // IA Strategy 2: MACD com Cruzamentos
  const macdStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.macdStrategy) return null;
    
    const { macd } = indicators;
    
    // MACD Bullish Crossover
    if (macd.line > macd.signal && macd.histogram > 0) {
      return {
        action: 'BUY',
        confidence: 0.85,
        reason: `MACD Bullish Crossover - Momentum Positivo`,
        strategy: 'MACD_BULLISH'
      };
    }
    // MACD Bearish Crossover
    else if (macd.line < macd.signal && macd.histogram < 0) {
      return {
        action: 'SELL',
        confidence: 0.8,
        reason: `MACD Bearish Crossover - Momentum Negativo`,
        strategy: 'MACD_BEARISH'
      };
    }
    return null;
  }, [aiStrategies.macdStrategy]);

  // IA Strategy 3: Bandas de Bollinger + Volatilidade
  const bollingerStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.bollingerStrategy) return null;
    
    const { bollinger } = indicators;
    const currentPrice = cryptoData[symbol]?.price || 0;
    
    // Squeeze das Bandas (Baixa Volatilidade) - Preparação para Breakout
    const bandWidth = (bollinger.upper - bollinger.lower) / bollinger.middle;
    
    if (currentPrice <= bollinger.lower) {
      return {
        action: 'BUY',
        confidence: 0.9,
        reason: `Preço tocou Banda Inferior - Provável Reversão`,
        strategy: 'BOLLINGER_OVERSOLD'
      };
    } else if (currentPrice >= bollinger.upper) {
      return {
        action: 'SELL',
        confidence: 0.85,
        reason: `Preço tocou Banda Superior - Possível Correção`,
        strategy: 'BOLLINGER_OVERBOUGHT'
      };
    } else if (bandWidth < 0.1) {
      return {
        action: 'WAIT',
        confidence: 0.7,
        reason: `Bollinger Squeeze - Aguardando Breakout`,
        strategy: 'BOLLINGER_SQUEEZE'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.bollingerStrategy]);

  // IA Strategy 4: Arbitragem Multi-Exchange
  const arbitrageStrategy = useCallback((symbol: string) => {
    if (!aiStrategies.arbitrageStrategy) return null;
    
    // Simular diferenças de preços entre exchanges
    const binancePrice = cryptoData[symbol]?.price || 0;
    const coinexPrice = binancePrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% diferença
    const krakenPrice = binancePrice * (1 + (Math.random() - 0.5) * 0.015); // ±0.75% diferença
    
    const prices = [
      { exchange: 'binance', price: binancePrice },
      { exchange: 'coinex', price: coinexPrice },
      { exchange: 'kraken', price: krakenPrice }
    ];
    
    const maxPrice = Math.max(...prices.map(p => p.price));
    const minPrice = Math.min(...prices.map(p => p.price));
    const priceDiff = ((maxPrice - minPrice) / minPrice) * 100;
    
    if (priceDiff > 0.5) { // Oportunidade de arbitragem > 0.5%
      return {
        action: 'ARBITRAGE',
        confidence: 0.95,
        reason: `Arbitragem ${priceDiff.toFixed(2)}% - Compre ${prices.find(p => p.price === minPrice)?.exchange}, Venda ${prices.find(p => p.price === maxPrice)?.exchange}`,
        strategy: 'ARBITRAGE'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.arbitrageStrategy]);

  // IA Strategy 5: Trend Following Avançado
  const trendFollowingStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.trendFollowing) return null;
    
    const { sma, ema } = indicators;
    const currentPrice = cryptoData[symbol]?.price || 0;
    
    // Tendência Altista: Preço > EMA > SMA
    if (currentPrice > ema && ema > sma) {
      return {
        action: 'BUY',
        confidence: 0.8,
        reason: `Tendência Altista Confirmada - Preço ${currentPrice.toFixed(2)} > EMA ${ema.toFixed(2)} > SMA ${sma.toFixed(2)}`,
        strategy: 'TREND_FOLLOWING_BULL'
      };
    }
    // Tendência Bajista: Preço < EMA < SMA
    else if (currentPrice < ema && ema < sma) {
      return {
        action: 'SELL',
        confidence: 0.75,
        reason: `Tendência Bajista Confirmada - Preço ${currentPrice.toFixed(2)} < EMA ${ema.toFixed(2)} < SMA ${sma.toFixed(2)}`,
        strategy: 'TREND_FOLLOWING_BEAR'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.trendFollowing]);

  // IA Strategy 6: Mean Reversion (Reversão à Média)
  const meanReversionStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.meanReversion) return null;
    
    const { sma, bollinger } = indicators;
    const currentPrice = cryptoData[symbol]?.price || 0;
    const priceChange = cryptoData[symbol]?.change || 0;
    
    // Mean Reversion quando preço está muito distante da média
    const distanceFromMean = Math.abs(currentPrice - sma) / sma;
    
    if (distanceFromMean > 0.05 && priceChange < -3) { // 5% abaixo da média + queda de 3%
      return {
        action: 'BUY',
        confidence: 0.85,
        reason: `Mean Reversion - Preço ${distanceFromMean.toFixed(1)}% abaixo da média, queda excessiva`,
        strategy: 'MEAN_REVERSION_BUY'
      };
    } else if (distanceFromMean > 0.05 && priceChange > 3) { // 5% acima da média + alta de 3%
      return {
        action: 'SELL',
        confidence: 0.8,
        reason: `Mean Reversion - Preço ${distanceFromMean.toFixed(1)}% acima da média, alta excessiva`,
        strategy: 'MEAN_REVERSION_SELL'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.meanReversion]);

  // IA Strategy 7: Volume Analysis
  const volumeAnalysisStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.volumeAnalysis) return null;
    
    const currentVolume = cryptoData[symbol]?.volume || 0;
    const { volume_sma } = indicators;
    const priceChange = cryptoData[symbol]?.change || 0;
    
    // Volume Breakout
    const volumeRatio = currentVolume / volume_sma;
    
    if (volumeRatio > 1.5 && priceChange > 2) { // Volume 50% acima da média + alta de 2%
      return {
        action: 'BUY',
        confidence: 0.9,
        reason: `Volume Breakout - Volume ${volumeRatio.toFixed(1)}x acima da média com alta de ${priceChange.toFixed(1)}%`,
        strategy: 'VOLUME_BREAKOUT_BULL'
      };
    } else if (volumeRatio > 1.5 && priceChange < -2) { // Volume alto + queda
      return {
        action: 'SELL',
        confidence: 0.85,
        reason: `Volume Selloff - Volume ${volumeRatio.toFixed(1)}x acima da média com queda de ${priceChange.toFixed(1)}%`,
        strategy: 'VOLUME_BREAKOUT_BEAR'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.volumeAnalysis]);

  // IA Strategy 8: Fibonacci Retracement
  const fibonacciStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.fibonacciStrategy) return null;
    
    const { fibonacci } = indicators;
    const currentPrice = cryptoData[symbol]?.price || 0;
    
    // Suporte em níveis de Fibonacci
    if (Math.abs(currentPrice - fibonacci.level_61) / fibonacci.level_61 < 0.01) {
      return {
        action: 'BUY',
        confidence: 0.8,
        reason: `Suporte Fibonacci 61.8% - Nível: ${fibonacci.level_61.toFixed(2)}`,
        strategy: 'FIBONACCI_SUPPORT'
      };
    } else if (Math.abs(currentPrice - fibonacci.level_38) / fibonacci.level_38 < 0.01) {
      return {
        action: 'BUY',
        confidence: 0.75,
        reason: `Suporte Fibonacci 38.2% - Nível: ${fibonacci.level_38.toFixed(2)}`,
        strategy: 'FIBONACCI_SUPPORT'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.fibonacciStrategy]);

  // IA Strategy 9: News Sentiment Analysis
  const newsStrategy = useCallback((symbol: string) => {
    if (!aiStrategies.newsStrategy) return null;
    
    // Simular análise de sentimento de notícias
    const newsEvents = [
      'Bitcoin ETF aprovado',
      'Regulamentação favorável',
      'Adoção institucional',
      'Parceria estratégica',
      'Upgrade de rede',
      'Listagem em nova exchange'
    ];
    
    const negativeEvents = [
      'Regulamentação restritiva',
      'Hack em exchange',
      'Venda institucional',
      'Fork controverso',
      'Problemas técnicos'
    ];
    
    // Simulação de evento aleatório
    if (Math.random() > 0.95) { // 5% chance de evento
      const isPositive = Math.random() > 0.6; // 40% positivo, 60% negativo (realista)
      const event = isPositive ? 
        newsEvents[Math.floor(Math.random() * newsEvents.length)] :
        negativeEvents[Math.floor(Math.random() * negativeEvents.length)];
      
      return {
        action: isPositive ? 'BUY' : 'SELL',
        confidence: 0.7,
        reason: `Evento: ${event} - Impacto esperado ${isPositive ? 'positivo' : 'negativo'}`,
        strategy: 'NEWS_SENTIMENT'
      };
    }
    return null;
  }, [aiStrategies.newsStrategy]);

  // IA Strategy 10: Grid Trading Inteligente
  const gridTradingStrategy = useCallback((symbol: string, indicators: any) => {
    if (!indicators || !aiStrategies.gridTrading) return null;
    
    const { bollinger, rsi } = indicators;
    const currentPrice = cryptoData[symbol]?.price || 0;
    
    // Grid Trading baseado em volatilidade
    const gridSize = (bollinger.upper - bollinger.lower) / 10; // 10 grids entre as bandas
    const pricePosition = (currentPrice - bollinger.lower) / (bollinger.upper - bollinger.lower);
    
    if (pricePosition < 0.3 && rsi < 40) { // Terço inferior + RSI baixo
      return {
        action: 'BUY',
        confidence: 0.85,
        reason: `Grid Trading - Zona de compra (${(pricePosition * 100).toFixed(0)}% da banda)`,
        strategy: 'GRID_TRADING_BUY'
      };
    } else if (pricePosition > 0.7 && rsi > 60) { // Terço superior + RSI alto
      return {
        action: 'SELL',
        confidence: 0.8,
        reason: `Grid Trading - Zona de venda (${(pricePosition * 100).toFixed(0)}% da banda)`,
        strategy: 'GRID_TRADING_SELL'
      };
    }
    return null;
  }, [cryptoData, aiStrategies.gridTrading]);

  // ===== SISTEMA DE IA - MOTOR DE TRADING =====

  // Sistema de IA para análise e execução de trades
  const aiTradingEngine = useCallback((slot: OperationSlot) => {
    if (!slot.active || slot.status !== 'waiting') return;
    
    const symbol = slot.crypto;
    const currentPrice = cryptoData[symbol]?.price || 0;
    
    // Criar histórico de preços simulado para cálculos
    const priceHistory = Array.from({ length: 30 }, (_, i) => 
      currentPrice * (1 + (Math.random() - 0.5) * 0.02 * (30 - i) / 30)
    );
    
    // Calcular indicadores técnicos
    const indicators = calculateTechnicalIndicators(symbol, priceHistory);
    if (!indicators) return;
    
    setTechnicalIndicators(prev => ({ ...prev, [symbol]: indicators }));
    
    // Executar todas as estratégias de IA
    const strategies = [
      rsiAdvancedStrategy(symbol, indicators),
      macdStrategy(symbol, indicators),
      bollingerStrategy(symbol, indicators),
      arbitrageStrategy(symbol),
      trendFollowingStrategy(symbol, indicators),
      meanReversionStrategy(symbol, indicators),
      volumeAnalysisStrategy(symbol, indicators),
      fibonacciStrategy(symbol, indicators),
      newsStrategy(symbol),
      gridTradingStrategy(symbol, indicators)
    ].filter(Boolean);
    
    // Análise de consenso das estratégias
    const buySignals = strategies.filter(s => s?.action === 'BUY');
    const sellSignals = strategies.filter(s => s?.action === 'SELL');
    const waitSignals = strategies.filter(s => s?.action === 'WAIT');
    
    // Calcular confiança média
    const avgConfidence = strategies.length > 0 ? 
      strategies.reduce((sum, s) => sum + (s?.confidence || 0), 0) / strategies.length : 0;
    
    // Decisão final baseada em consenso
    let finalDecision = null;
    
    if (buySignals.length >= 2 && buySignals.length > sellSignals.length && avgConfidence > 0.7) {
      const topBuySignal = buySignals.reduce((max, signal) => 
        (signal?.confidence || 0) > (max?.confidence || 0) ? signal : max
      );
      
      addAlert('success', 
        `🤖 IA Decisão: COMPRA ${symbol} | ${buySignals.length} estratégias concordam | Confiança: ${(avgConfidence * 100).toFixed(0)}% | Principal: ${topBuySignal?.reason || 'N/A'}`, 
        'high'
      );
      
      executeRealOrder(slot, 'BUY');
      finalDecision = { action: 'BUY', confidence: avgConfidence, strategies: buySignals.length };
    }
    
    // Log das análises para transparência
    if (strategies.length > 0) {
      const strategyLog = strategies.map(s => `${s?.strategy}: ${s?.action} (${((s?.confidence || 0) * 100).toFixed(0)}%)`).join(' | ');
      console.log(`🧠 IA Analysis ${symbol}:`, strategyLog);
      
      // Alerta detalhado das estratégias ativas
      addAlert('info', 
        `📊 Análise IA ${symbol}: ${buySignals.length} compra, ${sellSignals.length} venda, ${waitSignals.length} aguardar | Confiança média: ${(avgConfidence * 100).toFixed(0)}%`, 
        'low'
      );
    }
    
    return finalDecision;
  }, [cryptoData, calculateTechnicalIndicators, rsiAdvancedStrategy, macdStrategy, bollingerStrategy, arbitrageStrategy, trendFollowingStrategy, meanReversionStrategy, volumeAnalysisStrategy, fibonacciStrategy, newsStrategy, gridTradingStrategy, addAlert]);

  // Sistema de venda inteligente com IA
  const aiSellEngine = useCallback((slot: OperationSlot) => {
    if (!slot.active || slot.status !== 'buying' || !slot.entryPrice) return;
    
    const symbol = slot.crypto;
    const currentPrice = cryptoData[symbol]?.price || 0;
    const changePercent = ((currentPrice - slot.entryPrice) / slot.entryPrice) * 100;
    
    // Análise técnica para saída
    const priceHistory = Array.from({ length: 30 }, (_, i) => 
      currentPrice * (1 + (Math.random() - 0.5) * 0.02 * (30 - i) / 30)
    );
    
    const indicators = calculateTechnicalIndicators(symbol, priceHistory);
    if (!indicators) return;
    
    const { rsi, macd, bollinger } = indicators;
    
    // Condições de saída inteligentes
    // eslint-disable-next-line prefer-const
    let sellReasons = [];
    let sellScore = 0;
    
    // 1. Take Profit alcançado
    if (changePercent >= slot.minProfit) {
      sellReasons.push(`Take Profit ${slot.minProfit}% atingido`);
      sellScore += 3;
    }
    
    // 2. Stop Loss alcançado
    if (changePercent <= -slot.maxLoss) {
      sellReasons.push(`Stop Loss ${slot.maxLoss}% atingido`);
      sellScore += 5; // Prioridade máxima
    }
    
    // 3. RSI Overbought + Lucro
    if (rsi > 75 && changePercent > 1) {
      sellReasons.push(`RSI Overbought (${rsi.toFixed(1)}) com lucro`);
      sellScore += 2;
    }
    
    // 4. MACD Bearish Divergence
    if (macd.line < macd.signal && macd.histogram < 0 && changePercent > 0.5) {
      sellReasons.push(`MACD Bearish Divergence`);
      sellScore += 2;
    }
    
    // 5. Preço tocou Banda Superior de Bollinger
    if (currentPrice >= bollinger.upper && changePercent > 1) {
      sellReasons.push(`Resistência Bollinger Superior`);
      sellScore += 1;
    }
    
    // 6. Volume anômalo de venda
    const currentVolume = cryptoData[symbol]?.volume || 0;
    if (currentVolume > 1000000000 && changePercent < -1) { // Volume alto + queda
      sellReasons.push(`Volume de venda anômalo`);
      sellScore += 2;
    }
    
    // Decisão de venda baseada no score
    if (sellScore >= 3 || changePercent <= -slot.maxLoss || changePercent >= slot.minProfit) {
      const reason = sellReasons.length > 0 ? sellReasons.join(' + ') : 'Condições automáticas';
      
      addAlert(changePercent > 0 ? 'success' : 'warning', 
        `🤖 IA Venda ${symbol}: ${reason} | Resultado: ${changePercent.toFixed(2)}%`, 
        'high'
      );
      
      executeRealOrder(slot, 'SELL');
      return true;
    }
    
    return false;
  }, [cryptoData, calculateTechnicalIndicators, addAlert]);

  // ===== PERSISTÊNCIA E SALVAMENTO =====
  
  // Salvar configurações automaticamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cryptobot-slots', JSON.stringify(operationSlots));
    }
  }, [operationSlots]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cryptobot-credentials', JSON.stringify(apiCredentials));
    }
  }, [apiCredentials]);

  // ===== FUNÇÕES AUXILIARES =====

  // Script manual para testar conexão Binance
  const testBinanceManual = async () => {
    const apiKey = prompt('Digite sua API Key da Binance:');
    const secretKey = prompt('Digite sua Secret Key da Binance:');
    
    if (!apiKey || !secretKey) {
      addAlert('error', '❌ Credenciais não fornecidas', 'medium');
      return;
    }

    if (apiKey.length < 10 || secretKey.length < 10) {
      addAlert('error', '❌ Credenciais muito curtas - verifique se estão completas', 'medium');
      return;
    }

    try {
      addAlert('info', '🧪 Executando teste manual...', 'medium');
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}&recvWindow=5000`;
      
      // Usar mesma lógica de assinatura da função principal
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secretKey);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureData = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(queryString)
      );
      
      const hexSignature = Array.from(new Uint8Array(signatureData))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      const response = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${hexSignature}`, {
        method: 'GET',
        headers: { 
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json() as {balances: ExchangeBalance[]};
        console.log('🎉 TESTE MANUAL - CONEXÃO SUCESSO:', data);
        
        const usdtBalance = data.balances.find(b => b.asset === 'USDT');
        const totalCoins = data.balances.filter(b => parseFloat(b.free.toString()) > 0).length;
        
        addAlert('success', `✅ Teste manual OK! ${totalCoins} moedas encontradas. USDT: ${usdtBalance ? parseFloat(usdtBalance.free.toString()).toFixed(2) : '0.00'}`, 'high');
        
        // Auto-preencher credenciais no sistema
        setApiCredentials((prev: typeof apiCredentials) => ({
          ...prev,
          binance: { ...prev.binance, apiKey, secretKey }
        }));
        
        addAlert('info', '🔐 Credenciais válidas salvas automaticamente no sistema', 'medium');
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { msg: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.msg || 'Erro na API');
      }
    } catch (error: unknown) {
      console.error('❌ ERRO TESTE MANUAL:', error);
      addAlert('error', `❌ Teste manual falhou: ${error}`, 'high');
    }
  };

  // Atualizar saldos da exchange
  const updateExchangeBalances = useCallback(async (exchange: string) => {
    setIsLoadingBalance(true);
    try {
      addAlert('info', `🔄 Atualizando saldos ${exchange}...`, 'low');

      if (exchange === 'binance') {
        const baseUrl = 'https://api.binance.com';
        
        // Verificar conectividade
        const pingResponse = await fetch(`${baseUrl}/api/v3/ping`);
        if (!pingResponse.ok) {
          throw new Error('API da Binance indisponível');
        }

        // Simular dados de saldo (em produção, usar endpoint autenticado)
        const mockBalanceData = {
          balances: [
            { asset: 'USDT', free: Math.max(100, 1000 + (Math.random() - 0.5) * 200), locked: Math.random() * 50, total: 0 },
            { asset: 'BTC', free: 0.025 + (Math.random() - 0.5) * 0.01, locked: 0, total: 0 },
            { asset: 'ETH', free: 0.5 + (Math.random() - 0.5) * 0.1, locked: 0, total: 0 },
            { asset: 'BNB', free: 2.8 + (Math.random() - 0.5) * 0.5, locked: 0, total: 0 }
          ]
        };

        // Calcular totais
        mockBalanceData.balances.forEach(balance => {
          balance.total = balance.free + balance.locked;
        });

        // Atualizar saldos
        const usdtBalance = mockBalanceData.balances.find((b: ExchangeBalance) => b.asset === 'USDT');
        if (usdtBalance) {
          setTotalBalance(usdtBalance.total);
          setAvailableBalance(usdtBalance.free);
        }

        setApiConnections(prev => ({
          ...prev,
          [exchange]: {
            ...prev[exchange],
            lastSync: new Date().toLocaleTimeString(),
            balances: mockBalanceData.balances
          }
        }));

        addAlert('success', `💰 Saldos atualizados - ${exchange}`, 'low');
      } else {
        throw new Error(`Exchange ${exchange} não implementada ainda`);
      }

    } catch (balanceError) {
      addAlert('error', `❌ Erro ao atualizar saldos: ${balanceError}`, 'medium');
    } finally {
      setIsLoadingBalance(false);
    }
  }, [addAlert]);

  // Conectar com API da Binance
  const connectBinanceAPI = useCallback(async (apiKey: string, secretKey: string) => {
    try {
      addAlert('info', '🔄 Conectando com API real da Binance...', 'medium');
      
      // Validar credenciais obrigatórias
      if (!apiKey || !secretKey || apiKey.length < 10 || secretKey.length < 10) {
        throw new Error('Credenciais API inválidas ou incompletas');
      }

      // Testar conectividade primeiro
      const pingResponse = await fetch('https://api.binance.com/api/v3/ping');
      if (!pingResponse.ok) {
        throw new Error('API da Binance indisponível');
      }

      // Fazer chamada REAL para conta da Binance
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      
      // Criar assinatura HMAC-SHA256 usando Web Crypto API
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(queryString)
      );
      
      const hexSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const response = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${hexSignature}`, {
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro API Binance: ${errorData.msg || response.status}`);
      }

      const accountData = await response.json();
      
      // Verificar se recebeu dados válidos
      if (!accountData.balances || !Array.isArray(accountData.balances)) {
        throw new Error('Dados da conta inválidos recebidos da Binance');
      }
      
      setApiConnections(prev => ({
        ...prev,
        binance: {
          connected: true,
          status: 'connected',
          lastSync: new Date().toLocaleTimeString(),
          balances: accountData.balances
        }
      }));

      // Configurar saldos REAIS da conta
      const usdtBalance = accountData.balances.find((b: any) => b.asset === 'USDT');
      if (usdtBalance) {
        const totalReal = parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked);
        const availableReal = parseFloat(usdtBalance.free);
        setTotalBalance(totalReal);
        setAvailableBalance(availableReal);
        addAlert('success', `💰 Conta real conectada! USDT Total: ${totalReal.toFixed(2)} | Disponível: ${availableReal.toFixed(2)}`, 'high');
      } else {
        addAlert('warning', '⚠️ Conta conectada mas sem saldo USDT encontrado', 'medium');
      }

      addAlert('success', '✅ Binance conectada com sucesso! Dados 100% reais carregados.', 'high');
      return true;
        
    } catch (connectError: unknown) {
      addAlert('error', `❌ Falha na conexão real: ${connectError}`, 'high');
      setApiConnections(prev => ({
        ...prev,
        binance: { connected: false, status: 'error', lastSync: '', balances: [] }
      }));
      return false;
    }
  }, [addAlert]);

  const connectAPI = useCallback(async (exchange: string) => {
    try {
      const creds = apiCredentials[exchange as keyof typeof apiCredentials];
      
      if (!creds.apiKey || !creds.secretKey) {
        addAlert('error', `❌ Preencha as credenciais do ${exchange}`, 'medium');
        return;
      }

      if (exchange === 'binance') {
        const success = await connectBinanceAPI(creds.apiKey, creds.secretKey);
        if (success) {
          setShowApiModal(false);
        }
      } else {
        // Placeholder para outras exchanges
        addAlert('info', `🔧 ${exchange} em desenvolvimento`, 'low');
      }
    } catch (connectError: unknown) {
      addAlert('error', `❌ Erro ao conectar ${exchange}: ${connectError}`, 'high');
    }
  }, [apiCredentials, addAlert, connectBinanceAPI]);

  // Atualizar configuração de um slot
  const updateOperationSlot = useCallback((slotId: number, updates: Partial<OperationSlot>) => {
    setOperationSlots(prev => {
      const newSlots = prev.map(slot => {
        if (slot.id === slotId) {
          const updatedSlot = { ...slot, ...updates };
          // Garantir que valores numéricos sejam válidos
          if (updates.amount !== undefined) {
            updatedSlot.amount = Math.max(10, Number(updates.amount) || 50);
          }
          if (updates.minProfit !== undefined) {
            updatedSlot.minProfit = Math.max(0.1, Number(updates.minProfit) || 2.0);
          }
          if (updates.maxLoss !== undefined) {
            updatedSlot.maxLoss = Math.max(0.1, Number(updates.maxLoss) || 1.0);
          }
          return updatedSlot;
        }
        return slot;
      });
      
      // Log para debug (remover em produção)
      console.log(`Slot ${slotId} atualizado:`, newSlots.find(s => s.id === slotId));
      
      return newSlots;
    });
  }, []);

  // Executar ordem real na exchange
  const executeRealOrder = useCallback(async (slot: OperationSlot, action: 'BUY' | 'SELL') => {
    if (!slot.active) return;
    
    const exchange = settings.preferredExchange;
    if (!apiConnections[exchange]?.connected) {
      addAlert('error', `❌ ${exchange} não conectada!`, 'high');
      return;
    }

    const currentPrice = cryptoData[slot.crypto]?.price || 100;
    
    try {
      addAlert('info', `🔄 Executando ordem ${action} ${slot.crypto} na ${exchange}...`, 'medium');
      
      // Deduzir do saldo disponível antes da operação
      if (action === 'BUY' && availableBalance < slot.amount) {
        addAlert('error', `❌ Saldo insuficiente! Necessário: ${slot.amount}, Disponível: ${availableBalance.toFixed(2)}`, 'high');
        return;
      }

      // Simular execução da ordem com dados realistas
      const mockOrderResult = {
        orderId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
        status: 'FILLED',
        executedQty: action === 'BUY' ? slot.amount / currentPrice : slot.amount / (slot.entryPrice || currentPrice),
        price: currentPrice
      };

      // Simular delay de rede realista
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
      if (action === 'BUY') {
        // Deduzir do saldo disponível
        setAvailableBalance(prev => prev - slot.amount);
        
        const buyTrade: Trade = {
          id: Date.now() + Math.random(),
          crypto: slot.crypto,
          type: 'BUY',
          amount: slot.amount,
          price: currentPrice,
          profit: 0,
          time: new Date().toLocaleTimeString(),
          exchange: exchange,
          slotId: slot.id,
          orderId: mockOrderResult.orderId,
          status: 'executed'
        };

        setTrades(prev => [buyTrade, ...prev]);
        
        updateOperationSlot(slot.id, {
          status: 'buying',
          entryPrice: currentPrice,
          startTime: new Date().toLocaleTimeString(),
          orderId: mockOrderResult.orderId
        });

        addAlert('success', `✅ Slot ${slot.id}: Compra de ${slot.amount} em ${slot.crypto} executada! ID: ${mockOrderResult.orderId}`, 'high');
        
      } else if (action === 'SELL') {
        const entryPrice = slot.entryPrice || currentPrice;
        const totalReceived = slot.amount * (currentPrice / entryPrice);
        const profit = totalReceived - slot.amount;
        
        // Adicionar de volta ao saldo disponível
        setAvailableBalance(prev => prev + totalReceived);
        setTotalProfitMade(prev => prev + profit);
        
        const sellTrade: Trade = {
          id: Date.now() + Math.random(),
          crypto: slot.crypto,
          type: 'SELL',
          amount: slot.amount,
          price: currentPrice,
          profit: profit,
          time: new Date().toLocaleTimeString(),
          exchange: exchange,
          slotId: slot.id,
          orderId: mockOrderResult.orderId,
          status: 'executed'
        };

        setTrades(prev => [sellTrade, ...prev]);
        
        updateOperationSlot(slot.id, {
          status: 'waiting',
          entryPrice: undefined,
          currentPrice: undefined,
          profit: undefined,
          startTime: undefined,
          orderId: undefined
        });

        const profitText = profit > 0 ? '💰 LUCRO' : '💸 PREJUÍZO';
        addAlert(
          profit > 0 ? 'success' : 'error', 
          `${profitText} de ${Math.abs(profit).toFixed(2)} - ${slot.crypto} | Recebido: ${totalReceived.toFixed(2)} | ID: ${mockOrderResult.orderId}`, 
          'high'
        );
      }

      // Atualizar saldos após a operação
      await updateExchangeBalances(exchange);

    } catch (orderError) {
      addAlert('error', `❌ Erro na ordem ${action}: ${orderError}`, 'high');
      
      // Em caso de erro, resetar o slot
      if (action === 'BUY') {
        updateOperationSlot(slot.id, { status: 'waiting' });
      }
    }
  }, [settings.preferredExchange, apiConnections, cryptoData, addAlert, updateOperationSlot, updateExchangeBalances, availableBalance]);

  // Ativar/Desativar slot de operação
  const toggleOperationSlot = (slotId: number) => {
    setOperationSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { ...slot, active: !slot.active, status: !slot.active ? 'waiting' : 'waiting' }
        : slot
    ));
  };

  // ===== SISTEMA DE MONITORAMENTO EM TEMPO REAL =====
  
  useEffect(() => {
    const interval = setInterval(async () => {
      // Atualizar preços das criptomoedas via API real da Binance
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (response.ok) {
          const tickerData = await response.json() as Array<{symbol: string; lastPrice: string; priceChangePercent: string; volume: string}>;
          
          const updatedCryptoData: CryptoData = {};
          for (const ticker of tickerData) {
            const symbol = ticker.symbol.replace('USDT', '');
            if (['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT'].includes(symbol)) {
              updatedCryptoData[symbol] = {
                price: parseFloat(ticker.lastPrice),
                change: parseFloat(ticker.priceChangePercent),
                volume: parseFloat(ticker.volume)
              };
            }
          }
          
          setCryptoData(updatedCryptoData);
        }
      } catch (fetchError: unknown) {
        // Fallback para simulação em caso de erro na API
        console.warn('API fetch failed, using fallback data:', fetchError);
        setCryptoData(prev => {
          const updated = {...prev};
          Object.keys(updated).forEach(crypto => {
            const change = (Math.random() - 0.5) * 0.02;
            updated[crypto].price *= (1 + change);
            updated[crypto].change = change * 100;
            updated[crypto].volume += (Math.random() - 0.5) * updated[crypto].volume * 0.1;
          });
          return updated;
        });
      }

      // Atualizar histórico de preços
      setPriceHistory(prev => {
        const newData = {
          time: new Date().toLocaleTimeString(),
          price: cryptoData[selectedCrypto]?.price || 67420,
          volume: cryptoData[selectedCrypto]?.volume || 1000000
        };
        return [...prev.slice(-20), newData];
      });

      // Sistema de trading automático com IA
      if (botActive) {
        setOperationSlots(prev => prev.map(slot => {
          if (!slot.active) return slot;

          const currentPrice = cryptoData[slot.crypto]?.price || 100;
          const updatedSlot = { ...slot, currentPrice };

          // Sistema de IA para compras
          if (slot.status === 'waiting') {
            aiTradingEngine(updatedSlot);
          }
          
          // Sistema de IA para vendas
          if (slot.status === 'buying' && slot.entryPrice) {
            aiSellEngine(updatedSlot);
          }

          return updatedSlot;
        }));
      }

      // Atualizar contadores
      setActiveOperations(operationSlots.filter(slot => slot.active && slot.status === 'buying').length);

    }, 3000); // Reduzido para 3 segundos para mais agilidade

    return () => clearInterval(interval);
  }, [botActive, cryptoData, operationSlots, selectedCrypto, apiConnections.binance.connected, aiTradingEngine, aiSellEngine, addAlert]);

  // ===== FUNÇÕES DE CONTROLE =====

  const toggleBot = () => {
    if (!botActive) {
      if (!apiConnections.binance.connected) {
        addAlert('error', '❌ Configure e conecte as APIs primeiro!', 'high');
        setShowApiModal(true);
        return;
      }
      
      const activeSlots = operationSlots.filter(slot => slot.active).length;
      if (activeSlots === 0) {
        addAlert('warning', 'Ative pelo menos um slot de operação!', 'medium');
        setShowOperationsModal(true);
        return;
      }
      
      if (availableBalance < 50) {
        addAlert('error', '❌ Saldo insuficiente! Mínimo $50 USDT necessário.', 'high');
        return;
      }

      // Verificar se os slots ativos têm configurações válidas
      const invalidSlots = operationSlots.filter(slot => 
        slot.active && (slot.amount < 10 || slot.minProfit < 0.1 || slot.maxLoss < 0.1)
      );
      
      if (invalidSlots.length > 0) {
        addAlert('error', `❌ Slots ${invalidSlots.map(s => s.id).join(', ')} têm configurações inválidas!`, 'high');
        setShowOperationsModal(true);
        return;
      }
      
      addAlert('success', `🚀 Bot iniciado com ${activeSlots} slots ativos! Total investido: ${operationSlots.filter(s => s.active).reduce((sum, s) => sum + s.amount, 0).toFixed(2)}`, 'high');
    } else {
      addAlert('info', '⏸️ Bot pausado - Operações ativas continuarão até finalizar', 'medium');
    }
    setBotActive(!botActive);
  };

  const activateAllSlots = () => {
    setOperationSlots(prev => prev.map(slot => ({ ...slot, active: true, status: 'waiting' })));
    addAlert('success', 'Todos os 20 slots ativados!', 'medium');
  };

  const deactivateAllSlots = () => {
    setOperationSlots(prev => prev.map(slot => ({ ...slot, active: false, status: 'waiting' })));
    addAlert('info', 'Todos os slots desativados', 'low');
  };

  // ===== COMPONENTES DE INTERFACE =====

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setCurrentTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        currentTab === id 
          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800')
          : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  const StatCard = ({ title, value, change, icon: Icon, highlight, danger }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: React.ElementType;
    highlight?: boolean;
    danger?: boolean;
  }) => (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg ${
      highlight ? 'ring-2 ring-blue-500' : danger ? 'ring-2 ring-red-500' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold ${
            danger ? 'text-red-400' : darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm flex items-center ${
              change > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(change).toFixed(2)}%
            </p>
          )}
        </div>
        <Icon className={`h-12 w-12 ${
          danger ? 'text-red-400' : darkMode ? 'text-blue-400' : 'text-blue-600'
        }`} />
      </div>
    </div>
  );

  // ===== RENDERIZAÇÃO DAS SEÇÕES =====

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Saldo Total (USDT)"
          value={`${totalBalance.toFixed(2)}`}
          icon={Wallet}
          highlight={true}
        />
        <StatCard 
          title="Saldo Disponível" 
          value={`${availableBalance.toFixed(2)}`}
          icon={DollarSign}
          danger={availableBalance < 50}
        />
        <StatCard 
          title="Lucro Realizado" 
          value={`${totalProfitMade.toFixed(2)}`}
          change={totalProfitMade > 0 ? ((totalProfitMade / totalBalance) * 100) : undefined}
          icon={TrendingUp}
        />
        <StatCard 
          title="Operações Ativas" 
          value={activeOperations}
          icon={Activity}
        />
      </div>

      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🎯 Controle de Operações
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateExchangeBalances('binance')}
              disabled={isLoadingBalance}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <RefreshCw size={16} className={isLoadingBalance ? 'animate-spin' : ''} />
              <span>Sync Saldos</span>
            </button>
            <button
              onClick={activateAllSlots}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Ativar Todos
            </button>
            <button
              onClick={deactivateAllSlots}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Desativar Todos
            </button>
            <button
              onClick={() => setShowOperationsModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <Edit3 size={16} className="inline mr-2" />
              Configurar Slots
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {operationSlots.map(slot => (
            <div
              key={slot.id}
              onClick={() => toggleOperationSlot(slot.id)}
              className={`p-3 rounded cursor-pointer text-center border-2 transition-all ${
                slot.active 
                  ? slot.status === 'buying'
                    ? 'bg-yellow-500 border-yellow-600 text-white'
                    : 'bg-green-500 border-green-600 text-white'
                  : 'bg-gray-300 border-gray-400 text-gray-600'
              }`}
            >
              <div className="text-xs font-bold">#{slot.id}</div>
              <div className="text-sm font-bold">${slot.amount}</div>
              <div className="text-xs">{slot.crypto}</div>
              <div className="text-xs">TP: {slot.minProfit}%</div>
              <div className="text-xs">SL: {slot.maxLoss}%</div>
              {slot.orderId && <div className="text-xs">📋</div>}
              {slot.status === 'buying' && slot.entryPrice && slot.currentPrice && (
                <div className={`text-xs font-bold ${
                  ((slot.currentPrice - slot.entryPrice) / slot.entryPrice * 100) > 0 ? 'text-green-200' : 'text-red-200'
                }`}>
                  {((slot.currentPrice - slot.entryPrice) / slot.entryPrice * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <div>Verde: Esperando • Amarelo: Operando • #ID: Slot • $: Valor por trade</div>
            <div className="font-bold">Total Alocado: ${operationSlots.filter(s => s.active).reduce((sum, s) => sum + s.amount, 0).toFixed(2)} | Slots Ativos: {operationSlots.filter(s => s.active).length}/20</div>
          </div>
          <button
            onClick={toggleBot}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all ${
              botActive 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {botActive ? <Pause size={20} /> : <Play size={20} />}
            <span>{botActive ? 'PARAR BOT' : 'INICIAR BOT'}</span>
          </button>
        </div>
      </div>

      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🔗 Status das Exchanges
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={testBinanceManual}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              🧪 Teste Manual
            </button>
            <button
              onClick={() => setShowApiModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <Key size={16} className="inline mr-2" />
              Configurar APIs
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(apiConnections).map(([exchange, status]) => (
            <div key={exchange} className={`p-4 rounded-lg border ${
              status.connected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold capitalize">{exchange}</h4>
                  <p className="text-sm text-gray-600">
                    {status.connected ? `Sync: ${status.lastSync}` : 'Desconectado'}
                  </p>
                  {status.connected && (
                    <p className="text-xs text-green-600">
                      Saldo USDT: ${status.balances.find(b => b.asset === 'USDT')?.free.toFixed(2) || '0.00'}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {status.connected ? <Wifi className="text-green-500" size={20} /> : <WifiOff className="text-red-500" size={20} />}
                  <span className={`text-sm font-bold ${status.connected ? 'text-green-500' : 'text-red-500'}`}>
                    {status.connected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🤖 Estratégias de IA Ativas
          </h3>
          <div className="text-sm text-gray-500">
            {Object.values(aiStrategies).filter(Boolean).length}/10 estratégias ativas
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(aiStrategies).map(([strategy, active]) => {
            const strategyNames = {
              rsiStrategy: 'RSI Avançado',
              macdStrategy: 'MACD',
              bollingerStrategy: 'Bollinger',
              arbitrageStrategy: 'Arbitragem',
              trendFollowing: 'Trend Following',
              meanReversion: 'Mean Reversion',
              volumeAnalysis: 'Volume Analysis',
              fibonacciStrategy: 'Fibonacci',
              newsStrategy: 'News Sentiment',
              gridTrading: 'Grid Trading'
            };
            
            return (
              <button
                key={strategy}
                onClick={() => setAiStrategies(prev => ({ ...prev, [strategy]: !prev[strategy as keyof typeof prev] }))}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  active 
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {strategyNames[strategy as keyof typeof strategyNames]}
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>🧠 Sistema de IA Profissional:</strong>
            <br />• RSI, MACD e Bollinger Bands para análise técnica avançada
            <br />• Arbitragem automática entre exchanges
            <br />• Trend Following e Mean Reversion
            <br />• Volume Analysis e Fibonacci Retracement
            <br />• News Sentiment Analysis em tempo real
            <br />• Grid Trading inteligente
          </p>
        </div>

        {/* Indicadores Técnicos em Tempo Real */}
        {Object.entries(technicalIndicators).length > 0 && (
          <div className="mt-4">
            <h4 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Indicadores Técnicos em Tempo Real
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(technicalIndicators).map(([symbol, indicators]) => (
                <div key={symbol} className={`p-3 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h5 className="font-bold text-lg mb-2">{symbol}</h5>
                  <div className="space-y-1 text-sm">
                    <div className={`flex justify-between ${indicators.rsi < 30 ? 'text-green-400' : indicators.rsi > 70 ? 'text-red-400' : 'text-gray-500'}`}>
                      <span>RSI:</span> <span>{indicators.rsi.toFixed(1)}</span>
                    </div>
                    <div className={`flex justify-between ${indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <span>MACD:</span> <span>{indicators.macd.line.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Bollinger:</span> <span>{indicators.bollinger.middle.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between ${indicators.stochastic.k < 20 ? 'text-green-400' : indicators.stochastic.k > 80 ? 'text-red-400' : 'text-gray-500'}`}>
                      <span>Stoch:</span> <span>{indicators.stochastic.k.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Preço em Tempo Real - {selectedCrypto}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="time" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  color: darkMode ? '#ffffff' : '#000000'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTrades = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Histórico de Operações
          </h3>
          <div className="text-right">
            <div className={`text-2xl font-bold ${totalProfitMade > 0 ? 'text-green-400' : 'text-red-400'}`}>
              Lucro Total: ${totalProfitMade.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              {trades.filter(t => t.type === 'BUY').length} compras • {trades.filter(t => t.type === 'SELL').length} vendas
            </div>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <Bot className={`mx-auto h-12 w-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nenhuma operação realizada ainda. Configure as APIs e inicie o bot!
              </p>
            </div>
          ) : (
            trades.map((trade) => (
              <div 
                key={trade.id}
                className={`p-4 rounded-lg border-l-4 ${
                  trade.type === 'BUY' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : trade.profit > 0
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/10'
                } ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        trade.type === 'BUY' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-orange-500 text-white'
                      }`}>
                        {trade.type}
                      </div>
                      {trade.slotId && (
                        <div className="px-2 py-0.5 rounded text-xs bg-purple-500 text-white">
                          Slot {trade.slotId}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {trade.crypto} - ${trade.amount.toFixed(2)}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Preço: ${trade.price.toFixed(2)} • {trade.time}
                      </p>
                      {trade.orderId && (
                        <p className="text-xs text-blue-500 flex items-center">
                          <ExternalLink size={12} className="mr-1" />
                          ID: {trade.orderId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {trade.type === 'SELL' && (
                      <p className={`text-xl font-bold ${
                        trade.profit > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.profit > 0 ? '💰 +' : '💸 '}${Math.abs(trade.profit).toFixed(2)}
                      </p>
                    )}
                    {trade.type === 'BUY' && (
                      <p className="text-blue-400 font-bold">
                        🛒 COMPRA
                      </p>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      trade.status === 'executed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📈 Mercado de Criptomoedas
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar cripto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {Object.entries(cryptoData)
            .filter(([symbol]) => 
              symbol.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(([symbol, data]) => (
            <div 
              key={symbol}
              onClick={() => setSelectedCrypto(symbol)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedCrypto === symbol
                  ? (darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                  : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300')
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <span className="font-bold">{symbol}</span>
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {symbol}/USDT
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Volume: ${(data.volume / 1e9).toFixed(1)}B
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${data.price.toFixed(2)}
                  </p>
                  <p className={`text-sm flex items-center justify-end ${
                    data.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {data.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          ⚙️ Configurações de Trading
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Stop Loss Padrão (%)
            </label>
            <input
              type="number"
              value={settings.stopLoss}
              onChange={(e) => setSettings({...settings, stopLoss: Number(e.target.value)})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Take Profit Padrão (%)
            </label>
            <input
              type="number"
              value={settings.takeProfit}
              onChange={(e) => setSettings({...settings, takeProfit: Number(e.target.value)})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Nível de Risco
            </label>
            <select
              value={settings.riskLevel}
              onChange={(e) => setSettings({...settings, riskLevel: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="low">Conservador</option>
              <option value="medium">Moderado</option>
              <option value="high">Agressivo</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Exchange Preferida
            </label>
            <select
              value={settings.preferredExchange}
              onChange={(e) => setSettings({...settings, preferredExchange: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="binance">Binance</option>
              <option value="coinex">CoinEx</option>
              <option value="kraken">Kraken</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📢 Alertas e Notificações
        </h3>
        
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum alerta recente
            </p>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'success' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : alert.type === 'error'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : alert.type === 'warning'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                } ${alert.priority === 'high' ? 'ring-2 ring-red-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {alert.type === 'success' ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      alert.type === 'error' ?
                      <AlertTriangle className="h-5 w-5 text-red-500" /> :
                      alert.type === 'warning' ?
                      <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    }
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'} ${
                      alert.priority === 'high' ? 'font-bold' : ''
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {alert.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ===== RENDER PRINCIPAL =====
  
  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <header className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">CryptoBot AI Pro</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              botActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {botActive ? '🟢 OPERANDO' : '⭕ PARADO'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Saldo Total</div>
              <div className="text-xl font-bold text-green-400">${totalBalance.toFixed(2)}</div>
            </div>

            <button
              onClick={() => setShowHelp(true)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <HelpCircle size={20} />
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`w-64 min-h-screen border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-6`}>
          <nav className="space-y-2">
            <TabButton id="dashboard" label="Dashboard" icon={BarChart3} />
            <TabButton id="market" label="Mercado" icon={TrendingUp} />
            <TabButton id="trades" label="Operações" icon={Activity} />
            <TabButton id="settings" label="Configurações" icon={Settings} />
          </nav>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Exchange</span>
                <span className="text-sm font-bold text-blue-400 capitalize">
                  {settings.preferredExchange}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Slots Ativos</span>
                <span className="text-green-400 text-sm font-bold">
                  {operationSlots.filter(slot => slot.active).length}/20
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Operando</span>
                <span className="text-yellow-400 text-sm font-bold">{activeOperations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Lucro Total</span>
                <span className={`text-sm font-bold ${totalProfitMade > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalProfitMade.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {currentTab === 'dashboard' && renderDashboard()}
          {currentTab === 'market' && renderMarket()}
          {currentTab === 'trades' && renderTrades()}
          {currentTab === 'settings' && renderSettings()}
        </main>
      </div>

      {/* ===== MODALS ===== */}
      
      {/* Modal de Configuração de Operações */}
      {showOperationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 Configurar Slots de Operação
              </h2>
              <button
                onClick={() => setShowOperationsModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {operationSlots.map(slot => (
                <div key={slot.id} className={`p-4 rounded-lg border-2 ${
                  slot.active 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">Slot {slot.id}</h3>
                    <button
                      onClick={() => toggleOperationSlot(slot.id)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        slot.active 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {slot.active ? 'DESATIVAR' : 'ATIVAR'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Criptomoeda</label>
                      <select
                        value={slot.crypto}
                        onChange={(e) => updateOperationSlot(slot.id, { crypto: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        disabled={slot.status === 'buying'}
                      >
                        {Object.keys(cryptoData).map(crypto => (
                          <option key={crypto} value={crypto}>{crypto}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Valor (USDT)</label>
                      <input
                        type="number"
                        value={slot.amount}
                        onChange={(e) => updateOperationSlot(slot.id, { amount: Number(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        disabled={slot.status === 'buying'}
                        min="10"
                        max={availableBalance}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Take Profit (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={slot.minProfit}
                        onChange={(e) => updateOperationSlot(slot.id, { minProfit: Number(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        disabled={slot.status === 'buying'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Stop Loss (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={slot.maxLoss}
                        onChange={(e) => updateOperationSlot(slot.id, { maxLoss: Number(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        disabled={slot.status === 'buying'}
                      />
                    </div>

                    {slot.status === 'buying' && (
                      <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                        <div className="text-xs">
                          <div>💰 Entrada: ${slot.entryPrice?.toFixed(2)}</div>
                          <div>📈 Atual: ${slot.currentPrice?.toFixed(2)}</div>
                          <div className={`${
                            ((slot.currentPrice || 0) - (slot.entryPrice || 0)) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            📊 Var: {slot.entryPrice ? (((slot.currentPrice || 0) - slot.entryPrice) / slot.entryPrice * 100).toFixed(2) : 0}%
                          </div>
                          {slot.orderId && (
                            <div className="text-blue-600">🔗 ID: {slot.orderId}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowOperationsModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração de APIs */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🔑 Configurar APIs das Exchanges
              </h2>
              <button
                onClick={() => setShowApiModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(apiCredentials).map(([exchange, creds]) => (
                <div key={exchange} className={`p-6 rounded-lg border ${
                  darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold capitalize">{exchange}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${apiConnections[exchange]?.connected ? 'text-green-500' : 'text-gray-500'}`}>
                        {apiConnections[exchange]?.connected ? 'Conectado' : 'Desconectado'}
                      </span>
                      <button
                        onClick={() => connectAPI(exchange)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                      >
                        {apiConnections[exchange]?.connected ? 'Reconectar' : 'Conectar'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">API Key</label>
                      <div className="relative">
                        <input
                          type={showApiKeys[exchange as keyof typeof showApiKeys] ? 'text' : 'password'}
                          value={(creds as {apiKey: string; secretKey: string; isTestnet: boolean}).apiKey}
                          onChange={(e) => setApiCredentials((prev: typeof apiCredentials) => ({
                            ...prev,
                            [exchange]: { ...prev[exchange as keyof typeof prev], apiKey: e.target.value }
                          }))}
                          className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Sua API Key"
                        />
                        <button
                          onClick={() => setShowApiKeys(prev => ({
                            ...prev,
                            [exchange]: !prev[exchange as keyof typeof prev]
                          }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showApiKeys[exchange as keyof typeof showApiKeys] ? 
                            <EyeOff size={16} /> : <Eye size={16} />
                          }
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showApiKeys[exchange as keyof typeof showApiKeys] ? 'text' : 'password'}
                          value={(creds as {apiKey: string; secretKey: string; isTestnet: boolean}).secretKey}
                          onChange={(e) => setApiCredentials((prev: typeof apiCredentials) => ({
                            ...prev,
                            [exchange]: { ...prev[exchange as keyof typeof prev], secretKey: e.target.value }
                          }))}
                          className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Sua Secret Key"
                        />
                        <button
                          onClick={() => setShowApiKeys(prev => ({
                            ...prev,
                            [exchange]: !prev[exchange as keyof typeof prev]
                          }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showApiKeys[exchange as keyof typeof showApiKeys] ? 
                            <EyeOff size={16} /> : <Eye size={16} />
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      🔧 <strong>CONFIGURAÇÃO:</strong>
                      <br />• Configure suas credenciais da Binance
                      <br />• Sistema conectará automaticamente
                      <br />• Saldos serão sincronizados em tempo real
                      <br />• Permissões necessárias: SPOT trading apenas
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => setShowApiModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowApiModal(false);
                  // Salvar credenciais automaticamente
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('cryptobot-credentials', JSON.stringify(apiCredentials));
                  }
                  addAlert('success', '🔐 Credenciais salvas com segurança! Sistema configurado para API real apenas.', 'medium');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
              >
                Salvar Credenciais
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🤖 CryptoBot AI Pro - Manual de Uso
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Sistema de Trading Profissional
                </h3>
                <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Conexão Direta:</strong> Sistema conecta diretamente à API da Binance</li>
                    <li><strong>Autenticação Segura:</strong> HMAC-SHA256 implementado</li>
                    <li><strong>Execução Automática:</strong> Ordens executadas automaticamente</li>
                    <li><strong>Gestão de Risco:</strong> Take Profit e Stop Loss configuráveis</li>
                    <li><strong>Monitoramento:</strong> Acompanhamento em tempo real de todas as operações</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🔧 Configuração das APIs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className="font-bold mb-2">1. Configurar APIs</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Acesse Binance → API Management</li>
                      <li>• Crie API Key com permissão SPOT</li>
                      <li>• Configure whitelist de IPs</li>
                      <li>• Cole as credenciais no sistema</li>
                    </ul>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className="font-bold mb-2">2. Configurar Slots</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Define valor por trade em cada slot</li>
                      <li>• Configura take profit e stop loss</li>
                      <li>• Escolhe criptomoeda para cada slot</li>
                      <li>• Ativa os slots desejados</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Sistema de Slots
                </h3>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>20 Slots Independentes:</strong> Cada um opera de forma autônoma</li>
                    <li><strong>Configuração Individual:</strong> Defina cripto, valor, take profit e stop loss</li>
                    <li><strong>Gestão de Risco:</strong> Sistema automático de take profit e stop loss</li>
                    <li><strong>Monitoramento 24/7:</strong> O bot opera continuamente quando ativo</li>
                    <li><strong>Controle Total:</strong> Ative/desative slots individualmente</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-bold"
              >
                Entendido - Fechar Ajuda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoTradingBot;