import React, { useState, useMemo } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../common/NotificationCenter';

const drawerWidth = 240;

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
  };

  const menuItems = useMemo(() => {
    const baseItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: `/${user?.role}/dashboard` },
      { text: 'Profile', icon: <PersonIcon />, path: `/${user?.role}/profile` },
    ];

    const roleSpecificItems = {
      admin: [
        { text: 'Companies', icon: <BusinessIcon />, path: '/admin/companies' },
        { text: 'Ambassadors', icon: <PeopleIcon />, path: '/admin/ambassadors' },
        { text: 'Jobs', icon: <WorkIcon />, path: '/admin/jobs' },
        { text: 'Analytics', icon: <BarChartIcon />, path: '/admin/analytics' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
      ],
      company: [
        { text: 'Jobs', icon: <WorkIcon />, path: '/company/jobs' },
        { text: 'Ambassadors', icon: <PeopleIcon />, path: '/company/ambassadors' },
        { text: 'Analytics', icon: <BarChartIcon />, path: '/company/analytics' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/company/settings' },
      ],
      ambassador: [
        { text: 'Available Jobs', icon: <WorkIcon />, path: '/ambassador/jobs' },
        { text: 'My Applications', icon: <AssignmentIcon />, path: '/ambassador/applications' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/ambassador/settings' },
      ],
    };

    return [...baseItems, ...(roleSpecificItems[user?.role as keyof typeof roleSpecificItems] || [])];
  }, [user?.role]);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Travel Health
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                handleDrawerToggle();
              }
            }}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : undefined }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationCenter />
          <IconButton
            onClick={handleProfileMenuOpen}
            size="large"
            edge="end"
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.firstName?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => {
              navigate(`/${user?.role}/profile`);
              handleProfileMenuClose();
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => {
              navigate(`/${user?.role}/settings`);
              handleProfileMenuClose();
            }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              handleLogout();
              handleProfileMenuClose();
            }}>
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
