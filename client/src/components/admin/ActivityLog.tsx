import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  IconButton,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

interface Activity {
  id: string;
  type: 'ambassador' | 'company' | 'task' | 'system';
  action: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    role: string;
  };
}

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    // Mock activities - replace with actual API call
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'ambassador',
        action: 'Ambassador Approved',
        description: 'New ambassador John Doe was approved',
        timestamp: new Date(),
        user: {
          name: 'Admin User',
          role: 'admin',
        },
      },
      {
        id: '2',
        type: 'company',
        action: 'Company Updated',
        description: 'Travel Med Corp updated their profile',
        timestamp: new Date(Date.now() - 3600000),
        user: {
          name: 'Company Manager',
          role: 'manager',
        },
      },
      {
        id: '3',
        type: 'task',
        action: 'Task Completed',
        description: 'Health consultation #123 was marked as complete',
        timestamp: new Date(Date.now() - 7200000),
        user: {
          name: 'Sarah Smith',
          role: 'ambassador',
        },
      },
    ];

    setActivities(mockActivities);
  }, []);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    handleFilterClose();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ambassador':
        return <PersonIcon />;
      case 'company':
        return <BusinessIcon />;
      case 'task':
        return <TaskIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const getTimelineDotColor = (type: string) => {
    switch (type) {
      case 'ambassador':
        return 'primary';
      case 'company':
        return 'success';
      case 'task':
        return 'warning';
      default:
        return 'grey';
    }
  };

  const filteredActivities = activities.filter(activity => 
    selectedFilter === 'all' ? true : activity.type === selectedFilter
  );

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Activity Log</Typography>
        <Box>
          <Button
            size="small"
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
          >
            {selectedFilter === 'all' ? 'All Activities' : selectedFilter}
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={() => handleFilterSelect('all')}>All Activities</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('ambassador')}>Ambassador</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('company')}>Company</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('task')}>Task</MenuItem>
            <MenuItem onClick={() => handleFilterSelect('system')}>System</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Timeline>
        {filteredActivities.map((activity) => (
          <TimelineItem key={activity.id}>
            <TimelineOppositeContent color="text.secondary">
              {new Date(activity.timestamp).toLocaleString()}
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineDot color={getTimelineDotColor(activity.type)}>
                {getActivityIcon(activity.type)}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            
            <TimelineContent>
              <Typography variant="subtitle2" component="span">
                {activity.action}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activity.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                by {activity.user.name} ({activity.user.role})
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      {filteredActivities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">No activities found</Typography>
        </Box>
      )}

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button size="small">View All Activities</Button>
      </Box>
    </Card>
  );
};

export default ActivityLog;
