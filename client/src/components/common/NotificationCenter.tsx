import React from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationAsRead, clearNotifications } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: string) => {
    markNotificationAsRead(id);
    // Handle navigation or action based on notification type
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'success':
        return <CheckIcon color="success" />;
      default:
        return <CircleIcon />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`${unreadCount} unread notifications`}
      >
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
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No notifications" />
          </MenuItem>
        ) : (
          <>
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle1">Notifications</Typography>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  clearNotifications();
                  handleClose();
                }}
              >
                Clear all
              </Typography>
            </Box>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                sx={{
                  backgroundColor: notification.read ? 'inherit' : 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={formatDistanceToNow(notification.createdAt, {
                    addSuffix: true,
                  })}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      ml: 1,
                    }}
                  />
                )}
              </MenuItem>
            ))}
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
