import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { jobsApi } from '../../services/api';

const categories = [
  'Travel Health Consultation',
  'Vaccination Services',
  'Health Education',
  'Medical Documentation',
  'Travel Insurance',
  'Emergency Response',
  'Wellness Programs',
];

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  subtitle: Yup.string().required('Subtitle is required'),
  description: Yup.string()
    .required('Description is required')
    .min(100, 'Description must be at least 100 characters'),
  requirements: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one requirement is needed'),
  tags: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one tag is needed'),
  categories: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one category is needed'),
  bonus: Yup.number()
    .min(0, 'Bonus cannot be negative')
    .nullable(),
  deadline: Yup.date()
    .min(new Date(), 'Deadline must be in the future')
    .required('Deadline is required'),
  budgetHours: Yup.number()
    .required('Budget hours is required')
    .min(1, 'Budget hours must be at least 1'),
  hourlyRate: Yup.number()
    .required('Hourly rate is required')
    .min(10, 'Hourly rate must be at least $10'),
  imageUrl: Yup.string()
    .url('Must be a valid URL')
    .required('Image URL is required'),
});

const AddJobForm: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: '',
      subtitle: '',
      description: '',
      requirements: [],
      tags: [],
      categories: [],
      bonus: null,
      deadline: null,
      budgetHours: '',
      hourlyRate: '',
      imageUrl: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        await jobsApi.createJob(values);
        navigate('/admin/jobs');
      } catch (error) {
        console.error('Error creating job:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleRequirementAdd = (requirement: string) => {
    if (requirement && !formik.values.requirements.includes(requirement)) {
      formik.setFieldValue('requirements', [...formik.values.requirements, requirement]);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formik.values.tags.includes(tag)) {
      formik.setFieldValue('tags', [...formik.values.tags, tag]);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Create New Job
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Card sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="title"
                label="Job Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="subtitle"
                label="Subtitle"
                value={formik.values.subtitle}
                onChange={formik.handleChange}
                error={formik.touched.subtitle && Boolean(formik.errors.subtitle)}
                helperText={formik.touched.subtitle && formik.errors.subtitle}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="description"
                label="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>

            {/* Requirements and Tags */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formik.values.requirements}
                onChange={(_, newValue) => {
                  formik.setFieldValue('requirements', newValue);
                }}
                renderTags={(value: string[], getTagProps) =>
                  value.map((option: string, index: number) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Requirements"
                    placeholder="Add requirement and press enter"
                    error={formik.touched.requirements && Boolean(formik.errors.requirements)}
                    helperText={formik.touched.requirements && formik.errors.requirements}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formik.values.tags}
                onChange={(_, newValue) => {
                  formik.setFieldValue('tags', newValue);
                }}
                renderTags={(value: string[], getTagProps) =>
                  value.map((option: string, index: number) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tag and press enter"
                    error={formik.touched.tags && Boolean(formik.errors.tags)}
                    helperText={formik.touched.tags && formik.errors.tags}
                  />
                )}
              />
            </Grid>

            {/* Categories */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  options={categories}
                  value={formik.values.categories}
                  onChange={(_, newValue) => {
                    formik.setFieldValue('categories', newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categories"
                      error={formik.touched.categories && Boolean(formik.errors.categories)}
                      helperText={formik.touched.categories && formik.errors.categories}
                    />
                  )}
                />
              </FormControl>
            </Grid>

            {/* Budget and Timeline */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Budget and Timeline
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="bonus"
                label="Bonus Amount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={formik.values.bonus}
                onChange={formik.handleChange}
                error={formik.touched.bonus && Boolean(formik.errors.bonus)}
                helperText={formik.touched.bonus && formik.errors.bonus}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Deadline"
                value={formik.values.deadline}
                onChange={(value) => formik.setFieldValue('deadline', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.deadline && Boolean(formik.errors.deadline),
                    helperText: formik.touched.deadline && formik.errors.deadline,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="budgetHours"
                label="Budget Hours"
                type="number"
                value={formik.values.budgetHours}
                onChange={formik.handleChange}
                error={formik.touched.budgetHours && Boolean(formik.errors.budgetHours)}
                helperText={formik.touched.budgetHours && formik.errors.budgetHours}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="hourlyRate"
                label="Hourly Rate"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={formik.values.hourlyRate}
                onChange={formik.handleChange}
                error={formik.touched.hourlyRate && Boolean(formik.errors.hourlyRate)}
                helperText={formik.touched.hourlyRate && formik.errors.hourlyRate}
              />
            </Grid>

            {/* Image URL */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="imageUrl"
                label="Image URL"
                value={formik.values.imageUrl}
                onChange={formik.handleChange}
                error={formik.touched.imageUrl && Boolean(formik.errors.imageUrl)}
                helperText={formik.touched.imageUrl && formik.errors.imageUrl}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/jobs')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Job'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </form>
    </Box>
  );
};

export default AddJobForm;
