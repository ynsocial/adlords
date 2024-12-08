import React from 'react';
import { Grid as MuiGrid, useTheme, useMediaQuery } from '@mui/material';

interface GridProps {
  children: React.ReactNode;
  spacing?: number;
  columns?: number;
  minChildWidth?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  sx?: any;
}

const Grid: React.FC<GridProps> = ({
  children,
  spacing = 3,
  columns = 12,
  minChildWidth = 280,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate the number of columns based on container width and minChildWidth
  const calculateColumns = (containerWidth: number) => {
    const maxColumns = Math.floor(containerWidth / minChildWidth);
    return Math.min(maxColumns, columns);
  };

  return (
    <MuiGrid
      container
      spacing={isMobile ? spacing / 2 : spacing}
      alignItems={alignItems}
      justifyContent={justifyContent}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(auto-fill, minmax(${minChildWidth}px, 1fr))`,
          sm: `repeat(auto-fill, minmax(${minChildWidth}px, 1fr))`,
          md: `repeat(auto-fill, minmax(${minChildWidth}px, 1fr))`,
        },
        gap: theme.spacing(spacing),
        width: '100%',
        ...sx,
      }}
    >
      {React.Children.map(children, (child) => (
        <MuiGrid
          item
          sx={{
            width: '100%',
            height: '100%',
          }}
        >
          {child}
        </MuiGrid>
      ))}
    </MuiGrid>
  );
};

export default Grid;
