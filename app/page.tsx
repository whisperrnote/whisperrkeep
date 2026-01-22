"use client";

import ShieldIcon from "@mui/icons-material/Shield";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAppwrite } from "@/app/appwrite-provider";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Features = dynamic(() => import("@/components/landing/Features"), { 
  loading: () => <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress color="primary" /></Box>,
  ssr: false 
});
const Trust = dynamic(() => import("@/components/landing/Trust"), { ssr: false });
const Testimonials = dynamic(() => import("@/components/landing/Testimonials"), { ssr: false });
const FAQ = dynamic(() => import("@/components/landing/FAQ"), { ssr: false });
const CTA = dynamic(() => import("@/components/landing/CTA"), { ssr: false });

export default function LandingPage() {
  const { user, openIDMWindow, isAuthenticating } = useAppwrite();
  const router = useRouter();
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.replace("/masterpass");
    }
  }, [user, router]);

  const handleViewDemo = () => {
    if (demoRef.current) {
      demoRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box sx={{ bgcolor: '#000', minHeight: '100vh', color: 'white', overflowX: 'hidden' }}>
      <Navbar />

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 15, md: 20 }, pb: 10, position: 'relative' }}>
        <Box sx={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.08) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <Stack spacing={4} alignItems="center" textAlign="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h1" sx={{ 
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
            fontWeight: 900,
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-space-grotesk)',
            maxWidth: '900px',
            lineHeight: 1.1
          }}>
            Your Passwords. <Box component="span" sx={{ color: '#00F5FF' }}>Protected</Box>. Everywhere.
          </Typography>

          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            maxWidth: '700px',
            fontWeight: 400,
            lineHeight: 1.6
          }}>
            Secure, simple password management for individuals and teams. Store
            unlimited passwords, generate strong credentials, and autofill with
            ease.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={isAuthenticating ? <CircularProgress size={20} color="inherit" /> : <ChevronRightIcon sx={{ fontSize: 20 }} />}
              onClick={() => {
                if (user) {
                  router.push("/dashboard");
                  return;
                }
                try {
                  openIDMWindow();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to open authentication");
                }
              }}
              sx={{
                bgcolor: '#00F5FF',
                color: '#000',
                px: 4,
                py: 2,
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: '#00D1DA',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(0, 245, 255, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {user ? "Go to Dashboard" : "Get Started Free"}
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={handleViewDemo}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                px: 4,
                py: 2,
                borderRadius: '16px',
                fontWeight: 700,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              View Demo
            </Button>
          </Stack>
        </Stack>

        {/* Dashboard Preview */}
        <Box
          ref={demoRef}
          sx={{
            mt: 12,
            width: '100%',
            maxWidth: '1000px',
            mx: 'auto',
            borderRadius: '32px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
        >
          {/* Preview Header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: 'rgba(255, 255, 255, 0.02)'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: '#00F5FF', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#000',
                fontWeight: 900
              }}>
                W
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Whisperrkeep</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {[SearchIcon, PersonIcon, SettingsIcon].map((Icon, i) => (
                <IconButton key={i} size="small" sx={{ color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                  <Icon sx={{ fontSize: 18 }} />
                </IconButton>
              ))}
            </Stack>
          </Box>

          {/* Preview Content */}
          <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>Dashboard</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>Welcome back! Here&apos;s your security overview.</Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Total Credentials', val: '24', icon: VpnKeyIcon, color: '#00F5FF' },
                { label: 'TOTP Codes', val: '8', icon: ShieldIcon, color: '#4CAF50' },
                { label: 'Recent Activity', val: '3', icon: AccessTimeIcon, color: '#FF9800' },
                { label: 'Security Alerts', val: '1', icon: WarningIcon, color: '#FF4D4D' },
              ].map((stat, i) => (
                <Grid key={i} size={{ xs: 6, md: 3 }}>
                  <Paper sx={{ 
                    p: 2.5, 
                    borderRadius: '20px', 
                    bgcolor: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundImage: 'none'
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{stat.val}</Typography>
                      </Box>
                      <stat.icon sx={{ fontSize: 24, color: stat.color }} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: '24px', 
                  bgcolor: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundImage: 'none',
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Quick Actions</Typography>
                  <Stack spacing={1.5}>
                    <Button fullWidth variant="contained" startIcon={<AddIcon sx={{ fontSize: 16 }} />} sx={{ bgcolor: '#00F5FF', color: '#000', borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}>Add Credential</Button>
                    <Button fullWidth variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />} sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '12px', fontWeight: 600, textTransform: 'none' }}>Backup</Button>
                    <Button fullWidth variant="outlined" startIcon={<DescriptionIcon sx={{ fontSize: 16 }} />} sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '12px', fontWeight: 600, textTransform: 'none' }}>Logs</Button>
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: '24px', 
                  bgcolor: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundImage: 'none'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Recent Items</Typography>
                  <Stack spacing={1}>
                    {[
                      { name: "GitHub", user: "john@example.com", icon: "🐙" },
                      { name: "Gmail", user: "john.doe@gmail.com", icon: "📧" },
                      { name: "AWS Console", user: "johndoe", icon: "☁️" },
                    ].map((item, i) => (
                      <Box key={i} sx={{ 
                        p: 1.5, 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                        transition: 'all 0.2s ease'
                      }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="h6">{item.icon}</Typography>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>{item.user}</Typography>
                          </Box>
                        </Stack>
                        <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Fade out effect */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: '100px', 
            background: 'linear-gradient(to top, rgba(10, 10, 10, 1), transparent)',
            pointerEvents: 'none'
          }} />
        </Box>
      </Container>

      <Features />
      <Trust />
      <Testimonials />
      <FAQ />
      <CTA />
    </Box>
  );
}
