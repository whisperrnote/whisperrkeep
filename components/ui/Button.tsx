import { forwardRef } from "react";
import { Button as MuiButton, ButtonProps as MuiButtonProps, alpha, styled } from "@mui/material";

export interface ButtonProps extends MuiButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | any;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'size',
})<any>(({ theme, variant, size }) => {
  const isDestructive = variant === 'destructive';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isLink = variant === 'link';
  const isSecondary = variant === 'secondary';

  return {
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
    transition: 'all 0.2s ease',
    
    ...(variant === 'default' || !variant ? {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.8),
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
      },
    } : {}),

    ...(isDestructive ? {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: alpha(theme.palette.error.main, 0.8),
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.3)}`,
      },
    } : {}),

    ...(isOutline ? {
      backgroundColor: 'transparent',
      border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
      color: theme.palette.text.primary,
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        transform: 'translateY(-2px)',
      },
    } : {}),

    ...(isSecondary ? {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.15),
        transform: 'translateY(-2px)',
      },
    } : {}),

    ...(isGhost ? {
      backgroundColor: 'transparent',
      color: theme.palette.text.secondary,
      '&:hover': {
        backgroundColor: alpha(theme.palette.text.primary, 0.05),
        color: theme.palette.text.primary,
      },
    } : {}),

    ...(isLink ? {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      textDecoration: 'underline',
      '&:hover': {
        backgroundColor: 'transparent',
        textDecoration: 'none',
      },
    } : {}),

    ...(size === 'sm' ? {
      padding: '6px 16px',
      fontSize: '0.8125rem',
    } : {}),

    ...(size === 'lg' ? {
      padding: '12px 32px',
      fontSize: '1rem',
    } : {}),
  };
});

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'medium', ...props }, ref) => {
    return (
      <StyledButton
        ref={ref}
        variant={variant as any}
        size={size as any}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
