import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { useSnackbar } from 'notistack';

interface Company {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  registrationDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  verificationStatus: boolean;
  documents?: {
    name: string;
    url: string;
  }[];
}

const CompanyApprovals: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCompanies();
  }, [filterStatus]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getCompanies({ status: filterStatus });
      setCompanies(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch companies');
      enqueueSnackbar('Failed to fetch companies', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (companyId: string, approved: boolean) => {
    try {
      setLoading(true);
      setError(null);

      await adminApi.updateCompanyStatus({
        companyId,
        status: approved ? 'approved' : 'rejected',
        comment: approvalComment,
      });

      setCompanies((prevCompanies) =>
        prevCompanies.map((company) =>
          company.id === companyId
            ? { ...company, status: approved ? 'approved' : 'rejected' }
            : company
        )
      );

      enqueueSnackbar(
        `Company ${approved ? 'approved' : 'rejected'} successfully`,
        { variant: 'success' }
      );

      setDetailsOpen(false);
      setApprovalComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to update company status');
      enqueueSnackbar('Failed to update company status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Company Approvals
      </Typography>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={filterStatus === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === 'approved' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('approved')}
                >
                  Approved
                </Button>
                <Button
                  variant={filterStatus === 'rejected' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('rejected')}
                >
                  Rejected
                </Button>
                <IconButton onClick={fetchCompanies}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company Name</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Verification</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.contactName}</TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>
                    {new Date(company.registrationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={company.verificationStatus ? 'Verified' : 'Unverified'}
                      color={company.verificationStatus ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={company.status}
                      color={getStatusColor(company.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCompany(company);
                            setDetailsOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {company.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApproval(company.id, true)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleApproval(company.id, false)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCompany && (
          <>
            <DialogTitle>Company Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Company Name</Typography>
                  <Typography>{selectedCompany.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Contact Person</Typography>
                  <Typography>{selectedCompany.contactName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography>{selectedCompany.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography>{selectedCompany.phone}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Registration Date</Typography>
                  <Typography>
                    {new Date(selectedCompany.registrationDate).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Verification Status</Typography>
                  <Chip
                    label={selectedCompany.verificationStatus ? 'Verified' : 'Unverified'}
                    color={selectedCompany.verificationStatus ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
                {selectedCompany.documents && selectedCompany.documents.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Documents
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedCompany.documents.map((doc, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          href={doc.url}
                          target="_blank"
                        >
                          {doc.name}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                )}
                {selectedCompany.status === 'pending' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Approval Comment"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Add a comment about your decision..."
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              {selectedCompany.status === 'pending' && (
                <>
                  <Button
                    color="error"
                    onClick={() => handleApproval(selectedCompany.id, false)}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                  <Button
                    color="success"
                    variant="contained"
                    onClick={() => handleApproval(selectedCompany.id, true)}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CompanyApprovals;
