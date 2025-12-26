import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Plus, 
  X,
  Save,
  Globe,
  Tag,
  FileText,
  User,
  Lock
} from "lucide-react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  IconButton, 
  InputAdornment, 
  Box, 
  Typography, 
  Divider,
  alpha,
  useTheme,
  Grid
} from "@mui/material";
import { createCredential, updateCredential } from "@/lib/appwrite";
import type { Credentials } from "@/types/appwrite";
import { useAppwrite } from "@/app/appwrite-provider";
import { generateRandomPassword } from "@/utils/password";

export default function CredentialDialog({
  open,
  onClose,
  initial,
  onSaved,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Credentials | null;
  onSaved: () => void;
  prefill?: { name?: string; url?: string; username?: string };
}) {
  const { user } = useAppwrite();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [customFields, setCustomFields] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        username: initial.username || "",
        password: initial.password || "",
        url: initial.url || "",
        notes: initial.notes || "",
        tags: initial.tags ? initial.tags.join(", ") : "",
      });
      setCustomFields(
        initial.customFields ? JSON.parse(initial.customFields) : [],
      );
    } else {
      setForm({
        name: prefill?.name || "",
        username: prefill?.username || "",
        password: "",
        url: prefill?.url || "",
        notes: "",
        tags: "",
      });
      setCustomFields([]);
    }
  }, [initial, open, prefill]);

  const handleGeneratePassword = () => {
    setForm({ ...form, password: generateRandomPassword(16) });
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: Date.now().toString(), label: "", value: "" },
    ]);
  };

  const updateCustomField = (
    id: string,
    field: "label" | "value",
    value: string,
  ) => {
    setCustomFields(
      customFields.map((cf) => (cf.id === id ? { ...cf, [field]: value } : cf)),
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((cf) => cf.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      const credentialData: Omit<
        Credentials,
        "$id" | "$createdAt" | "$updatedAt"
      > = {
        userId: user.$id,
        itemType: initial?.itemType || "login",
        name: form.name.trim(),
        url: null,
        username: form.username.trim(),
        notes: null,
        totpId: initial?.totpId || null,
        cardNumber: initial?.cardNumber || null,
        cardholderName: initial?.cardholderName || null,
        cardExpiry: initial?.cardExpiry || null,
        cardCVV: initial?.cardCVV || null,
        cardPIN: initial?.cardPIN || null,
        cardType: initial?.cardType || null,
        folderId: initial?.folderId || null,
        tags: null,
        customFields: null,
        faviconUrl: null,
        isFavorite: initial?.isFavorite || false,
        isDeleted: initial?.isDeleted || false,
        deletedAt: initial?.deletedAt || null,
        lastAccessedAt: initial?.lastAccessedAt || null,
        passwordChangedAt: initial?.passwordChangedAt || null,
        password: form.password.trim(),
        createdAt:
          initial && initial.createdAt
            ? initial.createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        $sequence: 0,
        $collectionId: "",
        $databaseId: "",
        $permissions: [],
      };
      if (form.url && form.url.trim()) credentialData.url = form.url.trim();
      if (form.notes && form.notes.trim())
        credentialData.notes = form.notes.trim();
      if (form.tags && form.tags.trim()) {
        const tagsArr = form.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        if (tagsArr.length > 0) credentialData.tags = tagsArr;
      }
      if (customFields.length > 0)
        credentialData.customFields = JSON.stringify(customFields) as string;

      if (initial && initial.$id) {
        await updateCredential(initial.$id, credentialData);
      } else {
        await createCredential(credentialData);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || "Failed to save credential.");
    }
    setLoading(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '28px',
          bgcolor: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundImage: 'none',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ 
          p: 3, 
          pb: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 900,
          fontSize: '1.5rem'
        }}>
          {initial ? "Edit Credential" : "Add Credential"}
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                placeholder="e.g., GitHub, Gmail"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username/Email"
                placeholder="john@example.com"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={18} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter or generate password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  variant="filled"
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' }
                  }}
                />
                <IconButton 
                  onClick={handleGeneratePassword}
                  sx={{ 
                    bgcolor: 'rgba(0, 240, 255, 0.1)', 
                    color: 'primary.main',
                    borderRadius: '12px',
                    width: 56,
                    height: 56,
                    '&:hover': { bgcolor: 'rgba(0, 240, 255, 0.2)' }
                  }}
                >
                  <RefreshCw size={20} />
                </IconButton>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website URL"
                type="url"
                placeholder="https://example.com"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Globe size={18} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Comma separated: work, email, important"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Tag size={18} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                placeholder="Additional notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <FileText size={18} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)' }
                }}
              />
            </Grid>

            {/* Custom Fields */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Custom Fields
                </Typography>
                <Button
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={addCustomField}
                  sx={{ borderRadius: '8px' }}
                >
                  Add Field
                </Button>
              </Box>
              
              {customFields.map((field) => (
                <Box key={field.id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: '8px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, "value", e.target.value)}
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: '8px', bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
                  />
                  <IconButton onClick={() => removeCustomField(field.id)} size="small" color="error">
                    <X size={18} />
                  </IconButton>
                </Box>
              ))}
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" variant="caption" sx={{ mt: 2, display: 'block' }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
          <Button 
            onClick={onClose} 
            fullWidth 
            variant="outlined"
            sx={{ borderRadius: '12px', py: 1.2, fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            disabled={loading}
            startIcon={!loading && <Save size={18} />}
            sx={{ 
              borderRadius: '12px', 
              py: 1.2, 
              fontWeight: 700,
              boxShadow: '0 8px 20px rgba(0, 240, 255, 0.2)'
            }}
          >
            {loading ? "Saving..." : initial ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
