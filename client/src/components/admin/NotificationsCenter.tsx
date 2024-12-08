import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as TaskIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'ambassador' | 'company' | 'task' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Mock notifications - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'ambassador',
        title: 'New Ambassador Registration',
        message: 'John Doe has registered as a new ambassador',
        timestamp: new Date(),
        read: false,
        priority: 'high',
      },
      {
        id: '2',
        type: 'company',
        title: 'Company Update Required',
        message: 'Travel Med Corp needs to update their documentation',
        timestamp: new Date(),
        read: false,
        priority: 'medium',
      },
      {
        id: '3',
        type: 'task',
        title: 'Urgent Task Completion',
        message: 'Health consultation task #123 is pending review',
        timestamp: new Date(),
        read: false,
        priority: 'high',
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ambassador':
        return <PersonIcon />;
      case 'company':
        return <BusinessIcon />;
      case 'task':
        return <TaskIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <WarningIcon color="error" />;
      case 'medium':
        return <InfoIcon color="warning" />;
      case 'low':
        return <SuccessIcon color="success" />;
      default:
        return null;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Button size="small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        </Box>
        <Divider />
        
        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.read ? 'inherit' : 'action.hover',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    {notification.read ? <DeleteIcon /> : getPriorityIcon(notification.priority)}
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
        
        {notifications.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        )}
        
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" onClick={handleClose}>
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationsCenter;
