import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  CloudQueue as ApiIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  apiLatency: number;
  activeUsers: number;
  errorRate: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    storage: 0,
    apiLatency: 0,
    activeUsers: 0,
    errorRate: 0,
  });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      // Mock API call - replace with actual API
      const mockMetrics: SystemMetrics = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        storage: Math.random() * 100,
        apiLatency: Math.random() * 1000,
        activeUsers: Math.floor(Math.random() * 1000),
        errorRate: Math.random() * 5,
      };

      setMetrics(mockMetrics);
      updateHistoricalData(mockMetrics);
      checkAlerts(mockMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateHistoricalData = (newMetrics: SystemMetrics) => {
    setHistoricalData(prev => {
      const newData = [...prev, { timestamp: new Date(), ...newMetrics }];
      return newData.slice(-30); // Keep last 30 data points
    });
  };

  const checkAlerts = (metrics: SystemMetrics) => {
    const newAlerts: Alert[] = [];

    if (metrics.cpu > 90) {
      newAlerts.push({
        id: Date.now().toString(),
        type: 'error',
        message: 'High CPU usage detected',
        timestamp: new Date(),
      });
    }

    if (metrics.memory > 85) {
      newAlerts.push({
        id: Date.now().toString() + '1',
        type: 'warning',
        message: 'Memory usage approaching limit',
        timestamp: new Date(),
      });
    }

    if (metrics.apiLatency > 800) {
      newAlerts.push({
        id: Date.now().toString() + '2',
        type: 'warning',
        message: 'High API latency detected',
        timestamp: new Date(),
      });
    }

    setAlerts(prev => [...newAlerts, ...prev].slice(0, 5));
  };

  const MetricCard: React.FC<{
    title: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    color: string;
    warning?: number;
    critical?: number;
  }> = ({ title, value, unit, icon, color, warning = 80, critical = 90 }) => {
    const getColor = (value: number) => {
      if (value >= critical) return 'error.main';
      if (value >= warning) return 'warning.main';
      return color;
    };

    return (
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: getColor(value) }}>
          {value.toFixed(1)}{unit}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            mt: 2,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: getColor(value),
            },
          }}
        />
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">System Performance</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchMetrics}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* System Metrics */}
        <Grid item xs={12} md={6} lg={4}>
          <MetricCard
            title="CPU Usage"
            value={metrics.cpu}
            unit="%"
            icon={<SpeedIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <MetricCard
            title="Memory Usage"
            value={metrics.memory}
            unit="%"
            icon={<MemoryIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <MetricCard
            title="Storage Usage"
            value={metrics.storage}
            unit="%"
            icon={<StorageIcon />}
            color="info.main"
          />
        </Grid>

        {/* API Performance */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              API Response Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="apiLatency"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Active Users & Error Rate */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active Users
            </Typography>
            <Typography variant="h3" color="primary">
              {metrics.activeUsers}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Error Rate
            </Typography>
            <Typography
              variant="h3"
              color={metrics.errorRate > 1 ? 'error' : 'success'}
            >
              {metrics.errorRate.toFixed(2)}%
            </Typography>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              System Alerts
            </Typography>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  severity={alert.type}
                  sx={{ mb: 1 }}
                  action={
                    <IconButton size="small" color="inherit">
                      <WarningIcon />
                    </IconButton>
                  }
                >
                  {alert.message} - {new Date(alert.timestamp).toLocaleTimeString()}
                </Alert>
              ))
            ) : (
              <Typography color="text.secondary">No active alerts</Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMonitor;
