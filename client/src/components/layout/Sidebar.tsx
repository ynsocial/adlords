import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  roles: string[];
}

const navItems: NavItem[] = [
  // Admin Navigation
  {
    label: 'Admin Dashboard',
    path: '/admin',
    icon: <DashboardIcon />,
    roles: ['admin'],
  },
  {
    label: 'Ambassador Management',
    path: '/admin/ambassadors',
    icon: <PeopleIcon />,
    roles: ['admin'],
  },
  {
    label: 'Company Management',
    path: '/admin/companies',
    icon: <BusinessIcon />,
    roles: ['admin'],
  },
  {
    label: 'Job Management',
    path: '/admin/jobs',
    icon: <WorkIcon />,
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    path: '/admin/analytics',
    icon: <AssessmentIcon />,
    roles: ['admin'],
  },

  // Company Navigation
  {
    label: 'Company Dashboard',
    path: '/company',
    icon: <DashboardIcon />,
    roles: ['company'],
  },
  {
    label: 'Post New Job',
    path: '/company/jobs/new',
    icon: <WorkIcon />,
    roles: ['company'],
  },
  {
    label: 'Applications',
    path: '/company/applications',
    icon: <HistoryIcon />,
    roles: ['company'],
  },
  {
    label: 'Company Analytics',
    path: '/company/analytics',
    icon: <AssessmentIcon />,
    roles: ['company'],
  },

  // Ambassador Navigation
  {
    label: 'Ambassador Dashboard',
    path: '/ambassador',
    icon: <DashboardIcon />,
    roles: ['ambassador'],
  },
  {
    label: 'Find Jobs',
    path: '/ambassador/jobs',
    icon: <SearchIcon />,
    roles: ['ambassador'],
  },
  {
    label: 'My Applications',
    path: '/ambassador/applications',
    icon: <HistoryIcon />,
    roles: ['ambassador'],
  },
  {
    label: 'Performance',
    path: '/ambassador/performance',
    icon: <AssessmentIcon />,
    roles: ['ambassador'],
  },
];

// Shared navigation items for all authenticated users
const sharedNavItems: NavItem[] = [
  {
    label: 'Profile',
    path: '/profile',
    icon: <PersonIcon />,
    roles: ['admin', 'company', 'ambassador'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    roles: ['admin', 'company', 'ambassador'],
  },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          {user.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {sharedNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
