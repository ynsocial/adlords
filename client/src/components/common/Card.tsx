import React from 'react';
import {
  Card as MuiCard,
  CardContent,
  CardHeader,
  CardActions,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  media?: {
    image?: string;
    height?: number;
    alt?: string;
  };
  actions?: React.ReactNode;
  loading?: boolean;
  elevation?: number;
  onClick?: () => void;
  hover?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  media,
  actions,
  loading = false,
  elevation = 0,
  onClick,
  hover = true,
  className,
  children,
}) => {
  const theme = useTheme();

  const cardStyles = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.3s ease-in-out',
    '&:hover': hover
      ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px -10px ${alpha(
            theme.palette.primary.main,
            0.15
          )}`,
        }
      : {},
  };

  if (loading) {
    return (
      <MuiCard elevation={elevation} sx={cardStyles} className={className}>
        {(title || subtitle) && (
          <CardHeader
            title={
              title && (
                <Skeleton
                  animation="wave"
                  height={24}
                  width="80%"
                  style={{ marginBottom: 6 }}
                />
              )
            }
            subheader={
              subtitle && (
                <Skeleton animation="wave" height={20} width="40%" />
              )
            }
          />
        )}
        {media && (
          <Skeleton
            animation="wave"
            variant="rectangular"
            height={media.height || 200}
          />
        )}
        <CardContent>
          <Box sx={{ pt: 0.5 }}>
            <Skeleton animation="wave" height={20} style={{ marginBottom: 6 }} />
            <Skeleton animation="wave" height={20} width="80%" />
          </Box>
        </CardContent>
        {actions && (
          <CardActions>
            <Skeleton animation="wave" height={36} width={80} />
            <Skeleton animation="wave" height={36} width={80} />
          </CardActions>
        )}
      </MuiCard>
    );
  }

  return (
    <MuiCard
      elevation={elevation}
      sx={cardStyles}
      onClick={onClick}
      className={className}
    >
      {(title || subtitle) && (
        <CardHeader
          title={
            typeof title === 'string' ? (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            ) : (
              title
            )
          }
          subheader={
            typeof subtitle === 'string' ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : (
              subtitle
            )
          }
          action={
            headerAction || (
              <IconButton aria-label="settings">
                <MoreVertIcon />
              </IconButton>
            )
          }
        />
      )}
      {media && media.image && (
        <CardMedia
          component="img"
          height={media.height || 200}
          image={media.image}
          alt={media.alt || 'Card media'}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </MuiCard>
  );
};

export default Card;
