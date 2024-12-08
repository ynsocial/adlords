import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
  styled,
  useTheme,
} from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'size'> {
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, size }) => ({
  position: 'relative',
  minHeight: size === 'small' ? 36 : size === 'large' ? 48 : 42,
  padding: size === 'small' ? '6px 16px' : size === 'large' ? '12px 24px' : '8px 20px',
  fontSize: size === 'small' ? '0.8125rem' : size === 'large' ? '1rem' : '0.875rem',
  transition: 'all 0.2s ease-in-out',

  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },

  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
  },

  '& .MuiButton-endIcon': {
    marginLeft: theme.spacing(1),
  },

  '&.MuiButton-contained': {
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },

  '&.MuiButton-outlined': {
    borderWidth: 2,
    '&:hover': {
      borderWidth: 2,
    },
  },
}));

const LoadingSpinner = styled(CircularProgress)(({ theme }) => ({
  position: 'absolute',
  left: '50%',
  marginLeft: -12,
  marginTop: -12,
}));

const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  size = 'medium',
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  ...props
}) => {
  const theme = useTheme();

  return (
    <StyledButton
      size={size}
      variant={variant}
      color={color}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={loading ? undefined : onClick}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      {...props}
    >
      {loading && (
        <LoadingSpinner
          size={24}
          color={variant === 'contained' ? 'inherit' : color}
        />
      )}
      <span
        style={{
          visibility: loading ? 'hidden' : 'visible',
          display: 'inline-block',
        }}
      >
        {children}
      </span>
    </StyledButton>
  );
};

export default Button;
