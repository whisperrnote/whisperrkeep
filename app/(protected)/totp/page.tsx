"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Copy, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppwrite } from "@/app/appwrite-provider";
import { listTotpSecrets, deleteTotpSecret, listFolders } from "@/lib/appwrite";
import NewTotpDialog from "@/components/app/totp/new";
import { authenticator } from "otplib";
import { Dialog } from "@/components/ui/Dialog";
import toast from "react-hot-toast";
import VaultGuard from "@/components/layout/VaultGuard";
import { useSudo } from "@/app/context/SudoContext";

export default function TOTPPage() {
  const [search, setSearch] = useState("");
  const { user, isVaultUnlocked } = useAppwrite();
  type TotpItem = {
    $id: string;
    issuer?: string | null;
    accountName?: string | null;
    secretKey: string; // stored/encrypted elsewhere; never display
    period?: number | null;
    digits?: number | null;
    algorithm?: string | null;
    folderId?: string | null;
  };
  const [totpCodes, setTotpCodes] = useState<TotpItem[]>([]);
  const [folders, setFolders] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });
  const [editingTotp, setEditingTotp] = useState<TotpItem | null>(null);

  const { requestSudo } = useSudo();

  // Fix infinite loop by removing unstable function reference from dependencies
  // usage of isVaultUnlocked inside effect is sufficient
  useEffect(() => {
    if (!user?.$id) return;

    // Ensure vault is unlocked before fetching to prevent decryption errors
    if (!isVaultUnlocked()) {
      return;
    }

    setLoading(true);
    // Use Promise.allSettled to avoid failing completely if one request fails
    Promise.allSettled([listTotpSecrets(user.$id), listFolders(user.$id)])
      .then(([secretsResult, foldersResult]) => {
        if (secretsResult.status === "fulfilled") {
          setTotpCodes(secretsResult.value);
        } else {
          console.error("Failed to fetch TOTP secrets", secretsResult.reason);
        }

        if (foldersResult.status === "fulfilled") {
          const folderMap = new Map<string, string>();
          foldersResult.value.forEach((f) => folderMap.set(f.$id, f.name));
          setFolders(folderMap);
        }
      })
      .catch((err) => {
        console.error("Error loading TOTP data:", err);
        toast.error("Failed to load data.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showNew]); // Removed isVaultUnlocked

  const generateTOTP = (
    secret: string,
    period: number = 30,
    digits: number = 6,
    algorithm: string = "SHA1",
  ): string => {
    try {
      // Handle failed decryption or missing secret
      if (!secret || secret.includes("[DECRYPTION_FAILED]")) return "Locked";

      // Sanitize: remove all spaces to ensure spaced/unspaced secrets yield same code
      const normalized = (secret || "").replace(/\s+/g, "").toUpperCase();

      if (!normalized) return "------";

      // Otplib expects strictly uppercase base32 secret usually, but let's just pass normalized
      // Algorithm must be lowercase for some versions of otplib / crypto wrappers
      const algo = (algorithm || "sha1").toLowerCase();

      authenticator.options = {
        step: period || 30,
        digits: digits || 6,
        // @ts-expect-error - types can be strict
        algorithm: algo,
        window: 0
      };

      return authenticator.generate(normalized);
    } catch (err) {
      console.warn("TOTP Generation warning for secret ending in ...", secret?.slice(-4), err);
      // Fallback: try default algorithm if specific one failed
      if (algorithm?.toLowerCase() !== 'sha1') {
        try {
          // @ts-expect-error - type mismatch
          authenticator.options = { step: 30, digits: 6, algorithm: 'sha1' };
          return authenticator.generate((secret || "").replace(/\s+/g, ""));
        } catch { }
      }
      return "Invalid";
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!user?.$id) return;
    try {
      await deleteTotpSecret(id);
      setTotpCodes((codes) => codes.filter((c) => c.$id !== id));
      toast.success("TOTP code deleted.");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || "Failed to delete TOTP code.");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const getTimeRemaining = (period: number = 30): number => {
    return period - (Math.floor(currentTime / 1000) % period);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openEditDialog = (totp: TotpItem) => {
    setEditingTotp(totp);
    setShowNew(true);
  };

  const TOTPCard = ({ totp }: { totp: TotpItem }) => {
    // Debug logging
    console.log("[TOTPCard] rendering", {
      id: totp.$id,
      issuer: totp.issuer,
      hasSecret: !!totp.secretKey,
      secretKeyLength: totp.secretKey?.length,
      secretStart: totp.secretKey?.substring(0, 5)
    });

    const code = generateTOTP(
      totp.secretKey,
      totp.period || 30,
      totp.digits || 6,
      totp.algorithm || "SHA1"
    );
    console.log("[TOTPCard] generated code", code);

    const timeRemaining = getTimeRemaining(totp.period || 30);
    const progress = (timeRemaining / (totp.period || 30)) * 100;
    const folderName = totp.folderId ? folders.get(totp.folderId) : null;

    return (
      <Card className="p-4 overflow-hidden relative">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className="min-w-0">
            <h3
              className="font-semibold truncate max-w-full"
              title={totp.issuer ?? undefined}
            >
              {totp.issuer || ""}
            </h3>
            <p
              className="text-sm text-muted-foreground truncate max-w-full"
              title={totp.accountName ?? undefined}
            >
              {totp.accountName || ""}
            </p>
            {folderName && (
              <span className="text-xs bg-secondary px-2 py-1 rounded mt-1 inline-block">
                {folderName}
              </span>
            )}
            {/* DEBUG DISPLAY */}
            {/* <div className="text-[10px] text-red-500 break-all">
               DEBUG: {JSON.stringify(totp.secretKey)}
            </div> */}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(totp)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(totp.$id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-mono text-2xl font-bold tracking-wider">
              {code.substring(0, 3)} {code.substring(3)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(code)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {timeRemaining}s
            </div>
            <div className="w-8 h-8 relative">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${progress * 0.88} 88`}
                  className={`transition-all duration-1000 ${timeRemaining <= 5 ? "text-red-500" : "text-primary"
                    }`}
                />
              </svg>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <VaultGuard>
      <div className="space-y-6">
        {" "}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TOTP Codes</h1>
            <p className="text-muted-foreground">
              Manage your two-factor authentication codes
            </p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add TOTP
          </Button>
        </div>
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search TOTP codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-primary text-sm"
          />
        </div>
        {loading ? (
          <Card className="p-12 text-center">Loading...</Card>
        ) : totpCodes.length === 0 ? (
          <Card className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No TOTP codes found</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first two-factor authentication code
            </p>
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add TOTP
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {totpCodes
              .filter((totp) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                  (totp.issuer && totp.issuer.toLowerCase().includes(q)) ||
                  (totp.accountName &&
                    totp.accountName.toLowerCase().includes(q))
                );
              })
              .map((totp) => (
                <TOTPCard key={totp.$id} totp={totp} />
              ))}
          </div>
        )}
        <NewTotpDialog
          open={showNew}
          onClose={() => {
            setShowNew(false);
            setEditingTotp(null);
          }}
          initialData={editingTotp || undefined}
        />
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null })}
        >
          <div className="p-6">
            <h2 className="text-lg font-bold mb-2">Delete TOTP Code</h2>
            <p className="mb-4">
              Are you sure you want to delete this TOTP code? This action cannot
              be undone.
            </p>
            {/* Show issuer and account name with truncation and hover title */}
            {deleteDialog.open && (
              <div className="mb-4">
                {/* Resolve the selected TOTP for display */}
                {(() => {
                  const selected = totpCodes.find(
                    (t) => t.$id === deleteDialog.id,
                  );
                  if (!selected) return null;
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-muted-foreground">
                        Issuer
                      </div>
                      <div className="group relative">
                        <div
                          className="max-w-full truncate px-2 py-1 rounded bg-secondary"
                          title={selected.issuer || ""}
                          aria-label={selected.issuer || ""}
                        >
                          <span
                            className="sm:hidden"
                            aria-label={selected.issuer || ""}
                          >
                            {(selected.issuer || "").length > 6
                              ? `${(selected.issuer || "").slice(0, 6)}...`
                              : selected.issuer || "—"}
                          </span>
                          <span
                            className="hidden sm:inline"
                            aria-label={selected.issuer || ""}
                          >
                            {(selected.issuer || "").length > 15
                              ? `${(selected.issuer || "").slice(0, 15)}...`
                              : selected.issuer || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Account
                      </div>
                      <div className="group relative">
                        <div
                          className="max-w-full truncate px-2 py-1 rounded bg-secondary"
                          title={selected.accountName || ""}
                          aria-label={selected.accountName || ""}
                        >
                          <span
                            className="sm:hidden"
                            aria-label={selected.accountName || ""}
                          >
                            {(selected.accountName || "").length > 6
                              ? `${(selected.accountName || "").slice(0, 6)}...`
                              : selected.accountName || "—"}
                          </span>
                          <span
                            className="hidden sm:inline"
                            aria-label={selected.accountName || ""}
                          >
                            {(selected.accountName || "").length > 15
                              ? `${(selected.accountName || "").slice(0, 15)}...`
                              : selected.accountName || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (deleteDialog.id) {
                    requestSudo({
                      onSuccess: () => handleDelete(deleteDialog.id!)
                    });
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setDeleteDialog({ open: false, id: null })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </VaultGuard>
  );
}
