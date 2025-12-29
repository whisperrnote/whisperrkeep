"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Stack, 
  IconButton, 
  alpha, 
  CircularProgress,
  Avatar
} from "@mui/material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ShieldIcon from "@mui/icons-material/Shield";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAppwrite } from "@/app/appwrite-provider";
import {
  appwriteDatabases,
  APPWRITE_DATABASE_ID,
  APPWRITE_COLLECTION_TOTPSECRETS_ID,
  Query,
  AppwriteService,
} from "@/lib/appwrite";
import { masterPassCrypto } from "@/app/(protected)/masterpass/logic";

export default function OverviewPage() {
  const { user } = useAppwrite();
  const [stats, setStats] = useState({ totalCreds: 0, totpCount: 0 });
  const [recent, setRecent] = useState<
    Array<{ $id: string; name: string; username?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [dupGroups, setDupGroups] = useState<
    Array<{ key: string; count: number; fields: string[]; ids: string[] }>
  >([]);

  const locked = useMemo(() => !masterPassCrypto.isVaultUnlocked(), []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      try {
        const credsResp = (await AppwriteService.listCredentials(
          user.$id,
          1,
          0,
          [Query.orderDesc("$updatedAt")],
        )) as { total: number; documents: Array<Record<string, unknown>> };

        let totpCount = 0;
        try {
          const totpResp = (await appwriteDatabases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_TOTPSECRETS_ID,
            [Query.equal("userId", user.$id), Query.limit(1)],
          )) as { documents: Array<Record<string, unknown>>; total?: number };
          totpCount =
            (
              totpResp as {
                total?: number;
                documents: Array<Record<string, unknown>>;
              }
            ).total ?? totpResp.documents.length;
        } catch {
        }

        const totalCreds =
          (
            credsResp as {
              total?: number;
              documents?: Array<Record<string, unknown>>;
            }
          ).total ??
          credsResp.documents?.length ??
          0;

        let dupGroupsLocal: Array<{
          key: string;
          count: number;
          fields: string[];
          ids: string[];
        }> = [];
        try {
          const windowSize = Math.min(50, totalCreds);
          const recentWindow = (await AppwriteService.listCredentials(
            user.$id,
            windowSize,
            0,
            [Query.orderDesc("$updatedAt")],
          )) as { documents?: Array<Record<string, unknown>> };
          const items = recentWindow.documents || [];
          const fieldCandidates = [
            "username",
            "password",
            "url",
            "notes",
            "customFields",
          ];
          const fieldsPresent = fieldCandidates.filter((f) =>
            items.some((it) => {
              const val = (it as Record<string, unknown>)[f];
              return val != null && String(val).trim() !== "";
            }),
          );
          const groups = new Map<string, { ids: string[] }>();

          const normalize = (v: unknown) => {
            if (v == null) return "";
            if (typeof v === "string") return v.trim().toLowerCase();
            try {
              return JSON.stringify(v);
            } catch {
              return String(v);
            }
          };

          for (const it of items) {
            const sigObj: Record<string, unknown> = {};
            for (const f of fieldsPresent)
              sigObj[f] = normalize((it as Record<string, unknown>)[f]);
            const signature = JSON.stringify(sigObj);
            const entry = groups.get(signature) || { ids: [] };
            entry.ids.push(String((it as Record<string, unknown>)["$id"]));
            groups.set(signature, entry);
          }

          dupGroupsLocal = Array.from(groups.entries())
            .filter(([, v]) => v.ids.length > 1)
            .map(([k, v]) => ({
              key: k,
              count: v.ids.length,
              fields: fieldsPresent,
              ids: v.ids,
            }));
        } catch {}

        let recentItems: Array<{
          $id: string;
          name: string;
          username?: string;
        }> = [];
        try {
          const recentDocs = (await AppwriteService.listRecentCredentials(
            user.$id,
            5,
          )) as Array<Record<string, unknown>>;
          recentItems = recentDocs.map((d) => ({
            $id: String(d.$id as unknown as string),
            name: (d.name as string) ?? (d.title as string) ?? "Untitled",
            username: d.username as string | undefined,
          }));
        } catch {
          recentItems = (credsResp.documents || [])
            .slice(0, 5)
            .map((d) => ({
              $id: String((d as Record<string, unknown>)["$id"]),
              name:
                ((d as Record<string, unknown>)["name"] as string) ??
                ((d as Record<string, unknown>)["title"] as string) ??
                "Untitled",
              username: (d as Record<string, unknown>)["username"] as
                | string
                | undefined,
            }));
        }

        if (!cancelled) {
          setStats({ totalCreds, totpCount });
          setRecent(locked ? [] : recentItems);
          setDupGroups(locked ? [] : dupGroupsLocal);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    locked,
  ]);

  if (!user) return null;

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      bgcolor: 'transparent',
      display: 'flex',
      justifyContent: 'center',
      p: { xs: 2, md: 4 }
    }}>
      <Box sx={{ width: '100%', maxWidth: '1100px' }}>
        {/* Header */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          spacing={2}
          sx={{ mb: 5 }}
        >
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 900, 
              fontFamily: 'var(--font-space-grotesk)',
              letterSpacing: '-0.03em',
              mb: 0.5
            }}>
              Overview
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
              A quick snapshot of your secure vault.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button 
              component={Link}
              href="/credentials/new"
              variant="contained" 
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                borderRadius: '14px', 
                px: 3, 
                py: 1.2, 
                fontWeight: 800,
                bgcolor: '#00F5FF',
                color: '#000',
                '&:hover': { bgcolor: '#00D1DA' }
              }}
            >
              Add Credential
            </Button>
            <Button 
              component={Link}
              href="/import"
              variant="outlined" 
              startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                borderRadius: '14px', 
                px: 3, 
                py: 1.2, 
                fontWeight: 700,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.2)', bgcolor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              Import
            </Button>
          </Stack>
        </Stack>

        {locked && (
          <Paper sx={{ 
            p: 2.5, 
            mb: 4, 
            borderRadius: '20px', 
            bgcolor: alpha('#FFB000', 0.05),
            border: '1px solid',
            borderColor: alpha('#FFB000', 0.2),
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <WarningIcon sx={{ fontSize: 24, color: "#FFB000" }} />
            <Typography variant="body2" sx={{ color: '#FFB000', fontWeight: 600 }}>
              Your vault is locked. Unlock to view full statistics and recent activity.
            </Typography>
          </Paper>
        )}

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Credentials', value: stats.totalCreds, icon: VpnKeyIcon, color: '#3B82F6' },
            { label: 'TOTP Codes', value: stats.totpCount, icon: ShieldIcon, color: '#10B981' },
            { label: 'Recent Activity', value: Math.min(stats.totalCreds, 5), icon: AccessTimeIcon, color: '#F59E0B' },
            { label: 'Security Alerts', value: 0, icon: WarningIcon, color: '#EF4444' }
          ].map((stat, i) => (
            <Grid size={{ xs: 6, md: 3 }} key={i}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: '24px', 
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, fontFamily: 'var(--font-space-grotesk)' }}>
                    {loading ? <CircularProgress size={20} thickness={6} sx={{ color: 'rgba(255, 255, 255, 0.2)' }} /> : stat.value}
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '12px', 
                  bgcolor: alpha(stat.color, 0.1), 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <stat.icon sx={{ fontSize: 20, color: stat.color }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Items */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: '28px', 
              bgcolor: 'rgba(10, 10, 10, 0.9)',
              backdropFilter: 'blur(25px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, fontFamily: 'var(--font-space-grotesk)' }}>
                Recent Items
              </Typography>
              <Stack spacing={1.5}>
                {loading ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: '#00F5FF' }} />
                  </Box>
                ) : recent.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', py: 4, textAlign: 'center' }}>
                    No items found in your vault.
                  </Typography>
                ) : (
                  recent.map((item) => (
                    <Box 
                      key={item.$id}
                      component={Link}
                      href={`/dashboard?focus=${item.$id}`}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: '18px',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid transparent',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '12px', 
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#00F5FF'
                        }}>
                          {item.name?.[0]?.toUpperCase() ?? "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                          {item.username && (
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
                              {item.username}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <ChevronRightIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Duplicate Items */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: '28px', 
              bgcolor: 'rgba(10, 10, 10, 0.9)',
              backdropFilter: 'blur(25px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%'
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>
                  Duplicates
                </Typography>
                <Box sx={{ 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: '10px', 
                  bgcolor: alpha('#00F5FF', 0.1),
                  color: '#00F5FF',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {dupGroups.length} GROUPS
                </Box>
              </Stack>

              <Stack spacing={2}>
                {loading ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: '#00F5FF' }} />
                  </Box>
                ) : dupGroups.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ShieldIcon sx={{ fontSize: 40, color: "rgba(255, 255, 255, 0.1)", mb: '12px' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                      No duplicates detected.
                    </Typography>
                  </Box>
                ) : (
                  dupGroups.map((g, idx) => (
                    <Paper key={g.key} sx={{ 
                      p: 2.5, 
                      borderRadius: '20px', 
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          Group #{idx + 1}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00F5FF', fontWeight: 700 }}>
                          {g.count} matches
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mb: 2 }}>
                        Matching: {g.fields.join(", ")}
                      </Typography>
                      <Button 
                        component={Link}
                        href={`/dashboard?focus=${g.ids[0]}`}
                        fullWidth 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderRadius: '12px', 
                          fontWeight: 700,
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff'
                        }}
                      >
                        Review Group
                      </Button>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
