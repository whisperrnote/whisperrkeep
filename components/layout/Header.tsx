"use client";

import { usePathname } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTheme } from "@mui/material";
import { useAppwrite } from "@/app/appwrite-provider";
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Button, 
  alpha,
  Tooltip,
  Menu,
  MenuItem,
  Divider
} from "@mui/material";
import AppsIcon from "@mui/icons-material/Apps";
import { useAI } from "@/app/context/AIContext";
import { useState, useEffect } from "react";
import EcosystemPortal from "../common/EcosystemPortal";
import { fetchProfilePreview, getCachedProfilePreview } from "@/lib/profile-preview";
import { getUserProfilePicId } from "@/lib/user-utils";
import Avatar from "@mui/material/Avatar";

// Pages that should use the simplified layout (no sidebar/header)
const SIMPLIFIED_LAYOUT_PATHS = ["/"];

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAppwrite();
  const { openAIModal } = useAI();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const profilePicId = getUserProfilePicId(user);
    const cached = getCachedProfilePreview(profilePicId || undefined);
    if (cached !== undefined && mounted) {
      setProfileUrl(cached ?? null);
    }

    const fetchPreview = async () => {
      try {
        if (profilePicId) {
          const url = await fetchProfilePreview(profilePicId, 64, 64);
          if (mounted) setProfileUrl(url as unknown as string);
        } else if (mounted) setProfileUrl(null);
      } catch (err) {
        if (mounted) setProfileUrl(null);
      }
    };

    fetchPreview();
    return () => { mounted = false; };
  }, [user]);

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

  // Don't render the header on simplified layout pages
  if (SIMPLIFIED_LAYOUT_PATHS.includes(pathname)) {
    return null;
  }

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
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
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={onMenuClick}
            sx={{ 
              display: { lg: 'none' },
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                fontSize: '1.1rem'
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
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="AI Assistant">
            <IconButton
              onClick={openAIModal}
              sx={{ 
                color: '#00F5FF', 
                '&:hover': { bgcolor: alpha('#00F5FF', 0.1) } 
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Whisperr Portal (Ctrl+Space)">
            <IconButton
              onClick={() => setIsEcosystemPortalOpen(true)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                '&:hover': { color: '#00F5FF', bgcolor: 'rgba(255, 255, 255, 0.05)' } 
              }}
            >
              <AppsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Box>
            <IconButton 
              onClick={handleProfileClick}
              sx={{ 
                p: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' } 
              }}
            >
              <Avatar 
                src={profileUrl || undefined}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'rgba(0, 240, 255, 0.1)',
                  color: '#00F5FF',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  borderRadius: '10px'
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </Avatar>
            </IconButton>
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
              <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  src={profileUrl || undefined}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: 'primary.main',
                    color: '#000',
                    borderRadius: '12px',
                    fontWeight: 900
                  }}
                >
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'white', noWrap: true }}>
                    {user?.name || user?.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
              <MenuItem 
                component="a" 
                href={`https://${process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'id'}.${process.env.NEXT_PUBLIC_DOMAIN || 'whisperrnote.space'}/settings?source=${encodeURIComponent(window.location.origin)}`}
                onClick={handleCloseMenu} 
                sx={{ py: 1.5, px: 2.5, gap: 1.5 }}
              >
                <SettingsIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.6)" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Account Settings</Typography>
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
              <MenuItem
                onClick={async () => {
                  handleCloseMenu();
                  await logout();
                }}
                sx={{ py: 1.5, px: 2.5, gap: 1.5, color: '#FF4D4D' }}
              >
                <LogoutIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
      <EcosystemPortal 
        open={isEcosystemPortalOpen} 
        onClose={() => setIsEcosystemPortalOpen(false)} 
      />
    </AppBar>
  );
}
