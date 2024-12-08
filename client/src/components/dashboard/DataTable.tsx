import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Box,
  Checkbox,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { Card } from '../common';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string | JSX.Element;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  title?: string;
  loading?: boolean;
  selectable?: boolean;
  onEdit?: (row: any) => void;
  onDelete?: (rows: any[]) => void;
  onRowClick?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  title,
  loading = false,
  selectable = false,
  onEdit,
  onDelete,
  onRowClick,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<string>(columns[0].id);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((row) => row.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  // Sorting function
  const descendingComparator = (a: any, b: any, orderBy: string) => {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc'
      ? (a: any, b: any) => descendingComparator(a, b, orderBy)
      : (a: any, b: any) => -descendingComparator(a, b, orderBy);
  };

  const sortedRows = rows.slice().sort(getComparator(order, orderBy));

  if (loading) {
    return (
      <Card>
        <Box sx={{ p: 3 }}>
          {title && (
            <Typography variant="h6" sx={{ mb: 3 }}>
              <Skeleton width={200} />
            </Typography>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      style={{ minWidth: column.minWidth }}
                    >
                      <Skeleton width={100} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow hover key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        <Skeleton width={100} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box sx={{ width: '100%' }}>
        {(title || selected.length > 0) && (
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {selected.length > 0 ? (
              <Typography variant="subtitle1" component="div">
                {selected.length} selected
              </Typography>
            ) : (
              <Typography variant="h6">{title}</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selected.length > 0 && onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    onClick={() => onDelete(selected)}
                    size="small"
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Filter list">
                <IconButton size="small">
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={
                        selected.length > 0 && selected.length < rows.length
                      }
                      checked={
                        rows.length > 0 && selected.length === rows.length
                      }
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                {(onEdit || onDelete) && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  const isItemSelected = isSelected(row.id);

                  return (
                    <TableRow
                      hover
                      onClick={
                        onRowClick
                          ? () => onRowClick(row)
                          : selectable
                          ? () => handleClick(row.id)
                          : undefined
                      }
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                      sx={{ cursor: onRowClick || selectable ? 'pointer' : 'default' }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox color="primary" checked={isItemSelected} />
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                      {(onEdit || onDelete) && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {onEdit && (
                              <Tooltip title="Edit">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(row);
                                  }}
                                  size="small"
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <Tooltip title="Delete">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete([row.id]);
                                  }}
                                  size="small"
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Card>
  );
};

export default DataTable;
