"use client";

import ShieldIcon from "@mui/icons-material/Shield";
import LockIcon from "@mui/icons-material/Lock";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import RefreshIcon from "@mui/icons-material/Refresh";
import PublicIcon from "@mui/icons-material/Public";
import SyncIcon from "@mui/icons-material/Sync";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  IconButton,
  alpha,
  useTheme as useMuiTheme,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAppwrite } from "@/app/appwrite-provider";
import { useRouter } from "next/navigation";

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

  const features = [
    {
      icon: ShieldIcon,
      title: "Private Encryption",
      description:
        "Your data is encrypted on your device. We never see your passwords.",
    },
    {
      icon: VpnKeyIcon,
      title: "Secure Password Generator",
      description:
        "Create strong, unique passwords for all your accounts with one click.",
    },
    {
      icon: FingerprintIcon,
      title: "Biometric Authentication",
      description:
        "Quickly access your vault with fingerprint or face recognition.",
    },
    {
      icon: SyncIcon,
      title: "Automatic Syncing",
      description:
        "Your credentials sync automatically across all your devices.",
    },
    {
      icon: PublicIcon,
      title: "Cross-Platform Access",
      description: "Available on desktop, mobile, and as a browser extension.",
    },
    {
      icon: LockIcon,
      title: "Two-Factor Authentication",
      description: "Built-in TOTP code generator for added security.",
    },
  ];

  const testimonials = [
    {
      quote:
        "Whisperrkeep app has completely transformed how I manage my online security. I finally feel safe online.",
      name: "Sarah Johnson",
      role: "Software Developer",
      stars: 5,
    },
    {
      quote:
        "The best password manager I've used. Simple, secure, and works everywhere I need it to.",
      name: "Michael Chen",
      role: "Security Consultant",
      stars: 5,
    },
    {
      quote:
        "I was hesitant to use a password manager, but Whisperrkeep made it so easy. Now I can't imagine life without it.",
      name: "Elena Rodriguez",
      role: "Digital Marketer",
      stars: 5,
    },
  ];

  const faqs = [
    {
      question: "Is Whisperrkeep really secure?",
      answer:
        "Yes, Whisperrkeep uses private encryption, meaning your data is encrypted before it leaves your device. We never have access to your master password or any of your stored credentials.",
    },
    {
      question: "What happens if I forget my master password?",
      answer:
        "For security reasons, we cannot recover your master password. However, Whisperrkeep offers emergency recovery options that you can set up in advance.",
    },
    {
      question: "Can I use Whisperrkeep on all my devices?",
      answer:
        "Yes, Whisperrkeep is available on Windows, macOS, Linux, iOS, and Android. Your data syncs automatically across all your devices.",
    },
    {
      question: "Is Whisperrkeep free to use?",
      answer:
        "Whisperrkeep offers a free tier with essential features. Premium plans with advanced features start at $2.99/month.",
    },
  ];

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
                <Grid size={{ xs: 6, md: 3 }} key={i}>
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

      {/* Features Section */}
      <Box sx={{ py: 15, bgcolor: 'rgba(255, 255, 255, 0.01)', borderY: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-space-grotesk)' }}>
              Security-First Password Management
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: '700px', mx: 'auto' }}>
              Designed with your security and privacy as the top priority.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Paper sx={{ 
                  p: 4, 
                  height: '100%', 
                  borderRadius: '28px', 
                  bgcolor: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundImage: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: alpha('#00F5FF', 0.3),
                    bgcolor: 'rgba(255, 255, 255, 0.04)'
                  }
                }}>
                  <Box sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '16px', 
                    bgcolor: alpha('#00F5FF', 0.1), 
                    color: '#00F5FF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 3
                  }}>
                    <feature.icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>{feature.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>{feature.description}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Trust Section */}
      <Box sx={{ py: 15 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, fontFamily: 'var(--font-space-grotesk)' }}>
                Your Security Is Our Priority
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, lineHeight: 1.8 }}>
                With industry-leading encryption and rigorous security practices, Whisperrkeep ensures your digital life remains private and protected.
              </Typography>
              <Stack spacing={3}>
                {[
                  { icon: ShieldIcon, title: 'Advanced Encryption', desc: 'Military-grade encryption that protects your data at rest and in transit.', color: '#4CAF50' },
                  { icon: LockIcon, title: 'SOC 2 Certified', desc: 'Our security processes are regularly audited and certified by independent experts.', color: '#2196F3' },
                  { icon: FingerprintIcon, title: 'Private Access', desc: 'We never see your passwords. Your data is encrypted and decrypted locally.', color: '#9C27B0' },
                ].map((item, i) => (
                  <Stack key={i} direction="row" spacing={3} alignItems="flex-start">
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: '12px', 
                      bgcolor: alpha(item.color, 0.1), 
                      color: item.color 
                    }}>
                      <item.icon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>{item.desc}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ 
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-10%',
                  right: '-10%',
                  width: '120%',
                  height: '120%',
                  background: 'radial-gradient(circle, rgba(0, 245, 255, 0.05) 0%, transparent 70%)',
                  zIndex: 0
                }
              }}>
                <Paper sx={{ 
                  p: 1, 
                  borderRadius: '32px', 
                  bgcolor: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundImage: 'none',
                  position: 'relative',
                  zIndex: 1,
                  overflow: 'hidden'
                }}>
                  <Box component="img" src="https://images.unsplash.com/photo-1633265485768-30698f1d11bc?auto=format&fit=crop&q=80&w=1000" sx={{ width: '100%', borderRadius: '24px', display: 'block', opacity: 0.8 }} />
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 15, bgcolor: 'rgba(255, 255, 255, 0.01)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-space-grotesk)' }}>
              Trusted by Thousands
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              See what our users have to say about Whisperrkeep.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((t, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Paper sx={{ 
                  p: 5, 
                  height: '100%', 
                  borderRadius: '28px', 
                  bgcolor: 'rgba(10, 10, 10, 0.5)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundImage: 'none',
                  position: 'relative'
                }}>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 3 }}>
                    {[...Array(t.stars)].map((_, j) => (
                      <StarIcon key={j} sx={{ fontSize: 18, color: "#FFD700" }} />
                    ))}
                  </Stack>
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 4, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.7 }}>
                    &quot;{t.quote}&quot;
                  </Typography>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{t.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.role}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box sx={{ py: 15 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-space-grotesk)' }}>
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Everything you need to know about Whisperrkeep
            </Typography>
          </Box>

          <Stack spacing={2}>
            {faqs.map((faq, i) => (
              <Accordion key={i} sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.02)', 
                backgroundImage: 'none',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '20px !important',
                '&::before': { display: 'none' },
                overflow: 'hidden'
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255, 255, 255, 0.3)" }} />}>
                  <Typography sx={{ fontWeight: 700, py: 1 }}>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', pt: 3 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.7 }}>{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 20, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at bottom, rgba(0, 245, 255, 0.1) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, fontFamily: 'var(--font-space-grotesk)' }}>
            Ready to secure your digital life?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 6 }}>
            Join thousands of users who trust Whisperrkeep with their passwords.
          </Typography>
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
              px: 6,
              py: 2.5,
              borderRadius: '20px',
              fontWeight: 900,
              fontSize: '1.2rem',
              '&:hover': {
                bgcolor: '#00D1DA',
                transform: 'scale(1.05)',
                boxShadow: '0 20px 40px rgba(0, 245, 255, 0.4)'
              },
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {user ? "Go to Dashboard" : "Get Started Free"}
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'rgba(255, 255, 255, 0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            No credit card required • Free forever
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
