import { forwardRef } from "react";
import { Paper, Box, Typography, PaperProps, BoxProps, TypographyProps } from "@mui/material";

const Card = forwardRef<HTMLDivElement, PaperProps>(
  ({ sx, children, ...props }, ref) => (
    <Paper
      ref={ref}
      elevation={0}
      sx={{
        bgcolor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(0, 245, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  ),
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, BoxProps>(
  ({ sx, children, ...props }, ref) => (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 3,
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ sx, children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h5"
      sx={{
        fontWeight: 900,
        fontFamily: 'var(--font-space-grotesk)',
        letterSpacing: '-0.02em',
        color: 'white',
        ...sx
      }}
      {...props}
    >
      {children}
    </Typography>
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, BoxProps>(
  ({ sx, children, ...props }, ref) => (
    <Box 
      ref={ref} 
      sx={{ 
        p: 3, 
        pt: 0, 
        ...sx 
      }} 
      {...props} 
    >
      {children}
    </Box>
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
