import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../../services/api';
import { Task } from '../../types';
import { format } from 'date-fns';

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getTasks({
        page: 0,
        limit: 50,
        status: filters.status !== 'all' ? filters.status : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTaskId(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTaskId(null);
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
    handleMenuClose();
  };

  const handleDelete = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'promotion':
        return 'primary';
      case 'training':
        return 'secondary';
      case 'event':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tasks/new')}
        >
          New Task
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="promotion">Promotion</MenuItem>
                <MenuItem value="training">Training</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid item xs={12} sm={6} md={4} key={task.id}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                  {task.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, task.id)}
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
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={task.type}
                  size="small"
                  color={getTypeColor(task.type)}
                />
                <Chip
                  label={task.status}
                  size="small"
                  color={getStatusColor(task.status)}
                />
              </Box>

              <Typography variant="caption" color="text.secondary">
                Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedTaskId && navigate(`/tasks/${selectedTaskId}`)}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedTaskId && handleStatusChange(selectedTaskId, 'completed')}>
          Mark as Completed
        </MenuItem>
        <MenuItem onClick={() => selectedTaskId && handleStatusChange(selectedTaskId, 'in_progress')}>
          Mark as In Progress
        </MenuItem>
        <MenuItem onClick={() => selectedTaskId && handleDelete(selectedTaskId)}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskList;
