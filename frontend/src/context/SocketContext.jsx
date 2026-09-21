import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [sentiment, setSentiment] = useState({
    mood: 'Neutral',
    upCount: 70,
    downCount: 68,
    ratio: 51,
    netBreadth: '+1.4%'
  });
  const [movers, setMovers] = useState({ gainers: [], losers: [] });
  const [sectorHeatmap, setSectorHeatmap] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : '/';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      // Join private user room if logged in
      if (user && user.id) {
        newSocket.emit('JOIN_USER_ROOM', user.id);
      }
    });

    // Real-time market tick stream (every 2 seconds)
    newSocket.on('MARKET_TICK_STREAM', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setInstruments(data);
      }
    });

    // Sentiment updates
    newSocket.on('SENTIMENT_STREAM', (data) => {
      if (data) setSentiment(data);
    });

    // Top Movers updates
    newSocket.on('MOVERS_STREAM', (data) => {
      if (data) setMovers(data);
    });

    // Sector heatmap updates
    newSocket.on('SECTOR_STREAM', (data) => {
      if (data) setSectorHeatmap(data);
    });

    // Real-time market and watchlist alerts
    newSocket.on('NEW_ALERT', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev.slice(0, 20)]);
      setUnreadAlertsCount((prev) => prev + 1);
    });

    newSocket.on('ORDER_EXECUTED', (data) => {
      if (data.alert) {
        setLiveAlerts((prev) => [data.alert, ...prev]);
        setUnreadAlertsCount((prev) => prev + 1);
      }
    });

    newSocket.on('STOP_LOSS_TRIGGERED', (data) => {
      if (data.alert) {
        setLiveAlerts((prev) => [data.alert, ...prev]);
        setUnreadAlertsCount((prev) => prev + 1);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Fast map lookup by symbol: instrumentsMap.get('INFY')
  const instrumentsMap = useMemo(() => {
    const map = new Map();
    instruments.forEach((inst) => {
      map.set(inst.symbol, inst);
    });
    return map;
  }, [instruments]);

  const clearUnreadAlerts = () => {
    setUnreadAlertsCount(0);
  };

  const dismissAlert = (alertId) => {
    setLiveAlerts((prev) => prev.filter((a) => a._id !== alertId));
  };

  const clearAllAlerts = () => {
    setLiveAlerts([]);
    setUnreadAlertsCount(0);
  };

  const value = {
    socket,
    instruments,
    instrumentsMap,
    sentiment,
    movers,
    sectorHeatmap,
    liveAlerts,
    unreadAlertsCount,
    clearUnreadAlerts,
    dismissAlert,
    clearAllAlerts
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

