import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
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
} from 'recharts';
import { useAuth } from '../../../context/AuthContext';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalAmbassadors: number;
  activeAmbassadors: number;
  totalCompanies: number;
  pendingApprovals: number;
  weeklyApplications: number;
  conversionRate: number;
}

interface PendingItem {
  id: string;
  type: 'job' | 'application' | 'company' | 'ambassador';
  title: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'flagged';
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalAmbassadors: 0,
    activeAmbassadors: 0,
    totalCompanies: 0,
    pendingApprovals: 0,
    weeklyApplications: 0,
    conversionRate: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    // Fetch pending items
    const fetchPendingItems = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/dashboard/pending`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setPendingItems(data.map((item: any) => ({
          ...item,
          submittedAt: new Date(item.submittedAt),
        })));
      } catch (error) {
        console.error('Error fetching pending items:', error);
      }
    };

    // Fetch activity data
    const fetchActivityData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/dashboard/activity`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setActivityData(data);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };

    fetchStats();
    fetchPendingItems();
    fetchActivityData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApprove = async (id: string, type: string) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/admin/${type}/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPendingItems(items => items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error approving item:', error);
    }
  };

  const handleReject = async (id: string, type: string) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/admin/${type}/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPendingItems(items => items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error rejecting item:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Jobs
              </Typography>
              <Typography variant="h4">{stats.totalJobs}</Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.activeJobs} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Ambassadors
              </Typography>
              <Typography variant="h4">{stats.totalAmbassadors}</Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.activeAmbassadors} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Weekly Applications
              </Typography>
              <Typography variant="h4">{stats.weeklyApplications}</Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.conversionRate}% conversion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Approvals
              </Typography>
              <Typography variant="h4">{stats.pendingApprovals}</Typography>
              <Typography variant="body2" color="textSecondary">
                Requires attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Applications" />
                <Tab label="Jobs" />
                <Tab label="Users" />
              </Tabs>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                {tabValue === 0 ? (
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="applications" stroke={theme.palette.primary.main} />
                  </LineChart>
                ) : tabValue === 1 ? (
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="jobs" fill={theme.palette.primary.main} />
                  </BarChart>
                ) : (
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke={theme.palette.primary.main} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Approvals</Typography>
              <IconButton size="small" onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.submittedBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={item.status === 'flagged' ? <WarningIcon /> : undefined}
                          label={item.status}
                          color={item.status === 'flagged' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(item.id, item.type)}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleReject(item.id, item.type)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {pendingItems.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  No pending items
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
