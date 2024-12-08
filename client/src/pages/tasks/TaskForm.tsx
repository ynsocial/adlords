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
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { taskApi, ambassadorApi } from '../../services/api';
import { Task, AmbassadorProfile } from '../../types';

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .max(500, 'Description must be less than 500 characters'),
  type: Yup.string().required('Type is required'),
  ambassadorId: Yup.string().required('Ambassador is required'),
  dueDate: Yup.date()
    .required('Due date is required')
    .min(new Date(), 'Due date cannot be in the past'),
});

const TaskForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      type: '',
      ambassadorId: '',
      dueDate: new Date(),
      status: 'pending' as Task['status'],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (id) {
          await taskApi.updateTask(id, values);
        } else {
          await taskApi.createTask(values);
        }
        navigate('/tasks');
      } catch (err: any) {
        setError(err.message || 'An error occurred while saving the task');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchAmbassadors();
    if (id) {
      fetchTask();
    }
  }, [id]);

  const fetchAmbassadors = async () => {
    try {
      const response = await ambassadorApi.getAmbassadors({
        page: 0,
        limit: 100,
      });
      setAmbassadors(response.data);
    } catch (error) {
      console.error('Error fetching ambassadors:', error);
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const task = await taskApi.getTask(id!);
      formik.setValues({
        ...task,
        dueDate: new Date(task.dueDate),
      });
    } catch (err: any) {
      setError(err.message || 'Error fetching task details');
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {id ? 'Edit Task' : 'New Task'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Card sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="title"
                label="Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  error={formik.touched.type && Boolean(formik.errors.type)}
                  label="Type"
                >
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="training">Training</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ambassador</InputLabel>
                <Select
                  name="ambassadorId"
                  value={formik.values.ambassadorId}
                  onChange={formik.handleChange}
                  error={formik.touched.ambassadorId && Boolean(formik.errors.ambassadorId)}
                  label="Ambassador"
                >
                  {ambassadors.map((ambassador) => (
                    <MenuItem key={ambassador.userId} value={ambassador.userId}>
                      {ambassador.userId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={formik.values.dueDate}
                  onChange={(date) => formik.setFieldValue('dueDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.dueDate && Boolean(formik.errors.dueDate),
                      helperText: formik.touched.dueDate && formik.errors.dueDate,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {id && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Card>

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
            onClick={() => navigate('/tasks')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default TaskForm;
