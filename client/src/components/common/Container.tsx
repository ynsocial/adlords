import React from 'react';
import { Box, Container as MuiContainer, useTheme, useMediaQuery } from '@mui/material';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
  sx?: any;
}

const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <MuiContainer
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        py: isMobile ? 2 : 4,
        px: isMobile ? 2 : 3,
        ...sx,
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </MuiContainer>
  );
};

export default Container;
