import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  MenuItem,
  Select,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { ambassadorApi } from '../../services/api';
import { AmbassadorProfile } from '../../types';

const AmbassadorList: React.FC = () => {
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmbassadors();
  }, [page, rowsPerPage, categoryFilter]);

  const fetchAmbassadors = async () => {
    try {
      const filters = {
        page,
        limit: rowsPerPage,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchTerm || undefined,
      };
      const response = await ambassadorApi.getAmbassadors(filters);
      setAmbassadors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ambassadors:', error);
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ambassadors</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {/* Navigate to create ambassador */}}
        >
          Add Ambassador
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ width: 300 }}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            size="small"
            sx={{ width: 200 }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="athlete">Athlete</MenuItem>
            <MenuItem value="fitness">Fitness</MenuItem>
            <MenuItem value="health">Health</MenuItem>
            <MenuItem value="beauty">Beauty</MenuItem>
            <MenuItem value="elderly">Elderly</MenuItem>
            <MenuItem value="youth">Youth</MenuItem>
          </Select>
        </Box>
      </Card>

      <Card>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Referrals</TableCell>
                <TableCell>Earnings</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ambassadors.map((ambassador) => (
                <TableRow key={ambassador.userId}>
                  <TableCell>{ambassador.userId}</TableCell>
                  <TableCell>
                    <Chip
                      label={ambassador.category}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{ambassador.totalReferrals}</TableCell>
                  <TableCell>${ambassador.earnings.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={ambassador.status}
                      size="small"
                      color={getStatusColor(ambassador.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {/* Navigate to edit */}}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {/* Handle delete */}}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={100} // Replace with actual total count
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
};

export default AmbassadorList;
