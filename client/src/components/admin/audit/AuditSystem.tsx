import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  Undo as UndoIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface AuditLog {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status: string;
  ipAddress: string;
}

const AuditSystem: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    user: '',
    action: '',
    entity: '',
    status: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    // Mock API call - replace with actual API
    const mockLogs: AuditLog[] = Array.from({ length: 10 }, (_, index) => ({
      id: `log-${index + 1}`,
      timestamp: new Date(Date.now() - index * 3600000),
      user: {
        id: `user-${index + 1}`,
        name: `User ${index + 1}`,
        role: index % 2 === 0 ? 'admin' : 'manager',
      },
      action: ['create', 'update', 'delete', 'approve', 'reject'][index % 5],
      entity: ['ambassador', 'company', 'task', 'document'][index % 4],
      entityId: `entity-${index + 1}`,
      changes: [
        {
          field: 'status',
          oldValue: 'pending',
          newValue: 'approved',
        },
      ],
      status: ['success', 'pending', 'failed'][index % 3],
      ipAddress: `192.168.1.${index + 1}`,
    }));

    setAuditLogs(mockLogs);
  };

  const handleRollback = async (logId: string) => {
    // Implement rollback logic
    console.log('Rolling back:', logId);
  };

  const handleExport = () => {
    // Implement export logic
    console.log('Exporting audit logs');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'approve':
        return 'success';
      case 'reject':
        return 'warning';
      default:
        return 'default';
    }
  };

  const FilterDialog: React.FC = () => (
    <Dialog
      open={filtersOpen}
      onClose={() => setFiltersOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Filter Audit Logs</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                label="User"
              >
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                label="Action"
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Entity</InputLabel>
              <Select
                value={filters.entity}
                onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
                label="Entity"
              >
                <MenuItem value="">All Entities</MenuItem>
                <MenuItem value="ambassador">Ambassador</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                <MenuItem value="task">Task</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setFilters({
          startDate: null,
          endDate: null,
          user: '',
          action: '',
          entity: '',
          status: '',
        })}>
          Clear Filters
        </Button>
        <Button onClick={() => setFiltersOpen(false)}>
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );

  const DetailsDialog: React.FC = () => {
    if (!selectedLog) return null;

    return (
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Timestamp</Typography>
              <Typography color="text.secondary">
                {new Date(selectedLog.timestamp).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">User</Typography>
              <Typography color="text.secondary">
                {selectedLog.user.name} ({selectedLog.user.role})
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Action</Typography>
              <Chip
                label={selectedLog.action}
                color={getActionColor(selectedLog.action)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Entity</Typography>
              <Typography color="text.secondary">
                {selectedLog.entity} ({selectedLog.entityId})
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Changes</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Field</TableCell>
                      <TableCell>Old Value</TableCell>
                      <TableCell>New Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedLog.changes.map((change, index) => (
                      <TableRow key={index}>
                        <TableCell>{change.field}</TableCell>
                        <TableCell>{JSON.stringify(change.oldValue)}</TableCell>
                        <TableCell>{JSON.stringify(change.newValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">IP Address</Typography>
              <Typography color="text.secondary">
                {selectedLog.ipAddress}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Status</Typography>
              <Chip
                label={selectedLog.status}
                color={getStatusColor(selectedLog.status)}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<UndoIcon />}
            onClick={() => handleRollback(selectedLog.id)}
            disabled={selectedLog.status !== 'success'}
          >
            Rollback Changes
          </Button>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Audit System</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Logs
          </Button>
          <IconButton onClick={fetchAuditLogs}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">{log.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.user.role}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.entity}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.entityId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailsOpen(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {log.status === 'success' && (
                      <Tooltip title="Rollback">
                        <IconButton
                          size="small"
                          onClick={() => handleRollback(log.id)}
                        >
                          <UndoIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <FilterDialog />
      <DetailsDialog />
    </Box>
  );
};

export default AuditSystem;
