import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Avatar,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../services/api';
import StatCard from '../../components/charts/StatCard';

const ProfileOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        profileApi.getCurrentUser(),
        profileApi.getProfileStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={profile?.avatar}
                sx={{ width: 100, height: 100, mr: 3 }}
              />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4">
                      {profile?.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {profile?.role}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate('/profile/edit')}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={profile?.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={profile?.phone || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Location"
                  secondary={profile?.location || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LanguageIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Languages"
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {profile?.languages?.map((lang: string) => (
                        <Chip key={lang} label={lang} size="small" />
                      ))}
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </Card>
        </Grid>

        {/* Stats */}
        {user?.role === 'ambassador' && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Referrals"
                value={stats?.totalReferrals || 0}
                trend={stats?.referralGrowth}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Earnings"
                value={`$${stats?.totalEarnings?.toLocaleString() || 0}`}
                trend={stats?.earningsGrowth}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Success Rate"
                value={`${stats?.successRate || 0}%`}
                trend={stats?.successRateGrowth}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Tasks"
                value={stats?.activeTasks || 0}
                trend={stats?.taskGrowth}
              />
            </Grid>
          </>
        )}

        {/* Bio */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              About
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profile?.bio || 'No bio provided'}
            </Typography>
          </Card>
        </Grid>

        {/* Specialties */}
        {user?.role === 'ambassador' && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Specialties
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile?.specialties?.map((specialty: string) => (
                  <Chip
                    key={specialty}
                    label={specialty}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProfileOverview;
