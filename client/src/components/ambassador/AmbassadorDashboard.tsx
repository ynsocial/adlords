import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Assignment as TaskIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { StatCard } from '../charts/StatCard';
import { ambassadorApi } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AmbassadorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalEarnings: 0,
    hoursWorked: 0,
    tasksCompleted: 0,
    upcomingTasks: 0,
    averageRating: 0,
  });
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, applicationsResponse, tasksResponse, earningsResponse] =
        await Promise.all([
          ambassadorApi.getStats(),
          ambassadorApi.getApplications(),
          ambassadorApi.getTasks(),
          ambassadorApi.getEarnings(),
        ]);

      setStats(statsResponse.data);
      setApplications(applicationsResponse.data);
      setTasks(tasksResponse.data);
      setEarnings(earningsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      enqueueSnackbar('Failed to fetch dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Ambassador Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<WorkIcon />}
          onClick={() => navigate('/jobs')}
        >
          Browse Jobs
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={WorkIcon}
            title="Total Applications"
            value={stats.totalApplications}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MoneyIcon}
            title="Total Earnings"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TimeIcon}
            title="Hours Worked"
            value={stats.hoursWorked}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TaskIcon}
            title="Tasks Completed"
            value={stats.tasksCompleted}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Dashboard Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Applications" />
          <Tab label="Tasks" />
          <Tab label="Earnings" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Performance Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={tasks}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="tasksCompleted"
                          stroke="#8884d8"
                          name="Tasks"
                        />
                        <Line
                          type="monotone"
                          dataKey="hoursWorked"
                          stroke="#82ca9d"
                          name="Hours"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Earnings Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Earnings Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={earnings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="amount" fill="#8884d8" name="Earnings ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Applications Tab */}
          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application: any) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.jobTitle}</TableCell>
                      <TableCell>{application.company}</TableCell>
                      <TableCell>
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={application.status}
                          color={
                            application.status === 'accepted'
                              ? 'success'
                              : application.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/jobs/${application.jobId}`)
                          }
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tasks Tab */}
          <TabPanel value={activeTab} index={2}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.company}</TableCell>
                      <TableCell>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status}
                          color={
                            task.status === 'completed'
                              ? 'success'
                              : task.status === 'in-progress'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{task.hours}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Earnings Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Earnings History
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={earnings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="amount"
                          fill="#8884d8"
                          name="Earnings ($)"
                        />
                        <Bar
                          dataKey="bonus"
                          fill="#82ca9d"
                          name="Bonus ($)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default AmbassadorDashboard;
