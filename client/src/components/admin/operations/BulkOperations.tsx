import React, { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Assignment as TaskIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Block as RejectIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

interface BulkAction {
  id: string;
  type: string;
  status: string;
  affectedItems: number;
  timestamp: Date;
  completedItems: number;
}

const BulkOperations: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [bulkActions, setBulkActions] = useState<BulkAction[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(['1', '2', '3', '4', '5']); // Mock IDs
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBulkEmail = () => {
    setEmailDialogOpen(true);
    handleMenuClose();
  };

  const handleBulkTask = () => {
    setTaskDialogOpen(true);
    handleMenuClose();
  };

  const handleBulkAction = (actionType: string) => {
    const newAction: BulkAction = {
      id: Date.now().toString(),
      type: actionType,
      status: 'in_progress',
      affectedItems: selectedItems.length,
      timestamp: new Date(),
      completedItems: 0,
    };
    setBulkActions(prev => [newAction, ...prev]);
    handleMenuClose();
  };

  const EmailDialog: React.FC = () => (
    <Dialog
      open={emailDialogOpen}
      onClose={() => setEmailDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Send Bulk Email</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Subject"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Selected Recipients: {selectedItems.length}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => {
            handleBulkAction('email');
            setEmailDialogOpen(false);
          }}
        >
          Send Email
        </Button>
      </DialogActions>
    </Dialog>
  );

  const TaskDialog: React.FC = () => (
    <Dialog
      open={taskDialogOpen}
      onClose={() => setTaskDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Assign Bulk Task</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Task Title"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Due Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Selected Assignees: {selectedItems.length}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<TaskIcon />}
          onClick={() => {
            handleBulkAction('task');
            setTaskDialogOpen(false);
          }}
        >
          Assign Task
        </Button>
      </DialogActions>
    </Dialog>
  );

  const UploadDialog: React.FC = () => (
    <Dialog
      open={uploadDialogOpen}
      onClose={() => setUploadDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Bulk Upload</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            sx={{ mb: 2 }}
          >
            Upload CSV File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={(e) => {
                // Handle file upload
                console.log(e.target.files);
              }}
            />
          </Button>
          <Typography variant="body2" color="text.secondary">
            Download template: <Button size="small">Template.csv</Button>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            handleBulkAction('upload');
            setUploadDialogOpen(false);
          }}
        >
          Process Upload
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Bulk Operations</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Bulk Upload
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Selection Table */}
        <Grid item xs={12}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.length === 5}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < 5}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index + 1}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedItems.includes((index + 1).toString())}
                          onChange={() => handleSelect((index + 1).toString())}
                        />
                      </TableCell>
                      <TableCell>Item {index + 1}</TableCell>
                      <TableCell>Type {index + 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={index % 2 === 0 ? 'Active' : 'Pending'}
                          color={index % 2 === 0 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>
                  {selectedItems.length} items selected
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<EmailIcon />}
                    onClick={handleBulkEmail}
                  >
                    Send Email
                  </Button>
                  <Button
                    startIcon={<TaskIcon />}
                    onClick={handleBulkTask}
                  >
                    Assign Task
                  </Button>
                  <Button
                    startIcon={<ApproveIcon />}
                    onClick={() => handleBulkAction('approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    startIcon={<RejectIcon />}
                    color="error"
                    onClick={() => handleBulkAction('reject')}
                  >
                    Reject
                  </Button>
                  <IconButton onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Recent Bulk Actions */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Bulk Actions
            </Typography>
            {bulkActions.map((action) => (
              <Box key={action.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">
                    {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(action.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(action.completedItems / action.affectedItems) * 100}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {action.completedItems} of {action.affectedItems} items processed
                </Typography>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <EmailDialog />
      <TaskDialog />
      <UploadDialog />

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleBulkAction('export')}>
          Export Selected
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('archive')}>
          Archive Selected
        </MenuItem>
        <MenuItem
          onClick={() => handleBulkAction('delete')}
          sx={{ color: 'error.main' }}
        >
          Delete Selected
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BulkOperations;
