import React from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  SxProps,
  Theme,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  loading?: boolean;
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  loading = false,
  icon,
  sx = {},
}) => {
  return (
    <Card sx={{ p: 3, height: '100%', ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon && (
          <Box
            sx={{
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {value}
          </Typography>

          {trend !== undefined && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: trend >= 0 ? 'success.main' : 'error.main',
              }}
            >
              {trend >= 0 ? <TrendingUp /> : <TrendingDown />}
              <Typography
                variant="body2"
                sx={{ ml: 0.5 }}
                color={trend >= 0 ? 'success.main' : 'error.main'}
              >
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </>
      )}
    </Card>
  );
};

export default StatCard;
