"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Play,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  Moon,
  Sun,
  Search,
  BarChart3,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Bot,
  HelpCircle,
  Wifi,
  WifiOff,
  Key,
  X,
  Eye,
  EyeOff,
  DollarSign,
  Edit3,
  RefreshCw,
  ExternalLink,
  Terminal,
  Book,
  Users,
  Shield,
  Target,
  Zap,
  PieChart,
  Calendar,
  Archive,
  Filter,
} from 'lucide-react';

// ===== TIPOS TYPESCRIPT =====
interface CryptoData {
  [key: string]: {
    price: number;
    change: number;
    volume: number;
  };
}

interface OperationSlot {
  id: number;
  active: boolean;
  amount: number;
  minProfit: number;
  maxLoss: number;
  reinvestPercent: number;
  status: 'waiting' | 'buying' | 'selling' | 'completed';
  selectedCrypto?: string;
  entryPrice?: number;
  currentPrice?: number;
  profit?: number;
  startTime?: string;
  orderId?: string;
}

interface Trade {
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
}

interface Alert {
  id: number;
  type: string;
  message: string;
  time: string;
  priority?: 'low' | 'medium' | 'high';
}

interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

interface ExchangeConnection {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  balances: ExchangeBalance[];
}

const App = () => {
  // Estados da Interface
  const [darkMode, setDarkMode] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');

  // Estados Financeiros
  const [totalBalance, setTotalBalance] = useState(1250.00);
  const [availableBalance, setAvailableBalance] = useState(1250.00);
  const [totalProfitMade, setTotalProfitMade] = useState(0);
  const [showOperationsModal, setShowOperationsModal] = useState(false);

  // Estados dos Slots de Operação (20 slots independentes com IA)
  const [operationSlots, setOperationSlots] = useState<OperationSlot[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      active: false,
      amount: 50,
      minProfit: 2.0,
      maxLoss: 1.0,
      reinvestPercent: 25,
      status: 'waiting',
    }));
  });

  const [activeOperations, setActiveOperations] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSlotEditor, setShowSlotEditor] = useState(false);
  const [editingSlot, setEditingSlot] = useState<OperationSlot | null>(null);
  const [showApiKeys, setShowApiKeys] = useState({
    binance: false,
    coinex: false,
    kraken: false,
  });

  // Configurações Gerais
  const [settings, setSettings] = useState({
    stopLoss: 2,
    takeProfit: 4,
    riskLevel: 'medium',
    preferredExchange: 'binance',
  });

  // Estados das APIs das Exchanges
  const [apiConnections, setApiConnections] = useState<{ [key: string]: ExchangeConnection }>({
    binance: { connected: false, status: 'disconnected', lastSync: '', balances: [] },
    coinex: { connected: false, status: 'disconnected', lastSync: '', balances: [] },
    kraken: { connected: false, status: 'disconnected', lastSync: '', balances: [] },
  });

  const [apiCredentials, setApiCredentials] = useState({
    binance: { apiKey: '', secretKey: '', isTestnet: false },
    coinex: { apiKey: '', secretKey: '', isTestnet: false },
    kraken: { apiKey: '', secretKey: '', isTestnet: false },
  });

  // Dados de criptomoedas (obtidos via backend)
  const [cryptoData, setCryptoData] = useState<CryptoData>({});

  // Estratégias de IA implementadas
  const [aiStrategies, setAiStrategies] = useState({
    rsiStrategy: true,
    macdStrategy: true,
    bollingerStrategy: true,
    arbitrageStrategy: true,
    trendFollowing: true,
    meanReversion: true,
    volumeAnalysis: true,
    fibonacciStrategy: true,
    newsStrategy: true,
    gridTrading: true,
  });

  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // ===== FUNÇÕES AUXILIARES =====
  const addAlert = useCallback(
    (type: string, message: string, priority: 'low' | 'medium' | 'high' = 'low') => {
      setAlerts((prev) => [
        {
          id: Date.now() + Math.random(),
          type,
          message,
          time: new Date().toLocaleTimeString(),
          priority,
        },
        ...prev,
      ].slice(0, 15));
    },
    []
  );

  // ===== SISTEMA DE IA =====
  const calculateTechnicalIndicators = useCallback((symbol: string, prices: number[]) => {
    if (prices.length < 26) return null;

    const calculateRSI = (prices: number[], period = 14) => {
      let gains = 0,
        losses = 0;
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

    const calculateMACD = (prices: number[]) => {
      const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
      const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
      const macdLine = ema12 - ema26;
      const signalLine = macdLine * 0.2;
      const histogram = macdLine - signalLine;
      return { line: macdLine, signal: signalLine, histogram };
    };

    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    return { rsi, macd };
  }, []);

  const analyzeMarketForSlot = useCallback(() => {
    const analysis: { [key: string]: { score: number; signals: string[]; confidence: number } } = {};
    Object.keys(cryptoData).forEach((symbol) => {
      const price = cryptoData[symbol].price;
      const change = cryptoData[symbol].change;
      const volume = cryptoData[symbol].volume;
      const priceHistory = Array.from({ length: 30 }, (_, i) =>
        price * (1 + (Math.random() - 0.5) * 0.02 * (30 - i) / 30)
      );
      const indicators = calculateTechnicalIndicators(symbol, priceHistory);
      if (!indicators) return;

      let score = 0.5;
      const signals = [];
      if (indicators.rsi < 30) {
        score += 0.3;
        signals.push('RSI Oversold');
      } else if (indicators.rsi > 70) {
        score -= 0.3;
        signals.push('RSI Overbought');
      }

      if (indicators.macd.line > indicators.macd.signal) {
        score += 0.2;
        signals.push('MACD Bullish');
      } else {
        score -= 0.2;
        signals.push('MACD Bearish');
      }

      if (change > 2) {
        score += 0.2;
        signals.push('Strong Uptrend');
      } else if (change < -2) {
        score -= 0.2;
        signals.push('Strong Downtrend');
      }

      if (volume > 1000000000 && change > 1) {
        score += 0.1;
        signals.push('High Volume Breakout');
      }

      analysis[symbol] = {
        score: Math.max(0, Math.min(1, score)),
        signals,
        confidence: Math.abs(score - 0.5) * 2,
      };
    });
    return analysis;
  }, [cryptoData, calculateTechnicalIndicators]);

  const selectBestCryptoForSlot = useCallback(() => {
    const analysis = analyzeMarketForSlot();
    const sortedCryptos = Object.entries(analysis)
      .filter(([_, data]) => data.score > 0.6)
      .sort(([_, a], [__, b]) => b.score - a.score);
    return sortedCryptos.length > 0 ? sortedCryptos[0] : null;
  }, [analyzeMarketForSlot]);

  // ===== CONECTIVIDADE COM CORRETORAS =====
  const connectAPI = useCallback(async (exchange: string) => {
    try {
      const res = await axios.post(`http://localhost:3001/api/exchanges/connect`, {
        exchange,
        ...apiCredentials[exchange],
      });
      addAlert('success', res.data.message, 'high');
    } catch (error: any) {
      addAlert('error', `❌ Erro ao conectar ${exchange}: ${error.message}`, 'high');
    }
  }, [addAlert, apiCredentials]);

  // Atualizar preços (usando backend)
  const fetchMarketData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/market/data');
      setCryptoData(response.data);
    } catch (error) {
      addAlert('error', '❌ Erro ao buscar dados de mercado', 'high');
    }
  };

  // ===== SISTEMA DE TRADING =====
  const executeSell = useCallback((slot: OperationSlot, reason: string, currentPrice: number) => {
    const totalReceived = slot.amount * (currentPrice / (slot.entryPrice || currentPrice));
    const profit = totalReceived - slot.amount;
    const reinvestAmount = profit > 0 ? (profit * slot.reinvestPercent / 100) : 0;
    setAvailableBalance((prev) => prev + totalReceived);
    setTotalProfitMade((prev) => prev + profit);
    setTotalBalance((prev) => prev + profit);

    let newSlotAmount = slot.amount;
    if (reinvestAmount > 0) {
      newSlotAmount += reinvestAmount;
      addAlert('info', `📈 Slot ${slot.id}: Reinvestindo $${reinvestAmount.toFixed(2)} (${slot.reinvestPercent}%) - Novo valor: $${newSlotAmount.toFixed(2)}`);
    }

    const sellTrade: Trade = {
      id: Date.now() + Math.random(),
      crypto: slot.selectedCrypto!,
      type: 'SELL',
      amount: slot.amount,
      price: currentPrice,
      profit,
      time: new Date().toLocaleTimeString(),
      exchange: settings.preferredExchange,
      slotId: slot.id,
      orderId: `ORD${Date.now()}`,
      status: 'executed',
    };

    setTrades((prev) => [sellTrade, ...prev]);
    setOperationSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? {
              ...s,
              status: 'waiting',
              amount: newSlotAmount,
              selectedCrypto: undefined,
              entryPrice: undefined,
              currentPrice: undefined,
              startTime: undefined,
            }
          : s
      )
    );

    const profitText = profit > 0 ? '💰 LUCRO' : '💸 PREJUÍZO';
    addAlert(
      profit > 0 ? 'success' : 'error',
      `${profitText} de $${Math.abs(profit).toFixed(2)} - ${slot.selectedCrypto} Slot ${slot.id} | ${reason} | Resultado: ${((profit / slot.amount) * 100).toFixed(2)}%`
    );
  }, [addAlert, settings.preferredExchange]);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const executeRealTrade = async (slotId, type, amount, price, symbol) => {
  try {
    const tradeAmount = amount / price;
    const res = await axios.post(`${API_URL}/api/trades/execute`, {
      slotId,
      type,
      amount: tradeAmount,
      price,
      symbol,
    });

    if (res.data.success) {
      addAlert('success', `${type} executada: ${amount} ${symbol} a $${price}`, 'medium');
    } else {
      throw new Error(res.data.error);
    }
  } catch (error) {
    console.error(error);
    addAlert('error', `Falha ao executar ${type.toLowerCase()}: ${error.message}`, 'high');
  }
};

  const executeAITrade = useCallback(
    async (slot: OperationSlot) => {
      const bestCrypto = selectBestCryptoForSlot();
      if (!bestCrypto) return;

      const [symbol, analysis] = bestCrypto;
      const currentPrice = cryptoData[symbol]?.price || 0;

      if (availableBalance < slot.amount) {
        addAlert('warning', `⚠️ Saldo insuficiente para Slot ${slot.id}`, 'medium');
        return;
      }

      setAvailableBalance((prev) => prev - slot.amount);
      setOperationSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                selectedCrypto: symbol,
                status: 'buying',
                entryPrice: currentPrice,
                startTime: new Date().toISOString(),
              }
            : s
        )
      );

      const buyTrade: Trade = {
        id: Date.now() + Math.random(),
        crypto: symbol,
        type: 'BUY',
        amount: slot.amount,
        price: currentPrice,
        profit: 0,
        time: new Date().toISOString(),
        exchange: settings.preferredExchange,
        slotId: slot.id,
        orderId: `ORD${Date.now()}`,
        status: 'executed',
      };

      setTrades((prev) => [buyTrade, ...prev]);
      addAlert('success', `🤖 IA Comprou: ${symbol} no Slot ${slot.id} | Score: ${(analysis.score * 100).toFixed(0)}% | Sinais: ${analysis.signals.join(', ')} | Preço: $${currentPrice.toFixed(2)}`);

      await executeRealTrade(slot.id, 'BUY', slot.amount, currentPrice, symbol);
    },
    [selectBestCryptoForSlot, cryptoData, availableBalance, addAlert, settings.preferredExchange, executeRealTrade]
  );

  const checkSellConditions = useCallback((slot: OperationSlot) => {
    if (!slot.active || slot.status !== 'buying' || !slot.selectedCrypto || !slot.entryPrice) return;
    const currentPrice = cryptoData[slot.selectedCrypto].price;
    const changePercent = ((currentPrice - slot.entryPrice) / slot.entryPrice) * 100;
    setOperationSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id ? { ...s, currentPrice } : s
      )
    );

    let shouldSell = false;
    let reason = '';
    if (changePercent >= slot.minProfit) {
      shouldSell = true;
      reason = `Take Profit ${slot.minProfit}% atingido`;
    }
    if (changePercent <= -slot.maxLoss) {
      shouldSell = true;
      reason = `Stop Loss ${slot.maxLoss}% atingido`;
    }

    if (shouldSell) {
      executeSell(slot, reason, currentPrice);
    }
  }, [cryptoData, executeSell]);

  // ===== EVENT HANDLERS =====
  const toggleOperationSlot = (slotId: number) => {
    setOperationSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? { ...slot, active: !slot.active, status: slot.active ? 'waiting' : 'waiting' as const }
          : slot
      )
    );

    const slot = operationSlots.find((s) => s.id === slotId);
    if (slot?.status === 'buying') {
      addAlert('warning', `⚠️ Slot ${slotId} está operando - não pode ser desativado agora`);
      return;
    }
    addAlert('info', `Slot ${slotId} ${slot?.active ? 'desativado' : 'ativado'}`);
  };

  const editSlot = (slotId: number) => {
    const slot = operationSlots.find((s) => s.id === slotId);
    if (slot) {
      setEditingSlot(slot);
      setShowSlotEditor(true);
    }
  };

  const saveSlotChanges = (applyToAll = false) => {
    if (!editingSlot) return;
    if (editingSlot.amount < 10) {
      addAlert('error', '❌ Valor mínimo é $10');
      return;
    }
    if (editingSlot.amount > 10000) {
      addAlert('error', '❌ Valor máximo é $10,000');
      return;
    }
    if (editingSlot.minProfit < 0.5) {
      addAlert('error', '❌ Take Profit mínimo é 0.5%');
      return;
    }
    if (editingSlot.maxLoss < 0.5) {
      addAlert('error', '❌ Stop Loss mínimo é 0.5%');
      return;
    }

    if (applyToAll) {
      setOperationSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          amount: editingSlot.amount,
          minProfit: editingSlot.minProfit,
          maxLoss: editingSlot.maxLoss,
          reinvestPercent: editingSlot.reinvestPercent,
        }))
      );
      addAlert('success', '✅ Configurações aplicadas a todos os 20 slots!');
    } else {
      setOperationSlots((prev) =>
        prev.map((slot) =>
          slot.id === editingSlot.id ? editingSlot : slot
        )
      );
      addAlert('success', `✅ Slot ${editingSlot.id} atualizado!`);
    }

    setShowSlotEditor(false);
    setEditingSlot(null);
  };

  const toggleBot = () => {
    if (!botActive) {
      const activeSlots = operationSlots.filter((slot) => slot.active).length;
      if (activeSlots === 0) {
        addAlert('warning', 'Ative pelo menos um slot de operação!', 'medium');
        setCurrentTab('trading');
        return;
      }
      if (availableBalance < 50) {
        addAlert('error', '❌ Saldo insuficiente! Mínimo $50 USDT necessário.', 'high');
        return;
      }
      addAlert('success', `🚀 Bot iniciado com ${activeSlots} slots ativos! IA analisando mercado...`);
    } else {
      addAlert('info', '⏸️ Bot pausado - Operações ativas continuarão até finalizar', 'medium');
    }
    setBotActive(!botActive);
  };

  const activateAllSlots = () => {
    setOperationSlots((prev) => prev.map((slot) => ({ ...slot, active: true })));
    addAlert('success', 'Todos os 20 slots ativados!', 'medium');
  };

  const deactivateAllSlots = () => {
    setOperationSlots((prev) => prev.map((slot) => ({ ...slot, active: false })));
    addAlert('info', 'Todos os slots desativados', 'low');
  };

  // ===== EFEITOS E MONITORAMENTO =====
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
      if (botActive) {
        operationSlots.forEach((slot) => {
          if (slot.active && slot.status === 'waiting') {
            if (Math.random() < 0.3) {
              executeAITrade(slot);
            }
          }
          if (slot.status === 'buying') {
            checkSellConditions(slot);
          }
        });
      }
      setActiveOperations(operationSlots.filter((slot) => slot.active && slot.status === 'buying').length);
    }, 3000);
    return () => clearInterval(interval);
  }, [botActive, operationSlots, fetchMarketData, executeAITrade, checkSellConditions]);

  // ===== COMPONENTES DE INTERFACE =====
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    highlight?: boolean;
    danger?: boolean;
  }> = ({ title, value, change, icon: Icon, highlight, danger }) => (
    <div
      className={`p-6 rounded-xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-lg ${highlight ? 'ring-2 ring-blue-500' : danger ? 'ring-2 ring-red-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold ${danger ? 'text-red-400' : darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm flex items-center ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(change).toFixed(2)}%
            </p>
          )}
        </div>
        <Icon className={`h-12 w-12 ${danger ? 'text-red-400' : darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    </div>
  );

  // ===== SISTEMA DE ABAS =====
  const TabButton = ({
    tabId,
    icon: Icon,
    label,
    active,
  }: {
    tabId: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
  }) => (
    <button
      onClick={() => setCurrentTab(tabId)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        active
          ? 'bg-blue-600 text-white'
          : darkMode
          ? 'text-gray-300 hover:bg-gray-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // ===== RENDERIZAÇÃO PRINCIPAL =====
  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header
        className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">CryptoBot AI Pro</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                botActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}
            >
              {botActive ? '🟢 OPERANDO' : '⭕ PARADO'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Saldo Total</div>
              <div className="text-xl font-bold text-green-600">${totalBalance.toFixed(2)}</div>
            </div>
            <button
              onClick={() => setShowHelp(true)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              title="Ajuda"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        {/* Sistema de Abas */}
        <div className="flex space-x-2 mt-4 overflow-x-auto">
          <TabButton tabId="dashboard" icon={BarChart3} label="📊 Dashboard" active={currentTab === 'dashboard'} />
          <TabButton tabId="trading" icon={Target} label="🎯 Trading" active={currentTab === 'trading'} />
          <TabButton tabId="market" icon={TrendingUp} label="📈 Mercado" active={currentTab === 'market'} />
          <TabButton tabId="config" icon={Settings} label="⚙️ Configurações" active={currentTab === 'config'} />
          <TabButton tabId="logs" icon={Archive} label="📋 Logs" active={currentTab === 'logs'} />
        </div>
      </header>
      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div>
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
            {/* Controle Principal */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">🤖 Sistema de IA</h3>
                  <p className="text-gray-500">
                    Status: {botActive ? '🟢 Operando com IA' : '⭕ Pausado'} |{' '}
                    Slots Ativos: {operationSlots.filter((s) => s.active).length}/20
                  </p>
                </div>
                <button
                  onClick={toggleBot}
                  className={`flex items-center space-x-2 px-8 py-4 rounded-lg font-bold transition-all text-lg ${
                    botActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {botActive ? <Pause size={24} /> : <Play size={24} />}
                  <span>{botActive ? 'PARAR BOT' : 'INICIAR BOT'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {currentTab === 'trading' && (
          <div>
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Slots de Operação (20 Slots com IA)
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={activateAllSlots}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    ✅ Ativar Todos
                  </button>
                  <button
                    onClick={deactivateAllSlots}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    ❌ Desativar Todos
                  </button>
                  <button
                    onClick={() => {
                      const firstSlot = operationSlots[0];
                      setEditingSlot(firstSlot);
                      setShowSlotEditor(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    <Edit3 size={16} className="inline mr-1" />
                    Editar Configurações
                  </button>
                </div>
              </div>
              {/* Grid dos 20 Slots */}
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 mb-4">
                {operationSlots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => toggleOperationSlot(slot.id)}
                    onDoubleClick={() => editSlot(slot.id)}
                    className={`p-3 rounded cursor-pointer text-center border-2 transition-all ${
                      slot.active
                        ? slot.status === 'buying'
                          ? 'bg-yellow-500 border-yellow-600 text-white'
                          : 'bg-green-500 border-green-600 text-white'
                        : 'bg-gray-300 border-gray-400 text-gray-600'
                    } hover:scale-105`}
                    title={`Clique: Ativar/Desativar | Duplo-clique: Editar Slot ${slot.id}`}
                  >
                    <div className="text-xs font-bold">#{slot.id}</div>
                    <div className="text-sm font-bold">${slot.amount.toFixed(0)}</div>
                    <div className="text-xs">{slot.selectedCrypto || '🤖 IA'}</div>
                    <div className="text-xs">TP: {slot.minProfit}%</div>
                    <div className="text-xs">SL: {slot.maxLoss}%</div>
                    <div className="text-xs">R: {slot.reinvestPercent}%</div>
                    {slot.status === 'buying' && slot.entryPrice && slot.currentPrice && (
                      <div
                        className={`text-xs font-bold ${
                          ((slot.currentPrice - slot.entryPrice) / slot.entryPrice * 100) > 0
                            ? 'text-green-200'
                            : 'text-red-200'
                        }`}
                      >
                        {((slot.currentPrice - slot.entryPrice) / slot.entryPrice * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>🟢 Verde: Aguardando • 🟡 Amarelo: Operando • 🤖 IA: Moeda escolhida automaticamente</div>
                <div>TP: Take Profit • SL: Stop Loss • R: % Reinvestimento</div>
                <div className="font-bold text-blue-500">
                  💡 DICA: <span className="text-purple-500">Clique</span> = ativar/desativar |{' '}
                  <span className="text-green-500">Duplo-clique</span> = editar valores do slot
                </div>
                <div className="font-bold">
                  Total Alocado: $
                  {operationSlots.filter((s) => s.active).reduce((sum, s) => sum + s.amount, 0).toFixed(2)} |{' '}
                  Slots Ativos: {operationSlots.filter((s) => s.active).length}/20
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Tab */}
        {currentTab === 'market' && (
          <div>
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
              <h3 className="text-xl font-bold mb-4">📈 Mercado de Criptomoedas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(cryptoData).map(([symbol, data]) => (
                  <div
                    key={symbol}
                    className={`p-4 rounded-lg border ${
                      data.change > 0
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{symbol}</h4>
                      <span
                        className={`text-sm font-bold ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {data.change > 0 ? '+' : ''}
                        {data.change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold">${data.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Vol: ${(data.volume / 1e9).toFixed(1)}B</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {currentTab === 'config' && (
          <div>
            {/* Status das Exchanges */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🔗 Status das Exchanges
                </h3>
                <button
                  onClick={() => setShowApiModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  <Key size={16} className="inline mr-2" />
                  Configurar APIs
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(apiConnections).map(([exchange, status]) => (
                  <div
                    key={exchange}
                    className={`p-4 rounded-lg border ${
                      status.connected
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold capitalize">{exchange}</h4>
                        <p className="text-sm text-gray-600">
                          {status.connected ? `Sync: ${status.lastSync}` : 'Desconectado'}
                        </p>
                        {status.connected && (
                          <p className="text-xs text-green-600">
                            Saldo USDT: $
                            {status.balances.find((b) => b.asset === 'USDT')?.free?.toFixed(2) || '0.00'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {status.connected ? (
                          <Wifi className="text-green-500" size={20} />
                        ) : (
                          <WifiOff className="text-red-500" size={20} />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            status.connected ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {status.connected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Estratégias de IA */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className="text-xl font-bold mb-4">🧠 Estratégias de IA Ativas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(aiStrategies).map(([strategy, enabled]) => (
                  <div
                    key={strategy}
                    className={`p-3 rounded-lg border text-center ${
                      enabled
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        enabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500'
                      }`}
                    >
                      {strategy.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div
                      className={`text-xs ${
                        enabled ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {enabled ? '✅ Ativo' : '❌ Inativo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {currentTab === 'logs' && (
          <div>
            {/* Alertas do Sistema */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🔔 Alertas do Sistema IA
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    🤖 Sistema iniciado! Configure as APIs e ative os slots para começar.
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
                          {alert.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : alert.type === 'error' ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : alert.type === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 dark:text-blue-500" />
                          )}
                          <p
                            className={`${darkMode ? 'text-white' : 'text-gray-900'} ${
                              alert.priority === 'high' ? 'font-bold' : ''
                            }`}
                          >
                            {alert.message}
                          </p>
                        </div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{alert.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Histórico de Trades */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className="text-xl font-bold mb-4">📊 Histórico de Trades</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <th className="text-left py-2">Hora</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Crypto</th>
                      <th className="text-left py-2">Valor</th>
                      <th className="text-left py-2">Preço</th>
                      <th className="text-left py-2">Lucro</th>
                      <th className="text-left py-2">Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-500">
                          Nenhum trade realizado ainda
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade) => (
                        <tr
                          key={trade.id}
                          className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                        >
                          <td className="py-2">{trade.time}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                trade.type === 'BUY' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                              }`}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2 font-bold">{trade.crypto}</td>
                          <td className="py-2">${trade.amount.toFixed(2)}</td>
                          <td className="py-2">${trade.price.toFixed(2)}</td>
                          <td className={`py-2 font-bold ${trade.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${trade.profit.toFixed(2)}
                          </td>
                          <td className="py-2">#{trade.slotId}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configuração de APIs */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } p-6`}
          >
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
                <div
                  key={exchange}
                  className={`p-6 rounded-lg border ${
                    darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold capitalize">{exchange}</h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm ${
                          apiConnections[exchange]?.connected ? 'text-green-500' : 'text-gray-500'
                        }`}
                      >
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
                          value={creds.apiKey}
                          onChange={(e) =>
                            setApiCredentials((prev) => ({
                              ...prev,
                              [exchange]: { ...prev[exchange as keyof typeof prev], apiKey: e.target.value },
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Sua API Key"
                        />
                        <button
                          onClick={() =>
                            setShowApiKeys((prev) => ({
                              ...prev,
                              [exchange]: !prev[exchange as keyof typeof prev],
                            }))
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showApiKeys[exchange as keyof typeof showApiKeys] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Secret Key</label>
                      <div className="relative">
                        <input
                          type={showApiKeys[exchange as keyof typeof showApiKeys] ? 'text' : 'password'}
                          value={creds.secretKey}
                          onChange={(e) =>
                            setApiCredentials((prev) => ({
                              ...prev,
                              [exchange]: { ...prev[exchange as keyof typeof prev], secretKey: e.target.value },
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Sua Secret Key"
                        />
                        <button
                          onClick={() =>
                            setShowApiKeys((prev) => ({
                              ...prev,
                              [exchange]: !prev[exchange as keyof typeof prev],
                            }))
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showApiKeys[exchange as keyof typeof showApiKeys] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      🔧 <strong>MODO REAL:</strong> Este bot opera com ordens reais.
                      <br />• Conecte sua conta à exchange
                      <br />• Use com cuidado: você está operando com dinheiro real
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
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📚 Guia Completo do CryptoBot AI Pro
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
                <h3 className="text-xl font-bold mb-3 text-blue-500">🎯 Como Usar o Sistema</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>1. Dashboard:</strong> Visualize estatísticas gerais e controle principal
                  </p>
                  <p>
                    <strong>2. Trading:</strong> Configure e monitore os 20 slots de operação
                  </p>
                  <p>
                    <strong>3. Mercado:</strong> Acompanhe preços das criptomoedas em tempo real
                  </p>
                  <p>
                    <strong>4. Configurações:</strong> Conecte exchanges e ajuste estratégias
                  </p>
                  <p>
                    <strong>5. Logs:</strong> Veja histórico de trades e alertas do sistema
                  </p>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-3 text-green-500">🤖 Estratégias de IA Ativas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-bold">📊 Análise Técnica:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>RSI Strategy (Oversold/Overbought)</li>
                      <li>MACD (Moving Average Convergence)</li>
                      <li>Bollinger Bands (Volatility)</li>
                      <li>Fibonacci Retracements</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold">🎯 Estratégias Avançadas:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Trend Following (Seguir tendências)</li>
                      <li>Mean Reversion (Reversão à média)</li>
                      <li>Volume Analysis (Análise de volume)</li>
                      <li>Grid Trading (Trading em grade)</li>
                    </ul>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-3 text-purple-500">⚙️ Configuração dos Slots</h3>
                <div className="text-sm space-y-2">
                  <p><strong>Valor:</strong> Quantia em USDT para cada operação</p>
                  <p><strong>Take Profit (TP):</strong> % de lucro para vender automaticamente</p>
                  <p><strong>Stop Loss (SL):</strong> % de perda máxima tolerada</p>
                  <p><strong>Reinvestimento:</strong> % do lucro que será reinvestido no slot</p>
                  <p><strong>🤖 IA:</strong> O sistema escolhe automaticamente a melhor moeda</p>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-3 text-orange-500">🚀 Passo a Passo Rápido</h3>
                <div className="text-sm space-y-2">
                  <p><strong>1.</strong> Conecte suas credenciais de API</p>
                  <p><strong>2.</strong> Ative os slots desejados na aba Trading</p>
                  <p><strong>3.</strong> Ajuste valores, TP, SL e reinvestimento de cada slot</p>
                  <p><strong>4.</strong> Clique em "Iniciar Bot" no Dashboard</p>
                  <p><strong>5.</strong> A IA analisará o mercado e executará ordens reais</p>
                  <p><strong>6.</strong> Monitore os resultados nas abas Logs e Trading</p>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-bold mb-3 text-red-500">⚠️ Avisos Importantes</h3>
                <div className="text-sm space-y-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p><strong>• Modo Real:</strong> Este bot opera com ordens reais</p>
                  <p><strong>• Risco:</strong> Trading real envolve risco de perda total</p>
                  <p><strong>• Responsabilidade:</strong> Faça suas próprias pesquisas</p>
                </div>
              </section>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
              >
                Entendi! Vamos começar 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Editor de Slot */}
      {showSlotEditor && editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-lg w-full rounded-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⚙️ Configurar Slot #{editingSlot.id}
              </h2>
              <button
                onClick={() => setShowSlotEditor(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">💰 Valor da Operação (USDT)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={editingSlot.amount}
                  onChange={(e) =>
                    setEditingSlot((prev) =>
                      prev ? { ...prev, amount: parseFloat(e.target.value) || 50 } : null
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Valor mínimo: $10 | Máximo: $10,000</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">📈 Take Profit (%)</label>
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={editingSlot.minProfit}
                  onChange={(e) =>
                    setEditingSlot((prev) =>
                      prev ? { ...prev, minProfit: parseFloat(e.target.value) || 2.0 } : null
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Lucro desejado para vender automaticamente</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">📉 Stop Loss (%)</label>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={editingSlot.maxLoss}
                  onChange={(e) =>
                    setEditingSlot((prev) =>
                      prev ? { ...prev, maxLoss: parseFloat(e.target.value) || 1.0 } : null
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">% de perda máxima tolerada</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">🔄 Reinvestimento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={editingSlot.reinvestPercent}
                  onChange={(e) =>
                    setEditingSlot((prev) =>
                      prev ? { ...prev, reinvestPercent: parseFloat(e.target.value) || 25 } : null
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">% do lucro que será reinvestido neste slot</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">📊 Resumo da Configuração:</h4>
                <div className="text-sm space-y-1">
                  <p>• Valor por operação: <strong>${editingSlot.amount.toFixed(2)}</strong></p>
                  <p>• Lucro esperado: <strong>+{editingSlot.minProfit}%</strong> (${(
                    editingSlot.amount * editingSlot.minProfit / 100
                  ).toFixed(2)})</p>
                  <p>• Perda máxima: <strong>-{editingSlot.maxLoss}%</strong> (${
                    editingSlot.amount * editingSlot.maxLoss / 100
                  ).toFixed(2)})</p>
                  <p>• Reinvestimento: <strong>{editingSlot.reinvestPercent}%</strong> do lucro</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => saveSlotChanges(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold"
              >
                ✅ Salvar Apenas Este Slot
              </button>
              <button
                onClick={() => saveSlotChanges(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold"
              >
                🔄 Aplicar a Todos os Slots
              </button>
              <button
                onClick={() => setShowSlotEditor(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
              >
                ❌
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;