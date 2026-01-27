"use client";

import Link from "next/link";
import { useAppwrite } from "@/app/appwrite-provider";
import {
  GridViewOutlined as GripIcon,
  AutoAwesomeOutlined as SparklesIcon,
  VpnKeyOutlined as KeyIcon,
  PersonOutline as UserIcon,
  SettingsOutlined as SettingsIcon,
  LockOutlined as LockIcon,
  LogoutOutlined as LogOutIcon,
} from "@mui/icons-material";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import { useState, useEffect } from "react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useAI } from "@/app/context/AIContext";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import EcosystemPortal from "../common/EcosystemPortal";

const PasswordGenerator = dynamic(() => import("@/components/ui/PasswordGenerator"), { 
  loading: () => <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>,
  ssr: false 
});

export function Navbar() {
  const { user, logout, openIDMWindow } = useAppwrite();
  const { openAIModal } = useAI();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setIsEcosystemPortalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCorePage = [
    "/dashboard",
    "/credentials",
    "/totp",
    "/import",
    "/sharing",
    "/overview"
  ].some(path => pathname?.startsWith(path));

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(25px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'none',
        backgroundImage: 'none'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 72 }}>
        <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit' }}>
          <Box
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: '#00F5FF', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#000',
              fontWeight: 900,
              fontSize: '1.2rem'
            }}
          >
            W
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              display: { xs: 'none', sm: 'inline' },
              fontFamily: 'var(--font-space-grotesk)',
              letterSpacing: '-0.02em',
              color: 'white'
            }}
          >
            Whisperrkeep
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Whisperr Portal (Ctrl+Space)">
            <IconButton
              onClick={() => setIsEcosystemPortalOpen(true)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                '&:hover': { color: '#00F5FF', bgcolor: 'rgba(255, 255, 255, 0.05)' } 
              }}
            >
              <GripIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          {user && isCorePage && (
            <Tooltip title="AI Assistant">
              <IconButton
                onClick={openAIModal}
                sx={{ 
                  color: '#00F5FF', 
                  '&:hover': { bgcolor: alpha('#00F5FF', 0.1) } 
                }}
              >
                <SparklesIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          )}

          <DropdownMenu
            trigger={
              <IconButton title="Password Generator" sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                <KeyIcon sx={{ fontSize: 22 }} />
              </IconButton>
            }
            width="400px"
            align="right"
          >
            <Box sx={{ p: 2 }}>
              <PasswordGenerator />
            </Box>
          </DropdownMenu>

          {!user ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                try {
                  openIDMWindow();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to open authentication");
                }
              }}
              sx={{ 
                bgcolor: '#00F5FF', 
                color: '#000',
                fontWeight: 800,
                borderRadius: '12px',
                px: 3,
                '&:hover': { bgcolor: '#00D1DA' }
              }}
            >
              Connect
            </Button>
          ) : (
            <Box>
              <Button
                variant="text"
                size="small"
                onClick={handleOpenMenu}
                startIcon={<UserIcon size={18} strokeWidth={1.5} />}
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: '12px',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                }}
              >
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' }, fontWeight: 700 }}>
                  {user.name || user.email}
                </Typography>
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 240,
                    bgcolor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    backgroundImage: 'none',
                    color: 'white'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'white' }}>
                    {user.name || user.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                <MenuItem 
                  onClick={() => {
                    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'whisperrnote.space';
                    const idSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'id';
                    window.location.href = `https://${idSubdomain}.${domain}/settings?source=${encodeURIComponent(window.location.origin)}`;
                    handleCloseMenu();
                  }} 
                  sx={{ py: 1.5, px: 2.5, gap: 1.5 }}
                >
                  <SettingsIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.6)" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Account Settings</Typography>
                </MenuItem>
                <MenuItem
                  sx={{ py: 1.5, px: 2.5, gap: 1.5 }}
                  onClick={() => {
                    import("@/app/(protected)/masterpass/logic").then(({ masterPassCrypto }) => {
                      masterPassCrypto.lockNow();
                      sessionStorage.setItem("masterpass_return_to", window.location.pathname);
                      window.location.replace("/masterpass");
                    });
                    handleCloseMenu();
                  }}
                >
                  <LockIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.6)" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Lock Vault</Typography>
                </MenuItem>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                <MenuItem
                  onClick={async () => {
                    handleCloseMenu();
                    await logout();
                  }}
                  sx={{ py: 1.5, px: 2.5, gap: 1.5, color: '#FF4D4D' }}
                >
                  <LogOutIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
      <EcosystemPortal 
        open={isEcosystemPortalOpen} 
        onClose={() => setIsEcosystemPortalOpen(false)} 
      />
    </AppBar>
  );
}
