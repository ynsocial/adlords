import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../services/api';

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
];

const specialties = [
  'Recovery Services',
  'Sports Performance',
  'Wellness Packages',
  'Holistic Health',
  'Preventative Care',
  'Aesthetic Services',
  'Dental Implants',
  'Joint Surgeries',
  'Teeth Whitening',
  'Skincare',
];

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  location: Yup.string(),
  bio: Yup.string().max(500, 'Bio must be less than 500 characters'),
  languages: Yup.array().min(1, 'At least one language is required'),
  specialties: Yup.array().when('role', {
    is: 'ambassador',
    then: Yup.array().min(1, 'At least one specialty is required'),
  }),
});

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      languages: [] as string[],
      specialties: [] as string[],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        // Handle avatar upload if changed
        let avatarUrl = user?.avatar;
        if (avatarFile) {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          avatarUrl = await profileApi.uploadAvatar(formData);
        }

        // Update profile
        await profileApi.updateProfile({
          ...values,
          avatar: avatarUrl,
        });

        // Update context if name changed
        if (values.name !== user?.name) {
          updateUser({ ...user, name: values.name });
        }

        navigate('/profile');
      } catch (err: any) {
        setError(err.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileApi.getCurrentUser();
      formik.setValues({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        languages: profile.languages || [],
        specialties: profile.specialties || [],
      });
      setAvatarPreview(profile.avatar);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading && !formik.values.name) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Edit Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Avatar Upload */}
          <Grid item xs={12}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload">
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={avatarPreview || user?.avatar}
                    sx={{ width: 120, height: 120, mb: 2 }}
                  />
                  <IconButton
                    color="primary"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: -8,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </Box>
              </label>
              <Typography variant="body2" color="text.secondary">
                Allowed formats: JPG, PNG. Max size: 2MB
              </Typography>
            </Card>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="name"
                    label="Name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="phone"
                    label="Phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="location"
                    label="Location"
                    value={formik.values.location}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="bio"
                    label="Bio"
                    value={formik.values.bio}
                    onChange={formik.handleChange}
                    error={formik.touched.bio && Boolean(formik.errors.bio)}
                    helperText={formik.touched.bio && formik.errors.bio}
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Languages */}
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Languages
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Languages</InputLabel>
                <Select
                  multiple
                  name="languages"
                  value={formik.values.languages}
                  onChange={formik.handleChange}
                  input={<OutlinedInput label="Languages" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {languages.map((language) => (
                    <MenuItem key={language} value={language}>
                      {language}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Card>
          </Grid>

          {/* Specialties (Ambassador only) */}
          {user?.role === 'ambassador' && (
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Specialties
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Specialties</InputLabel>
                  <Select
                    multiple
                    name="specialties"
                    value={formik.values.specialties}
                    onChange={formik.handleChange}
                    input={<OutlinedInput label="Specialties" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {specialties.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Card>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/profile')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ProfileEdit;
