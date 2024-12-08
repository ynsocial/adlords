import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CardActions,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  Business as IndustryIcon,
} from '@mui/icons-material';
import { companyApi } from '../../services/api';
import { Company } from '../../types';

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyApi.getCompanies({ search: searchTerm });
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompany(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCompany) {
      try {
        await companyApi.deleteCompany(selectedCompany);
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const CompanyCard: React.FC<{ company: Company }> = ({ company }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="140"
        image={company.logo}
        alt={company.name}
        sx={{ objectFit: 'contain', p: 2, bgcolor: 'grey.50' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" gutterBottom>
            {company.name}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, company.id)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {company.description}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IndustryIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {company.industry}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {company.location}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          startIcon={<WebsiteIcon />}
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Website
        </Button>
      </CardActions>
    </Card>
  );

  const LoadingCard = () => (
    <Card sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" height={140} />
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="40%" height={20} />
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Company Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {/* Navigate to add company */}}
          >
            Add Company
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {loading
          ? Array.from(new Array(8)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <LoadingCard />
              </Grid>
            ))
          : companies.map((company) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={company.id}>
                <CompanyCard company={company} />
              </Grid>
            ))}
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {/* Navigate to edit */}}>
          <EditIcon sx={{ mr: 1 }} color="primary" />
          Edit Details
        </MenuItem>
        <MenuItem
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this company? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyManagement;
