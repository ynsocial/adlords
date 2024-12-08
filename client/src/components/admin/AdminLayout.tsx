import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  WorkOutline as JobIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const menuItems = [
    {
      text: 'Admin Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard',
    },
    {
      text: 'Ambassador Management',
      icon: <PeopleIcon />,
      path: '/admin/ambassadors',
    },
    {
      text: 'Company Management',
      icon: <BusinessIcon />,
      path: '/admin/companies',
    },
    {
      text: 'Jobs',
      icon: <JobIcon />,
      path: '/admin/jobs',
    },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon />
          <Typography variant="h6" component="div">
            Admin Panel
          </Typography>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={RouterLink}
              to={item.path}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
