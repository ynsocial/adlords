import React, { useState, useCallback, useEffect } from 'react';
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
  InputAdornment,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { jobApi } from '../../services/api';
import { Editor } from '@tinymce/tinymce-react';

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters'),
  budget: Yup.number()
    .required('Budget is required')
    .min(0, 'Budget must be a positive number'),
  description: Yup.string()
    .required('Description is required')
    .min(100, 'Description must be at least 100 characters'),
  startDate: Yup.date()
    .required('Start date is required')
    .min(new Date(), 'Start date must be in the future'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  location: Yup.object({
    type: Yup.string().required('Location type is required'),
    address: Yup.string().when('type', {
      is: 'physical',
      then: Yup.string().required('Address is required for physical location'),
    }),
  }),
  requirements: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one requirement is needed'),
  skills: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one skill is needed'),
});

const JobPosting: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newRequirement, setNewRequirement] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    subtitle: '',
    description: '',
    requirements: [],
    tags: [],
    categories: [],
    bonus: '',
    deadline: null,
    budget: {
      hours: 0,
      rate: 0,
    },
    imageUrl: '',
    status: 'draft',
  });
  const [autoSaveId, setAutoSaveId] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formik = useFormik({
    initialValues: {
      title: '',
      photo: null as File | null,
      budget: '',
      description: '',
      startDate: null,
      endDate: null,
      location: {
        type: 'remote',
        address: '',
      },
      requirements: [] as string[],
      skills: [] as string[],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (key === 'photo' && value) {
            formData.append('photo', value);
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        });

        await jobApi.createJob(formData);
        // Redirect to job listings or show success message
      } catch (err: any) {
        setError(err.message || 'Failed to create job posting. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    formik.setFieldValue('photo', file);
    setPhotoUrl(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      formik.setFieldValue('requirements', [...formik.values.requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      formik.setFieldValue('skills', [...formik.values.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    const newRequirements = [...formik.values.requirements];
    newRequirements.splice(index, 1);
    formik.setFieldValue('requirements', newRequirements);
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = [...formik.values.skills];
    newSkills.splice(index, 1);
    formik.setFieldValue('skills', newSkills);
  };

  useEffect(() => {
    if (autoSaveId) {
      clearTimeout(autoSaveId);
    }

    const timeoutId = setTimeout(async () => {
      try {
        await saveJobDraft(formData);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    setAutoSaveId(timeoutId);

    return () => {
      if (autoSaveId) {
        clearTimeout(autoSaveId);
      }
    };
  }, [formData]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      try {
        const uploadedUrl = await uploadImage(file, setUploadProgress);
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Create Job Posting
        </Typography>
        <Box>
          {lastSaved && (
            <Typography variant="caption" sx={{ mr: 2, color: 'text.secondary' }}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
          <Button
            variant="outlined"
            onClick={() => setPreviewMode(!previewMode)}
            sx={{ mr: 1 }}
          >
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button
            variant="contained"
            onClick={formik.handleSubmit}
            disabled={!formik.isValid || loading}
          >
            {formData.status === 'draft' ? 'Submit for Review' : 'Update Job'}
          </Button>
        </Box>
      </Box>

      {previewMode ? (
        <Box>
          {/* Preview Mode UI */}
          <Box sx={{ mb: 3 }}>
            {photoUrl && (
              <Box
                component="img"
                src={photoUrl}
                alt="Job photo"
                sx={{ maxWidth: 300, maxHeight: 200, objectFit: 'cover', borderRadius: 1 }}
              />
            )}
          </Box>

          <Typography variant="h5" sx={{ mb: 2 }}>
            {formik.values.title}
          </Typography>

          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Budget: ${formik.values.budget}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Timeline
            </Typography>
            <Typography>
              {formik.values.startDate?.toLocaleDateString()} - {formik.values.endDate?.toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Location
            </Typography>
            <Typography>
              {formik.values.location.type === 'remote' ? 'Remote' : formik.values.location.address}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Description
            </Typography>
            <div dangerouslySetInnerHTML={{ __html: formik.values.description }} />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Requirements
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formik.values.requirements.map((req, index) => (
                <Chip key={index} label={req} />
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Required Skills
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formik.values.skills.map((skill, index) => (
                <Chip key={index} label={skill} color="primary" />
              ))}
            </Box>
          </Box>
        </Box>
      ) : (
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
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
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 2,
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography>
                  {isDragActive
                    ? 'Drop the image here'
                    : 'Drag and drop an image here, or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum file size: 5MB
                </Typography>
              </Box>
              {photoUrl && (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={photoUrl}
                    alt="Preview"
                    sx={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 1 }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                    }}
                    onClick={() => {
                      formik.setFieldValue('photo', null);
                      setPhotoUrl(null);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="budget"
                label="Budget"
                type="number"
                value={formik.values.budget}
                onChange={formik.handleChange}
                error={formik.touched.budget && Boolean(formik.errors.budget)}
                helperText={formik.touched.budget && formik.errors.budget}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Location Type</InputLabel>
                <Select
                  name="location.type"
                  value={formik.values.location.type}
                  onChange={formik.handleChange}
                  label="Location Type"
                >
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="physical">Physical Location</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formik.values.location.type === 'physical' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="location.address"
                  label="Address"
                  value={formik.values.location.address}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.location?.address &&
                    Boolean(formik.errors.location?.address)
                  }
                  helperText={
                    formik.touched.location?.address &&
                    formik.errors.location?.address
                  }
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Start Date"
                value={formik.values.startDate}
                onChange={(date) => formik.setFieldValue('startDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.startDate && Boolean(formik.errors.startDate),
                    helperText: formik.touched.startDate && formik.errors.startDate,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="End Date"
                value={formik.values.endDate}
                onChange={(date) => formik.setFieldValue('endDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.endDate && Boolean(formik.errors.endDate),
                    helperText: formik.touched.endDate && formik.errors.endDate,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Job Description
              </Typography>
              <Editor
                apiKey="your-tinymce-api-key"
                value={formik.values.description}
                onEditorChange={(content) => formik.setFieldValue('description', content)}
                init={{
                  height: 400,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                }}
              />
              {formik.touched.description && formik.errors.description && (
                <Typography color="error" variant="caption">
                  {formik.errors.description}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Job Image</Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Image
                  </Button>
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mt: 1 }}
                  />
                )}
                {formData.imageUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={formData.imageUrl}
                      alt="Job preview"
                      style={{ maxWidth: '200px', borderRadius: '4px' }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Requirements
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequirement();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddRequirement}
                  disabled={!newRequirement.trim()}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formik.values.requirements.map((req, index) => (
                  <Chip
                    key={index}
                    label={req}
                    onDelete={() => handleRemoveRequirement(index)}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Required Skills
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim()}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formik.values.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    color="primary"
                    onDelete={() => handleRemoveSkill(index)}
                  />
                ))}
              </Box>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  Save Job Posting
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
    </Box>
  );
};

export default JobPosting;
