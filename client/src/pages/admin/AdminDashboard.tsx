import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '../../components/charts/StatCard';
import { analyticsApi } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ambassadorStats, setAmbassadorStats] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, revenue, ambassadors, services] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getRevenueStats('month'),
        analyticsApi.getAmbassadorPerformance('month'),
        analyticsApi.getServicePerformance('month'),
      ]);

      setStats(dashboardStats);
      setRevenueData(revenue.data);
      setAmbassadorStats(ambassadors.data);
      setServiceDistribution(services.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Ambassadors"
            value={stats?.totalAmbassadors}
            trend={stats?.ambassadorGrowth}
            icon={<PeopleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Companies"
            value={stats?.totalCompanies}
            trend={stats?.companyGrowth}
            icon={<BusinessIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats?.monthlyRevenue?.toLocaleString()}`}
            trend={stats?.revenueGrowth}
            icon={<MoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tasks"
            value={stats?.activeTasks}
            trend={stats?.taskGrowth}
            icon={<TaskIcon />}
          />
        </Grid>

        {/* Revenue Chart */}
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
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Ambassador Performance */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Performing Ambassadors
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ambassadorStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="earnings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Service Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Service Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
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
                  {serviceDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PeopleIcon />}
                href="/admin/ambassadors"
              >
                Manage Ambassadors
              </Button>
              <Button
                variant="contained"
                startIcon={<BusinessIcon />}
                href="/admin/companies"
              >
                Manage Companies
              </Button>
              <Button
                variant="contained"
                startIcon={<TaskIcon />}
                href="/admin/jobs/new"
              >
                Create New Job
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
