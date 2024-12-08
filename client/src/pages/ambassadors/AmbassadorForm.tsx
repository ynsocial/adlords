import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ambassadorApi } from '../../services/api';
import { AmbassadorProfile } from '../../types';

const validationSchema = Yup.object({
  category: Yup.string().required('Category is required'),
  bio: Yup.string()
    .required('Bio is required')
    .max(500, 'Bio must be less than 500 characters'),
  specialties: Yup.array()
    .min(1, 'At least one specialty is required')
    .required('Specialties are required'),
  socialMedia: Yup.object({
    instagram: Yup.string().url('Must be a valid URL'),
    facebook: Yup.string().url('Must be a valid URL'),
    twitter: Yup.string().url('Must be a valid URL'),
    linkedin: Yup.string().url('Must be a valid URL'),
  }),
});

const categories = [
  'athlete',
  'fitness',
  'health',
  'beauty',
  'elderly',
  'youth',
];

const specialtiesList = [
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

const AmbassadorForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      category: '',
      bio: '',
      specialties: [] as string[],
      socialMedia: {
        instagram: '',
        facebook: '',
        twitter: '',
        linkedin: '',
      },
      status: 'active',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (id) {
          await ambassadorApi.updateAmbassadorProfile(id, values);
        }
        navigate('/ambassadors');
      } catch (err: any) {
        setError(err.message || 'An error occurred while saving');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (id) {
      fetchAmbassador();
    }
  }, [id]);

  const fetchAmbassador = async () => {
    try {
      setLoading(true);
      const response = await ambassadorApi.getAmbassadorProfile(id!);
      formik.setValues({
        ...response,
        specialties: response.specialties || [],
        socialMedia: response.socialMedia || {},
      });
    } catch (err: any) {
      setError(err.message || 'Error fetching ambassador details');
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
      <Typography variant="h4" sx={{ mb: 3 }}>
        {id ? 'Edit Ambassador' : 'New Ambassador'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formik.values.category}
                      onChange={formik.handleChange}
                      error={formik.touched.category && Boolean(formik.errors.category)}
                      label="Category"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Specialties</InputLabel>
                    <Select
                      multiple
                      name="specialties"
                      value={formik.values.specialties}
                      onChange={formik.handleChange}
                      error={formik.touched.specialties && Boolean(formik.errors.specialties)}
                      label="Specialties"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                    >
                      {specialtiesList.map((specialty) => (
                        <MenuItem key={specialty} value={specialty}>
                          {specialty}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Social Media
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="socialMedia.instagram"
                    label="Instagram"
                    value={formik.values.socialMedia.instagram}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.socialMedia?.instagram &&
                      Boolean(formik.errors.socialMedia?.instagram)
                    }
                    helperText={
                      formik.touched.socialMedia?.instagram &&
                      formik.errors.socialMedia?.instagram
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="socialMedia.facebook"
                    label="Facebook"
                    value={formik.values.socialMedia.facebook}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="socialMedia.twitter"
                    label="Twitter"
                    value={formik.values.socialMedia.twitter}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="socialMedia.linkedin"
                    label="LinkedIn"
                    value={formik.values.socialMedia.linkedin}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/ambassadors')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AmbassadorForm;
