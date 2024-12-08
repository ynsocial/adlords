import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Typography,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ambassadorApi } from '../../services/api';
import { AmbassadorProfile } from '../../types';

const AmbassadorManagement: React.FC = () => {
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAmbassador, setSelectedAmbassador] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchAmbassadors();
  }, [page, rowsPerPage, searchTerm]);

  const fetchAmbassadors = async () => {
    try {
      setLoading(true);
      const response = await ambassadorApi.getAmbassadors({
        page,
        limit: rowsPerPage,
        search: searchTerm,
      });
      setAmbassadors(response.data);
    } catch (error) {
      console.error('Error fetching ambassadors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ambassadorId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAmbassador(ambassadorId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAmbassador(null);
  };

  const handleStatusChange = async (ambassadorId: string, status: string) => {
    try {
      await ambassadorApi.updateAmbassadorProfile(ambassadorId, { status });
      fetchAmbassadors();
    } catch (error) {
      console.error('Error updating ambassador status:', error);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedAmbassador) {
      try {
        await ambassadorApi.deleteAmbassadorProfile(selectedAmbassador);
        fetchAmbassadors();
      } catch (error) {
        console.error('Error deleting ambassador:', error);
      }
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Ambassador Management</Typography>
        <TextField
          size="small"
          placeholder="Search ambassadors..."
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
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ambassador</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Earnings</TableCell>
                <TableCell align="right">Hours Worked</TableCell>
                <TableCell align="right">Tasks Completed</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ambassadors.map((ambassador) => (
                <TableRow key={ambassador.userId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={ambassador.avatar} />
                      <Box>
                        <Typography variant="subtitle2">
                          {ambassador.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ambassador.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ambassador.category}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${ambassador.earnings.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {ambassador.hoursWorked}
                  </TableCell>
                  <TableCell align="right">
                    {ambassador.tasksCompleted}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ambassador.status}
                      size="small"
                      color={getStatusColor(ambassador.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, ambassador.userId)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={100} // Replace with actual total count
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange(selectedAmbassador!, 'active')}>
          <CheckCircleIcon sx={{ mr: 1 }} color="success" />
          Mark as Active
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedAmbassador!, 'inactive')}>
          <BlockIcon sx={{ mr: 1 }} color="error" />
          Mark as Inactive
        </MenuItem>
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
          Are you sure you want to delete this ambassador? This action cannot be undone.
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

export default AmbassadorManagement;
