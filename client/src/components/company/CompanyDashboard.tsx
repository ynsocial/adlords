import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  AttachMoney as MoneyIcon,
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
import { companyApi } from '../../services/api';

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

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalViews: 0,
    totalClicks: 0,
    conversionRate: 0,
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, jobsResponse, applicationsResponse] = await Promise.all([
        companyApi.getStats(),
        companyApi.getJobs(),
        companyApi.getApplications(),
      ]);

      setStats(statsResponse.data);
      setJobs(jobsResponse.data);
      setApplications(applicationsResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      enqueueSnackbar('Failed to fetch dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await companyApi.deleteJob(jobId);
      setJobs((prevJobs) => prevJobs.filter((job: any) => job.id !== jobId));
      enqueueSnackbar('Job deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to delete job', { variant: 'error' });
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      await companyApi.updateApplicationStatus(applicationId, status);
      setApplications((prevApplications) =>
        prevApplications.map((app: any) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );
      enqueueSnackbar('Application status updated', { variant: 'success' });
      setApplicationDialogOpen(false);
    } catch (err) {
      enqueueSnackbar('Failed to update application status', { variant: 'error' });
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ color, mr: 1 }} />
          <Typography color="textSecondary">{title}</Typography>
        </Box>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Company Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/company/jobs/new')}
        >
          Post New Job
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
            title="Total Jobs"
            value={stats.totalJobs}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PersonIcon}
            title="Total Applications"
            value={stats.totalApplications}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={VisibilityIcon}
            title="Total Views"
            value={stats.totalViews}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MoneyIcon}
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
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
          <Tab label="Jobs" />
          <Tab label="Applications" />
          <Tab label="Analytics" />
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
              {/* Job Performance Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Job Performance
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={jobs}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="title" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" fill="#8884d8" name="Views" />
                        <Bar dataKey="applications" fill="#82ca9d" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Application Trends Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Application Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={applications}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#8884d8"
                          name="Applications"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Jobs Tab */}
          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Posted Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applications</TableCell>
                    <TableCell>Views</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.status}
                          color={
                            job.status === 'approved'
                              ? 'success'
                              : job.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{job.applicationCount}</TableCell>
                      <TableCell>{job.viewCount}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedJob(job);
                            setJobDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/company/jobs/edit/${job.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Applications Tab */}
          <TabPanel value={activeTab} index={2}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application: any) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.applicant.name}</TableCell>
                      <TableCell>{application.job.title}</TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={application.status}
                          color={
                            application.status === 'approved'
                              ? 'success'
                              : application.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedApplication(application);
                            setApplicationDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={jobs}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="title" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="views"
                          fill="#8884d8"
                          name="Views"
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="applications"
                          fill="#82ca9d"
                          name="Applications"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="conversionRate"
                          fill="#ffc658"
                          name="Conversion Rate (%)"
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

      {/* Job Details Dialog */}
      <Dialog
        open={jobDialogOpen}
        onClose={() => setJobDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>{selectedJob.title}</DialogTitle>
            <DialogContent>
              {/* Job details content */}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setJobDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => navigate(`/company/jobs/edit/${selectedJob.id}`)}
              >
                Edit Job
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle>Application Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Applicant</Typography>
                  <Typography>{selectedApplication.applicant.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Job</Typography>
                  <Typography>{selectedApplication.job.title}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Applied Date</Typography>
                  <Typography>
                    {new Date(selectedApplication.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip
                    label={selectedApplication.status}
                    color={
                      selectedApplication.status === 'approved'
                        ? 'success'
                        : selectedApplication.status === 'pending'
                        ? 'warning'
                        : 'error'
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Update Status"
                    value={selectedApplication.status}
                    onChange={(e) =>
                      handleUpdateApplicationStatus(
                        selectedApplication.id,
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApplicationDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CompanyDashboard;
