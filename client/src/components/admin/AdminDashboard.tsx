import React, { useState } from 'react';
import {
  Box,
  Grid,
  Tabs,
  Tab,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import CompanyApprovals from './CompanyApprovals';
import NotificationsCenter from './NotificationsCenter';
import ActivityLog from './ActivityLog';
import BulkOperations from './operations/BulkOperations';
import AuditSystem from './audit/AuditSystem';
import PerformanceMonitor from './monitoring/PerformanceMonitor';
import AdvancedAnalytics from './analytics/AdvancedAnalytics';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <ShieldIcon sx={{ mr: 2, color: 'primary.main', fontSize: '2rem' }} />
        <Typography variant="h4">Admin Dashboard</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Notifications">
          <IconButton color="primary">
            <NotificationsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
            },
          }}
        >
          <Tab
            icon={<PeopleIcon />}
            label="Ambassador Management"
            iconPosition="start"
          />
          <Tab
            icon={<BusinessIcon />}
            label="Company Management"
            iconPosition="start"
          />
          <Tab
            icon={<WorkIcon />}
            label="Job Postings"
            iconPosition="start"
          />
          <Tab
            icon={<AssessmentIcon />}
            label="Analytics"
            iconPosition="start"
          />
          <Tab
            icon={<HistoryIcon />}
            label="Activity Log"
            iconPosition="start"
          />
          <Tab
            icon={<SpeedIcon />}
            label="Performance"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Ambassador Management */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <BulkOperations entityType="ambassador" />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Company Management */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CompanyApprovals />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Job Postings */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <BulkOperations entityType="job" />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AdvancedAnalytics />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Activity Log */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <ActivityLog />
          </Grid>
          <Grid item xs={12} md={4}>
            <NotificationsCenter />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance */}
      <TabPanel value={activeTab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <PerformanceMonitor />
          </Grid>
          <Grid item xs={12} md={4}>
            <AuditSystem />
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AdminDashboard;
