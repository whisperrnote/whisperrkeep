"use client";

import { useState, useEffect, useCallback } from "react";
import PersonIcon from "@mui/icons-material/Person";
import ShieldIcon from "@mui/icons-material/Shield";
import PaletteIcon from "@mui/icons-material/Palette";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import LogoutIcon from "@mui/icons-material/Logout";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import FolderIcon from "@mui/icons-material/Folder";
import EditIcon from "@mui/icons-material/Edit";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Paper, 
  TextField, 
  IconButton, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  alpha, 
  useTheme,
  Stack,
  Switch,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Tooltip
} from "@mui/material";
import {
  setVaultTimeout,
  getVaultTimeout,
  masterPassCrypto,
} from "@/app/(protected)/masterpass/logic";
import { useAppwrite } from "@/app/appwrite-provider";
import { PasskeySetup } from "@/components/overlays/passkeySetup";
import {
  appwriteAccount,
  createFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  AppwriteService,
  updateUserProfile,
  exportAllUserData,
  deleteUserAccount,
  resetMasterpassAndWipe,
} from "@/lib/appwrite";
import toast from "react-hot-toast";
import VaultGuard from "@/components/layout/VaultGuard";
import { useSudo } from "@/app/context/SudoContext";

function SettingsCard({ title, icon: Icon, children, danger = false }: { title: string, icon: any, children: React.ReactNode, danger?: boolean }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '24px',
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid',
        borderColor: danger ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 255, 255, 0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: '10px', 
          bgcolor: danger ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 240, 255, 0.1)',
          color: danger ? '#FF3B30' : 'primary.main',
          display: 'flex'
        }}>
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Paper>
  );
}

export default function SettingsPage() {
  const muiTheme = useTheme();
  const { user, logout } = useAppwrite();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [vaultTimeout, setVaultTimeoutState] = useState(getVaultTimeout());
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [deleteStep, setDeleteStep] = useState<
    "initial" | "confirm"
  >("initial");
  const { requestSudo } = useSudo();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passkeySetupOpen, setPasskeySetupOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    credentials: true,
    totpSecrets: true,
    folders: true,
  });

  // Passkey Management State
  interface PasskeyUIItem {
    $id: string;
    name: string;
    created: string;
  }
  const [passkeys, setPasskeys] = useState<PasskeyUIItem[]>([]);
  const [editingPasskey, setEditingPasskey] = useState<PasskeyUIItem | null>(null);
  const [passkeyRenameOpen, setPasskeyRenameOpen] = useState(false);
  const [passkeyRenameValue, setPasskeyRenameValue] = useState("");
  const [passkeyToDelete, setPasskeyToDelete] = useState<PasskeyUIItem | null>(null);
  const [isDeletePasskeyModalOpen, setIsDeletePasskeyModalOpen] = useState(false);

  // Folder Management State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  type FolderItem = { $id: string; name: string };
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [folderName, setFolderName] = useState("");
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        if (!user) return;
        const res = await listFolders(user.$id);
        const items = Array.isArray(res)
          ? res
          : res &&
            (res as { documents?: FolderItem[]; items?: FolderItem[] })
              .documents
            ? (res as { documents?: FolderItem[] }).documents!
            : res &&
              (res as { documents?: FolderItem[]; items?: FolderItem[] })
                .items
              ? (res as { items?: FolderItem[] }).items!
              : [];
        setFolders(items);
      } catch (err) {
        console.error("Failed to load folders", err);
        setFolders([]);
      }
    };
    loadFolders();
  }, [user]);

  // Fetch passkey status
  const loadPasskeys = useCallback(async () => {
    if (!user?.$id) return;
    try {
      const entries = await AppwriteService.listKeychainEntries(user.$id);
      const passkeyEntries = entries
        .filter((k) => k.type === "passkey")
        .map((k) => {
          let name = "Unnamed Passkey";
          let created = k.$createdAt;
          try {
            if (k.params) {
              const params = JSON.parse(k.params);
              if (params.name) name = params.name;
              if (params.created) created = params.created;
            }
          } catch {
            // ignore json parse error
          }
          return {
            $id: k.$id,
            name,
            created,
          };
        });
      setPasskeys(passkeyEntries);
    } catch (error) {
      console.error("Failed to load passkeys", error);
    }
  }, [user?.$id]);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const handleTogglePasskey = async () => {
    if (!user?.$id) return;
    setPasskeySetupOpen(true);
  };

  const handleRenamePasskey = async () => {
    if (!editingPasskey || !passkeyRenameValue.trim()) return;
    setSaving(true);
    try {
      const entries = await AppwriteService.listKeychainEntries(user!.$id);
      const entry = entries.find((k) => k.$id === editingPasskey.$id);
      if (entry) {
        const params = entry.params ? JSON.parse(entry.params) : {};
        params.name = passkeyRenameValue;
        await AppwriteService.updateKeychainEntry(entry.$id, {
          params: JSON.stringify(params),
        });
        toast.success("Passkey renamed!");
        loadPasskeys();
        setPasskeyRenameOpen(false);
        setEditingPasskey(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to rename passkey.");
    }
    setSaving(false);
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;
    setDangerLoading(true);
    try {
      await AppwriteService.deleteKeychainEntry(passkeyToDelete.$id);
      toast.success("Passkey deleted.");
      loadPasskeys();
      setIsDeletePasskeyModalOpen(false);
      setPasskeyToDelete(null);

      if (passkeys.length <= 1) {
        await AppwriteService.removePasskey(user!.$id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete passkey.");
    }
    setDangerLoading(false);
  };

  const openRenamePasskey = (pk: PasskeyUIItem) => {
    setEditingPasskey(pk);
    setPasskeyRenameValue(pk.name);
    setPasskeyRenameOpen(true);
  };

  const openDeletePasskey = (pk: PasskeyUIItem) => {
    setPasskeyToDelete(pk);
    setIsDeletePasskeyModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (!user) throw new Error("Not authenticated");
      await updateUserProfile(user.$id, { name: profile.name });
      toast.success("Profile updated!");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to update profile.");
    }
    setSaving(false);
  };

  const handleExportData = async (forDelete: boolean = false, options?: { credentials: boolean; totpSecrets: boolean; folders: boolean }) => {
    const toastId = toast.loading("Exporting data...");
    try {
      if (!user?.$id) throw new Error("Not authenticated");
      const data = await exportAllUserData(user.$id, options);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whisperrkeep-export-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!", { id: toastId });
      if (forDelete) {
        setDeleteStep("confirm");
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to export data.", { id: toastId });
    }
  };

  const onExportClick = () => {
    setIsExportModalOpen(true);
  };

  const confirmExport = () => {
    setIsExportModalOpen(false);
    handleExportData(false, exportOptions);
  };

  const handleDeleteAccount = async () => {
    setDangerLoading(true);
    try {
      if (!user?.$id) throw new Error("Not authenticated");
      await deleteUserAccount(user.$id);
      toast.success("Account deleted successfully. Logging out...");
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setDangerLoading(false);
      setIsDeleteAccountModalOpen(false);
    }
  };

  const handleResetMasterPassword = async () => {
    setDangerLoading(true);
    try {
      if (!user?.$id) throw new Error("Not authenticated");
      await resetMasterpassAndWipe(user.$id);
      toast.success(
        "Master password reset successfully. All data has been wiped. Logging out...",
      );
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to reset master password.");
    } finally {
      setDangerLoading(false);
      setIsResetModalOpen(false);
    }
  };

  const resetDeleteFlow = () => {
    setIsDeleteAccountModalOpen(false);
    setDeleteStep("initial");
  };

  const handleVaultTimeoutChange = (minutes: number) => {
    setVaultTimeout(minutes);
    setVaultTimeoutState(minutes);
    toast.success("Vault timeout updated!");
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwords.new.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    setSaving(true);
    try {
      await appwriteAccount.updatePassword(passwords.new, passwords.current);
      if (user?.$id) {
        await masterPassCrypto.changeMasterPassword(passwords.new, user.$id);
      }
      toast.success("Password updated successfully!");
      setIsChangePasswordModalOpen(false);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setPasswordError(err.message || "Failed to update password.");
    }
    setSaving(false);
  };

  const handleSaveFolder = async () => {
    if (!folderName || !user) return;
    setSaving(true);
    try {
      if (editingFolder) {
        const updatedFolder = await updateFolder(editingFolder.$id, {
          name: folderName,
        });
        setFolders(
          folders.map((f) => (f.$id === editingFolder.$id ? updatedFolder : f)),
        );
        toast.success("Folder updated!");
      } else {
        const newFolder = await createFolder({
          name: folderName,
          userId: user.$id,
          parentFolderId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          $sequence: 0,
          $collectionId: "",
          $databaseId: "",
          $permissions: [],
        });
        setFolders([...folders, newFolder]);
        toast.success("Folder created!");
      }
      setIsFolderModalOpen(false);
      setEditingFolder(null);
      setFolderName("");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to save folder.");
    }
    setSaving(false);
  };

  const openFolderModal = (folder: FolderItem | null = null) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderName(folder.name);
    } else {
      setEditingFolder(null);
      setFolderName("");
    }
    setIsFolderModalOpen(true);
  };

  const openDeleteFolderModal = (folder: FolderItem) => {
    setFolderToDelete(folder);
    setIsDeleteFolderModalOpen(true);
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete || !user) return;
    setDangerLoading(true);
    try {
      await deleteFolder(folderToDelete.$id);
      setFolders(folders.filter((f) => f.$id !== folderToDelete.$id));
      toast.success("Folder deleted!");
      setIsDeleteFolderModalOpen(false);
      setFolderToDelete(null);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to delete folder.");
    }
    setDangerLoading(false);
  };

  return (
    <VaultGuard>
      <Box sx={{ minHeight: '100vh', py: 6, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', letterSpacing: '-0.03em', mb: 1 }}>
              Settings
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Manage your account, security, and vault preferences
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Profile Settings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SettingsCard title="Profile" icon={PersonIcon}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={profile.email}
                    disabled
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.01)' } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}
                  >
                    {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </Stack>
              </SettingsCard>
            </Grid>

            {/* Security Settings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SettingsCard title="Security" icon={ShieldIcon}>
                <Stack spacing={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<VpnKeyIcon sx={{ fontSize: 18 }} />}
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    sx={{ borderRadius: '12px', py: 1.5, justifyContent: 'flex-start', px: 2, fontWeight: 600 }}
                  >
                    Change Master Password
                  </Button>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Passkeys</Typography>
                      <Button size="small" onClick={handleTogglePasskey} startIcon={<AddIcon sx={{ fontSize: 16 }} />}>
                        Add Passkey
                      </Button>
                    </Box>

                    {passkeys.length > 0 ? (
                      <Stack spacing={1}>
                        {passkeys.map((pk) => (
                          <Paper key={pk.$id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{pk.name}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Added {new Date(pk.created).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box>
                              <IconButton size="small" onClick={() => openRenamePasskey(pk)} sx={{ color: 'text.secondary' }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => openDeletePasskey(pk)} sx={{ color: 'error.main' }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        No passkeys added yet.
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Vault Auto-Lock</Typography>
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      {[5, 10, 15, 30].map((minutes) => (
                        <Grid size={{ xs: 3 }} key={minutes}>
                          <Button
                            fullWidth
                            variant={vaultTimeout === minutes ? "contained" : "outlined"}
                            size="small"
                            onClick={() => handleVaultTimeoutChange(minutes)}
                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                          >
                            {minutes}m
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={vaultTimeout}
                        onChange={(e) => handleVaultTimeoutChange(parseInt(e.target.value) || 10)}
                        sx={{ width: 80 }}
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        minutes of inactivity before auto-lock
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </SettingsCard>
            </Grid>

            {/* Folder Management */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SettingsCard title="Folders" icon={FolderIcon}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button size="small" onClick={() => openFolderModal()} startIcon={<AddIcon sx={{ fontSize: 16 }} />}>
                    New Folder
                  </Button>
                </Box>
                <Stack spacing={1}>
                  {folders.length > 0 ? (
                    folders.map((folder) => (
                      <Paper key={folder.$id} sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{folder.name}</Typography>
                        <Box>
                          <IconButton size="small" onClick={() => openFolderModal(folder)} sx={{ color: 'text.secondary' }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => openDeleteFolderModal(folder)} sx={{ color: 'error.main' }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No folders created yet.
                    </Typography>
                  )}
                </Stack>
              </SettingsCard>
            </Grid>

            {/* Data Management */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SettingsCard title="Data" icon={DownloadIcon}>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                    onClick={onExportClick}
                    sx={{ borderRadius: '12px', py: 1.5, justifyContent: 'flex-start', px: 2, fontWeight: 600 }}
                  >
                    Export Vault Data
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<UploadIcon sx={{ fontSize: 18 }} />}
                    onClick={() => (window.location.href = "/import")}
                    sx={{ borderRadius: '12px', py: 1.5, justifyContent: 'flex-start', px: 2, fontWeight: 600 }}
                  >
                    Import Vault Data
                  </Button>
                </Stack>
              </SettingsCard>
            </Grid>

            {/* Danger Zone */}
            <Grid size={{ xs: 12 }}>
              <SettingsCard title="Danger Zone" icon={WarningIcon} danger>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FF3B30', mb: 1 }}>Delete Account</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => setIsDeleteAccountModalOpen(true)}
                      disabled={dangerLoading}
                      sx={{ borderRadius: '12px', fontWeight: 700 }}
                    >
                      Delete Account
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FF3B30', mb: 1 }}>Reset Vault</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Wipe all encrypted data but keep your account. You will be prompted to set a new master password.
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => setIsResetModalOpen(true)}
                      disabled={dangerLoading}
                      sx={{ borderRadius: '12px', fontWeight: 700 }}
                    >
                      Reset and Wipe Data
                    </Button>
                  </Grid>
                </Grid>
              </SettingsCard>
            </Grid>
          </Grid>

          {/* Mobile Logout */}
          <Box sx={{ mt: 6, display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
            <Button
              variant="text"
              color="error"
              startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
              onClick={logout}
              sx={{ fontWeight: 700 }}
            >
              Logout
            </Button>
          </Box>
        </Container>

        {/* Modals */}
        {/* Export Modal */}
        <Dialog 
          open={isExportModalOpen} 
          onClose={() => setIsExportModalOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>Export Data</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Select the data you want to export. Your data will be exported as a JSON file.
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={<Checkbox checked={exportOptions.credentials} onChange={(e) => setExportOptions({ ...exportOptions, credentials: e.target.checked })} />}
                label="Login Credentials"
              />
              <FormControlLabel
                control={<Checkbox checked={exportOptions.totpSecrets} onChange={(e) => setExportOptions({ ...exportOptions, totpSecrets: e.target.checked })} />}
                label="TOTP Secrets"
              />
              <FormControlLabel
                control={<Checkbox checked={exportOptions.folders} onChange={(e) => setExportOptions({ ...exportOptions, folders: e.target.checked })} />}
                label="Folders"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setIsExportModalOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button onClick={confirmExport} variant="contained" fullWidth sx={{ borderRadius: '12px' }}>Export Selected</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Modal */}
        <Dialog 
          open={isDeleteAccountModalOpen} 
          onClose={resetDeleteFlow}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', color: '#FF3B30' }}>
            {deleteStep === "initial" ? "Export Required" : "Final Confirmation"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {deleteStep === "initial" 
                ? "This is a permanent action. To prevent data loss, you must export your data first."
                : "Your data has been exported. Are you absolutely sure you want to permanently delete your account? This cannot be undone."}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={resetDeleteFlow} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            {deleteStep === "initial" ? (
              <Button variant="contained" color="error" fullWidth onClick={() => handleExportData(true)} sx={{ borderRadius: '12px' }}>Export & Continue</Button>
            ) : (
              <Button variant="contained" color="error" fullWidth onClick={() => requestSudo({ onSuccess: handleDeleteAccount })} sx={{ borderRadius: '12px' }}>Delete Forever</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Reset Vault Modal */}
        <Dialog 
          open={isResetModalOpen} 
          onClose={() => setIsResetModalOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', color: '#FF3B30' }}>Reset Vault?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Are you sure you want to reset your master password? All your encrypted data will be permanently deleted. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setIsResetModalOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button variant="contained" color="error" fullWidth onClick={handleResetMasterPassword} sx={{ borderRadius: '12px' }}>Reset and Wipe</Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Modal */}
        <Dialog 
          open={isChangePasswordModalOpen} 
          onClose={() => setIsChangePasswordModalOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>Change Password</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
              />
              {passwordError && <Typography color="error" variant="caption">{passwordError}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setIsChangePasswordModalOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button onClick={handleChangePassword} variant="contained" fullWidth disabled={saving} sx={{ borderRadius: '12px' }}>
              {saving ? "Saving..." : "Save Password"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Folder Modal */}
        <Dialog 
          open={isFolderModalOpen} 
          onClose={() => setIsFolderModalOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>
            {editingFolder ? "Rename Folder" : "Create Folder"}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              placeholder="Folder Name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              variant="filled"
              sx={{ mt: 1 }}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setIsFolderModalOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button onClick={handleSaveFolder} variant="contained" fullWidth disabled={saving || !folderName} sx={{ borderRadius: '12px' }}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Folder Modal */}
        <Dialog 
          open={isDeleteFolderModalOpen} 
          onClose={() => setIsDeleteFolderModalOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', color: '#FF3B30' }}>Delete Folder</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Are you sure you want to delete the folder &quot;{folderToDelete?.name}&quot;? This will not delete the credentials inside it.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setIsDeleteFolderModalOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button variant="contained" color="error" fullWidth onClick={handleDeleteFolder} disabled={dangerLoading} sx={{ borderRadius: '12px' }}>
              {dangerLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Passkey Rename Modal */}
        <Dialog 
          open={passkeyRenameOpen} 
          onClose={() => setPasskeyRenameOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>Rename Passkey</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              value={passkeyRenameValue}
              onChange={(e) => setPasskeyRenameValue(e.target.value)}
              placeholder="Passkey Name"
              variant="filled"
              sx={{ mt: 1 }}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setPasskeyRenameOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button onClick={handleRenamePasskey} variant="contained" fullWidth disabled={saving || !passkeyRenameValue.trim()} sx={{ borderRadius: '12px' }}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Passkey Modal */}
        <Dialog 
          open={isDeletePasskeyModalOpen} 
          onClose={() => setIsDeletePasskeyModalOpen(false)}
          PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundImage: 'none' } }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', color: '#FF3B30' }}>Delete Passkey</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Are you sure you want to delete the passkey &ldquo;{passkeyToDelete?.name}&rdquo;? You will no longer be able to use it to unlock your vault.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1.5 }}>
            <Button onClick={() => setIsDeletePasskeyModalOpen(false)} variant="outlined" fullWidth sx={{ borderRadius: '12px' }}>Cancel</Button>
            <Button variant="contained" color="error" fullWidth onClick={handleDeletePasskey} disabled={dangerLoading} sx={{ borderRadius: '12px' }}>
              {dangerLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <PasskeySetup
          isOpen={passkeySetupOpen}
          onClose={() => setPasskeySetupOpen(false)}
          userId={user?.$id || ""}
          onSuccess={() => {
            loadPasskeys();
          }}
        />
      </Box>
    </VaultGuard>
  );
}
