import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Avatar,
  AvatarGroup,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  averageApplicationRate: number;
  completionRate: number;
}

interface Job {
  id: string;
  title: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  applications: number;
  startDate: Date;
  endDate?: Date;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  applicants: {
    id: string;
    name: string;
    avatar?: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

const CompanyDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    averageApplicationRate: 0,
    completionRate: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    // Fetch company dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/company/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching company stats:', error);
      }
    };

    // Fetch company jobs
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/company/jobs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setJobs(data.map((job: any) => ({
          ...job,
          startDate: new Date(job.startDate),
          endDate: job.endDate ? new Date(job.endDate) : undefined,
        })));
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchStats();
    fetchJobs();
  }, []);

  const handleCreateJob = () => {
    navigate('/company/jobs/create');
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setOpenDialog(true);
  };

  const handleEditJob = (jobId: string) => {
    navigate(`/company/jobs/${jobId}/edit`);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/company/jobs/${jobId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setJobs(jobs.filter(job => job.id !== jobId));
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon />;
      case 'pending':
        return <ScheduleIcon />;
      case 'cancelled':
        return <BlockIcon />;
      default:
        return null;
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
                Active Jobs
              </Typography>
              <Typography variant="h4">{stats.activeJobs}</Typography>
              <Typography variant="body2" color="textSecondary">
                of {stats.totalJobs} total jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Applications
              </Typography>
              <Typography variant="h4">{stats.totalApplications}</Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.pendingApplications} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Application Rate
              </Typography>
              <Typography variant="h4">{stats.averageApplicationRate}%</Typography>
              <LinearProgress
                variant="determinate"
                value={stats.averageApplicationRate}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h4">{stats.completionRate}%</Typography>
              <LinearProgress
                variant="determinate"
                value={stats.completionRate}
                sx={{ mt: 1 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Jobs Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Jobs</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateJob}
              >
                Create Job
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applications</TableCell>
                    <TableCell>Timeline</TableCell>
                    <TableCell>Applicants</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Typography variant="body1">{job.title}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {job.budget.currency} {job.budget.min}-{job.budget.max}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={job.status}
                          color={getStatusColor(job.status) as any}
                          icon={getStatusIcon(job.status)}
                        />
                      </TableCell>
                      <TableCell>{job.applications}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          Start: {job.startDate.toLocaleDateString()}
                        </Typography>
                        {job.endDate && (
                          <Typography variant="caption" display="block">
                            End: {job.endDate.toLocaleDateString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <AvatarGroup max={3}>
                          {job.applicants.map((applicant) => (
                            <Avatar
                              key={applicant.id}
                              alt={applicant.name}
                              src={applicant.avatar}
                              sx={{ width: 24, height: 24 }}
                            />
                          ))}
                        </AvatarGroup>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewJob(job)}
                          aria-label="view job"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditJob(job.id)}
                          aria-label="edit job"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteJob(job.id)}
                          aria-label="delete job"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {jobs.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="textSecondary">
                  No jobs found. Create your first job to get started!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateJob}
                  sx={{ mt: 2 }}
                >
                  Create Job
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Job Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              {selectedJob.title}
              <Chip
                size="small"
                label={selectedJob.status}
                color={getStatusColor(selectedJob.status) as any}
                sx={{ ml: 1 }}
              />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Budget
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.budget.currency} {selectedJob.budget.min}-{selectedJob.budget.max}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Timeline
                  </Typography>
                  <Typography variant="body1">
                    {selectedJob.startDate.toLocaleDateString()} - 
                    {selectedJob.endDate?.toLocaleDateString() || 'Ongoing'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Applicants ({selectedJob.applicants.length})
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedJob.applicants.map((applicant) => (
                      <Chip
                        key={applicant.id}
                        avatar={<Avatar alt={applicant.name} src={applicant.avatar} />}
                        label={applicant.name}
                        variant="outlined"
                        color={
                          applicant.status === 'approved'
                            ? 'success'
                            : applicant.status === 'rejected'
                            ? 'error'
                            : 'default'
                        }
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => handleEditJob(selectedJob.id)}
              >
                Edit Job
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CompanyDashboard;
