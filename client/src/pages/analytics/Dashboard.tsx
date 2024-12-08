import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Assignment as TaskIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi } from '../../services/api';
import StatCard from '../../components/charts/StatCard';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [ambassadorData, setAmbassadorData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        dashboardStats,
        revenueStats,
        referralStats,
        serviceStats,
        ambassadorStats,
      ] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getRevenueStats(period),
        analyticsApi.getReferralStats({}),
        analyticsApi.getServicePerformance(period),
        analyticsApi.getAmbassadorPerformance(period),
      ]);

      setStats(dashboardStats);
      setRevenueData(revenueStats.data);
      setReferralData(referralStats.data);
      setServiceData(serviceStats.data);
      setAmbassadorData(ambassadorStats.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Analytics Dashboard</Typography>
        <FormControl size="small" sx={{ width: 150 }}>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Ambassadors"
            value={stats.totalAmbassadors}
            trend={stats.ambassadorGrowth}
            loading={loading}
            icon={<PeopleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue?.toLocaleString()}`}
            trend={stats.revenueGrowth}
            loading={loading}
            icon={<MoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tasks"
            value={stats.activeTasks}
            trend={stats.taskGrowth}
            loading={loading}
            icon={<TaskIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Rating"
            value={stats.averageRating?.toFixed(1)}
            trend={stats.ratingGrowth}
            loading={loading}
            icon={<StarIcon />}
          />
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Revenue Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Services
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={theme.palette.primary.main}>
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Referral Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={referralData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {referralData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Performing Ambassadors
            </Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
              >
                <Tab label="By Revenue" />
                <Tab label="By Referrals" />
                <Tab label="By Rating" />
              </Tabs>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={ambassadorData}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar
                  dataKey={activeTab === 0 ? 'revenue' : activeTab === 1 ? 'referrals' : 'rating'}
                  fill={theme.palette.primary.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
