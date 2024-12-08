import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Autocomplete,
  CircularProgress,
  Alert,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';
import { jobApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
  };
  photo: string;
  budget: number;
  location: {
    type: 'remote' | 'physical';
    address?: string;
  };
  startDate: Date;
  endDate: Date;
  description: string;
  requirements: string[];
  skills: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const JobListing: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'remote' | 'physical'>('all');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
    loadSavedJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await jobApi.getJobs({
        search: searchQuery,
        location: locationFilter !== 'all' ? locationFilter : undefined,
        minBudget: budgetRange[0],
        maxBudget: budgetRange[1],
        skills: selectedSkills.join(','),
      });

      setJobs(response.data);

      // Extract unique skills for filter
      const skills = new Set<string>();
      response.data.forEach((job: Job) => {
        job.skills.forEach((skill) => skills.add(skill));
      });
      setAvailableSkills(Array.from(skills));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
      enqueueSnackbar('Failed to fetch jobs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      const saved = await jobApi.getSavedJobs();
      setSavedJobs(new Set(saved.data.map((job: Job) => job.id)));
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      if (savedJobs.has(jobId)) {
        await jobApi.unsaveJob(jobId);
        setSavedJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        enqueueSnackbar('Job removed from saved jobs', { variant: 'success' });
      } else {
        await jobApi.saveJob(jobId);
        setSavedJobs((prev) => new Set(prev).add(jobId));
        enqueueSnackbar('Job saved successfully', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Failed to save job', { variant: 'error' });
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      await jobApi.applyToJob(jobId);
      enqueueSnackbar('Application submitted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to submit application', { variant: 'error' });
    }
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const FilterDrawerContent = () => (
    <Box sx={{ width: isMobile ? 'auto' : 300, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        {isMobile && (
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Location</InputLabel>
        <Select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value as any)}
          label="Location"
        >
          <MenuItem value="all">All Locations</MenuItem>
          <MenuItem value="remote">Remote Only</MenuItem>
          <MenuItem value="physical">On-site Only</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Budget Range</Typography>
        <Slider
          value={budgetRange}
          onChange={(_, newValue) => setBudgetRange(newValue as [number, number])}
          valueLabelDisplay="auto"
          min={0}
          max={10000}
          valueLabelFormat={formatBudget}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">{formatBudget(budgetRange[0])}</Typography>
          <Typography variant="caption">{formatBudget(budgetRange[1])}</Typography>
        </Box>
      </Box>

      <Autocomplete
        multiple
        options={availableSkills}
        value={selectedSkills}
        onChange={(_, newValue) => setSelectedSkills(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Skills" placeholder="Select skills" />
        )}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={() => {
          fetchJobs();
          if (isMobile) setFilterDrawerOpen(false);
        }}
      >
        Apply Filters
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Search and Filter Bar */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') fetchJobs();
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FilterIcon />}
                      onClick={() => setFilterDrawerOpen(true)}
                    >
                      Filters
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={fetchJobs}
                    >
                      Search
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Filter Drawer */}
        <Drawer
          anchor={isMobile ? 'bottom' : 'right'}
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: isMobile ? 'auto' : 300,
              height: isMobile ? '80vh' : '100%',
            },
          }}
        >
          <FilterDrawerContent />
        </Drawer>

        {/* Job Cards */}
        {loading ? (
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        ) : jobs.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">No jobs found matching your criteria</Alert>
          </Grid>
        ) : (
          jobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {job.photo && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={job.photo}
                    alt={job.title}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSaveJob(job.id)}
                    >
                      {savedJobs.has(job.id) ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {job.company.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {job.location.type === 'remote' ? 'Remote' : job.location.address}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MoneyIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatBudget(job.budget)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {job.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {job.skills.length > 3 && (
                      <Chip
                        label={`+${job.skills.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSelectedJob(job);
                      setDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Job Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedJob.title}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleSaveJob(selectedJob.id)}
                >
                  {savedJobs.has(selectedJob.id) ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {selectedJob.photo && (
                  <Grid item xs={12}>
                    <Box
                      component="img"
                      src={selectedJob.photo}
                      alt={selectedJob.title}
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1 }} />
                    <Typography>{selectedJob.company.name}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 1 }} />
                    <Typography>
                      {selectedJob.location.type === 'remote'
                        ? 'Remote'
                        : selectedJob.location.address}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MoneyIcon sx={{ mr: 1 }} />
                    <Typography>{formatBudget(selectedJob.budget)}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarIcon sx={{ mr: 1 }} />
                    <Typography>
                      {new Date(selectedJob.startDate).toLocaleDateString()} -{' '}
                      {new Date(selectedJob.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography
                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Requirements
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedJob.requirements.map((req, index) => (
                      <Chip key={index} label={req} />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedJob.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => handleApplyToJob(selectedJob.id)}
                disabled={!user}
              >
                Apply Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default JobListing;
