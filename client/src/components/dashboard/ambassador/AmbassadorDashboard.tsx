import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Badge,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Work as WorkIcon,
  Assignment as TaskIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

interface AmbassadorStats {
  totalEarnings: number;
  completedJobs: number;
  activeJobs: number;
  rating: number;
  tasksCompleted: number;
  totalTasks: number;
  upcomingDeadlines: number;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  appliedAt: Date;
  deadline?: Date;
  tasks: {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate: Date;
  }[];
}

const AmbassadorDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<AmbassadorStats>({
    totalEarnings: 0,
    completedJobs: 0,
    activeJobs: 0,
    rating: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    upcomingDeadlines: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Fetch ambassador dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ambassador/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching ambassador stats:', error);
      }
    };

    // Fetch applications
    const fetchApplications = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ambassador/applications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setApplications(data.map((app: any) => ({
          ...app,
          appliedAt: new Date(app.appliedAt),
          deadline: app.deadline ? new Date(app.deadline) : undefined,
          tasks: app.tasks.map((task: any) => ({
            ...task,
            dueDate: new Date(task.dueDate),
          })),
        })));
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };

    fetchStats();
    fetchApplications();

    // Set up WebSocket listeners for real-time updates
    const socket = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:4000');
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'APPLICATION_UPDATE') {
        // Update application status in real-time
        setApplications(prev => prev.map(app => 
          app.id === data.applicationId ? { ...app, ...data.updates } : app
        ));
      } else if (data.type === 'TASK_UPDATE') {
        // Update task status in real-time
        setApplications(prev => prev.map(app => ({
          ...app,
          tasks: app.tasks.map(task =>
            task.id === data.taskId ? { ...task, ...data.updates } : task
          ),
        })));
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setOpenDialog(true);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/ambassador/applications/${applicationId}/withdraw`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setApplications(prev => prev.map(app =>
          app.id === applicationId ? { ...app, status: 'withdrawn' } : app
        ));
      } catch (error) {
        console.error('Error withdrawing application:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'withdrawn':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ width: 64, height: 64, mr: 2 }}
                  src={user?.avatar}
                >
                  {user?.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {[...Array(5)].map((_, index) => (
                      <StarIcon
                        key={index}
                        sx={{
                          color: index < Math.floor(stats.rating)
                            ? theme.palette.warning.main
                            : theme.palette.grey[300],
                          fontSize: 20,
                        }}
                      />
                    ))}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({stats.rating.toFixed(1)})
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Earnings"
                    secondary={`$${stats.totalEarnings.toLocaleString()}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Jobs"
                    secondary={`${stats.completedJobs} completed, ${stats.activeJobs} active`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TaskIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tasks"
                    secondary={`${stats.tasksCompleted} of ${stats.totalTasks} completed`}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={(stats.tasksCompleted / stats.totalTasks) * 100}
                    sx={{ width: 100, ml: 2 }}
                  />
                </ListItem>
              </List>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                fullWidth
                onClick={() => navigate('/ambassador/profile')}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Applications and Tasks */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab
                label={
                  <Badge
                    badgeContent={applications.filter(app => app.status === 'pending').length}
                    color="warning"
                  >
                    Applications
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge
                    badgeContent={stats.upcomingDeadlines}
                    color="error"
                  >
                    Tasks
                  </Badge>
                }
              />
            </Tabs>
            <Box sx={{ p: 2 }}>
              {tabValue === 0 ? (
                <List>
                  {applications.map((application) => (
                    <ListItem
                      key={application.id}
                      sx={{
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemIcon>
                        <Avatar src={application.company.logo}>
                          {application.company.name[0]}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {application.jobTitle}
                            <Chip
                              size="small"
                              label={application.status}
                              color={getStatusColor(application.status) as any}
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {application.company.name} • Applied {formatDistanceToNow(application.appliedAt, { addSuffix: true })}
                            </Typography>
                            {application.deadline && (
                              <Typography variant="caption" color="error">
                                Deadline: {format(application.deadline, 'PPP')}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="View Details">
                          <IconButton
                            edge="end"
                            onClick={() => handleViewApplication(application)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {application.status === 'pending' && (
                          <Tooltip title="Withdraw Application">
                            <IconButton
                              edge="end"
                              onClick={() => handleWithdrawApplication(application.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {applications.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="textSecondary">
                        No applications found. Start applying to jobs!
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<WorkIcon />}
                        onClick={() => navigate('/ambassador/jobs')}
                        sx={{ mt: 2 }}
                      >
                        Browse Jobs
                      </Button>
                    </Box>
                  )}
                </List>
              ) : (
                <List>
                  {applications.flatMap(app => app.tasks).map((task) => (
                    <ListItem
                      key={task.id}
                      sx={{
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemIcon>
                        <TaskIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {task.title}
                            <Chip
                              size="small"
                              label={task.status}
                              color={getTaskStatusColor(task.status) as any}
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="error">
                            Due: {format(task.dueDate, 'PPP')}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {applications.flatMap(app => app.tasks).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="textSecondary">
                        No tasks assigned yet.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Application Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle>
              {selectedApplication.jobTitle}
              <Chip
                size="small"
                label={selectedApplication.status}
                color={getStatusColor(selectedApplication.status) as any}
                sx={{ ml: 1 }}
              />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Company
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Avatar src={selectedApplication.company.logo} sx={{ mr: 1 }}>
                      {selectedApplication.company.name[0]}
                    </Avatar>
                    <Typography variant="body1">
                      {selectedApplication.company.name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Applied
                  </Typography>
                  <Typography variant="body1">
                    {format(selectedApplication.appliedAt, 'PPP')}
                  </Typography>
                </Grid>
                {selectedApplication.deadline && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Deadline
                    </Typography>
                    <Typography variant="body1" color="error">
                      {format(selectedApplication.deadline, 'PPP')}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Tasks ({selectedApplication.tasks.length})
                  </Typography>
                  <List dense>
                    {selectedApplication.tasks.map((task) => (
                      <ListItem key={task.id}>
                        <ListItemIcon>
                          {task.status === 'completed' ? (
                            <CheckCircleIcon color="success" />
                          ) : task.status === 'in_progress' ? (
                            <ScheduleIcon color="info" />
                          ) : (
                            <WarningIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={`Due: ${format(task.dueDate, 'PPP')}`}
                        />
                        <Chip
                          size="small"
                          label={task.status}
                          color={getTaskStatusColor(task.status) as any}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
              {selectedApplication.status === 'pending' && (
                <Button
                  color="error"
                  onClick={() => {
                    handleWithdrawApplication(selectedApplication.id);
                    setOpenDialog(false);
                  }}
                >
                  Withdraw Application
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AmbassadorDashboard;
