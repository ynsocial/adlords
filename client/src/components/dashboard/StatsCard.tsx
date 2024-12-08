import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Skeleton,
  SvgIconProps,
} from '@mui/material';
import { Card } from '../common';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<SvgIconProps>;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  loading = false,
  color = 'primary',
}) => {
  const theme = useTheme();

  const getColorValue = (colorName: string) => {
    return theme.palette[colorName as keyof typeof theme.palette]?.main || theme.palette.primary.main;
  };

  const iconColor = getColorValue(color);

  if (loading) {
    return (
      <Card>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ ml: 2, flex: 1 }}>
              <Skeleton variant="text" width="60%" />
            </Box>
          </Box>
          <Skeleton variant="text" width="40%" height={40} />
          {trend && <Skeleton variant="text" width="30%" />}
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box
        sx={{
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: 210,
            height: 210,
            background: `radial-gradient(circle, ${alpha(
              iconColor,
              0.1
            )} 0%, transparent 70%)`,
            transform: 'translate(30%, -30%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha(iconColor, 0.1),
                color: iconColor,
                mr: 2,
              }}
            >
              <Icon />
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: 'text.secondary', mb: 0.5 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mb: trend ? 1 : 0 }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color:
                      trend.value >= 0
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', ml: 1 }}
                >
                  {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default StatsCard;
