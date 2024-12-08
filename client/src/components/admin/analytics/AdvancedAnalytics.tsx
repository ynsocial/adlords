import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  ButtonGroup,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AnalyticsData {
  predictiveMetrics: any[];
  trends: any[];
  geographicData: any[];
  conversionData: any[];
}

const AdvancedAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsType, setAnalyticsType] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    predictiveMetrics: [],
    trends: [],
    geographicData: [],
    conversionData: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API
      const mockData: AnalyticsData = {
        predictiveMetrics: generatePredictiveData(),
        trends: generateTrendData(),
        geographicData: generateGeographicData(),
        conversionData: generateConversionData(),
      };
      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generators
  const generatePredictiveData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: `Month ${i + 1}`,
      actual: Math.floor(Math.random() * 1000),
      predicted: Math.floor(Math.random() * 1000),
      confidence: Math.floor(Math.random() * 100),
    }));
  };

  const generateTrendData = () => {
    return Array.from({ length: 6 }, (_, i) => ({
      category: `Category ${i + 1}`,
      current: Math.floor(Math.random() * 100),
      previous: Math.floor(Math.random() * 100),
      growth: Math.floor(Math.random() * 50) - 25,
    }));
  };

  const generateGeographicData = () => {
    return Array.from({ length: 5 }, (_, i) => ({
      region: `Region ${i + 1}`,
      value: Math.floor(Math.random() * 100),
      ambassadors: Math.floor(Math.random() * 50),
      tasks: Math.floor(Math.random() * 200),
    }));
  };

  const generateConversionData = () => {
    return Array.from({ length: 5 }, (_, i) => ({
      stage: `Stage ${i + 1}`,
      users: Math.floor(Math.random() * 1000) * (1 - i * 0.2),
      rate: Math.floor(Math.random() * 100),
    }));
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
        <Typography variant="h4">Advanced Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup size="small">
            <Button
              variant={timeRange === 'week' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
            <Button
              variant={timeRange === 'year' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('year')}
            >
              Year
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      <Tabs
        value={analyticsType}
        onChange={(_, newValue) => setAnalyticsType(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Performance Prediction" value="performance" />
        <Tab label="Trend Analysis" value="trends" />
        <Tab label="Geographic Distribution" value="geographic" />
        <Tab label="Conversion Funnel" value="conversion" />
      </Tabs>

      <Grid container spacing={3}>
        {analyticsType === 'performance' && (
          <>
            {/* Predictive Performance Chart */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Performance Prediction
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.predictiveMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Confidence Metrics */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Prediction Confidence
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.predictiveMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="confidence" fill="#8884d8" name="Confidence %" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </>
        )}

        {analyticsType === 'trends' && (
          <>
            {/* Trend Analysis */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Category Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#8884d8" name="Current Period" />
                    <Bar dataKey="previous" fill="#82ca9d" name="Previous Period" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Growth Rates */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Growth Rates
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="growth"
                      fill={(entry) => (entry.growth >= 0 ? '#82ca9d' : '#ff7043')}
                      name="Growth Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </>
        )}

        {analyticsType === 'geographic' && (
          <>
            {/* Geographic Distribution */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Regional Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ambassadors" name="Ambassadors" />
                    <YAxis dataKey="tasks" name="Tasks" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      name="Regions"
                      data={data.geographicData}
                      fill="#8884d8"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Regional Performance */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Regional Performance
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data.geographicData}
                      dataKey="value"
                      nameKey="region"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {data.geographicData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </>
        )}

        {analyticsType === 'conversion' && (
          <>
            {/* Conversion Funnel */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Conversion Funnel
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data.conversionData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8">
                      {data.conversionData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            {/* Conversion Rates */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Stage Conversion Rates
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AdvancedAnalytics;
