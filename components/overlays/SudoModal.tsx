"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock, Fingerprint, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { masterPassCrypto } from "@/app/(protected)/masterpass/logic";
import { unlockWithPasskey } from "@/app/(protected)/settings/passkey";
import { useAppwrite } from "@/app/appwrite-provider";
import { AppwriteService } from "@/lib/appwrite";
import toast from "react-hot-toast";

interface SudoModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function SudoModal({
    isOpen,
    onSuccess,
    onCancel,
}: SudoModalProps) {
    const { user } = useAppwrite();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);
    const [mode, setMode] = useState<"passkey" | "password">("password");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if user has passkey set up
    useEffect(() => {
        if (isOpen && user?.$id) {
            AppwriteService.hasPasskey(user.$id).then(setHasPasskey);
            // Reset state on open
            setPassword("");
            setLoading(false);
            setPasskeyLoading(false);
            // Default to password for now, unless we want to auto-trigger passkey
            setMode("password");
        }
    }, [isOpen, user]);

    // Auto-trigger passkey if available and it's the preferred method?
    // Use a more "native" feel: if passkey exists, show that primary UI.
    useEffect(() => {
        if (isOpen && hasPasskey) {
            setMode("passkey");
        }
    }, [isOpen, hasPasskey]);

    const handlePasswordVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!user?.$id) return;
        if (!password) return;

        setLoading(true);
        try {
            const isValid = await masterPassCrypto.unlock(password, user.$id);
            if (isValid) {
                toast.success("Verified");
                onSuccess();
            } else {
                toast.error("Incorrect master password");
            }
        } catch (error) {
            console.error(error);
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeyVerify = async () => {
        if (!user?.$id) return;
        setPasskeyLoading(true);
        try {
            // unlockWithPasskey essentially verifies and re-imports keys. 
            // If it returns true, we trust the authentication.
            const success = await unlockWithPasskey(user.$id);
            if (success) {
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            // Don't toast here as unlockWithPasskey already toasts errors
        } finally {
            setPasskeyLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-background w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden transform transition-all scale-100"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="p-6 pb-2 text-center relative">
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>

                    <h2 className="text-lg font-semibold tracking-tight">Security Check</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Please verify your identity to continue.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 pt-2">
                    {mode === "passkey" ? (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <div
                                    className={`mx-auto h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center mb-4 cursor-pointer transition-colors ${passkeyLoading ? 'border-primary animate-pulse' : 'border-muted hover:border-primary/50'}`}
                                    onClick={handlePasskeyVerify}
                                >
                                    <Fingerprint className={`h-10 w-10 ${passkeyLoading ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <p className="text-sm font-medium">Use Face ID / Touch ID</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Authenticate with your device
                                </p>
                            </div>

                            <Button
                                onClick={handlePasskeyVerify}
                                className="w-full"
                                disabled={passkeyLoading}
                            >
                                {passkeyLoading ? "Verifying..." : "Verify with Passkey"}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => setMode("password")}
                            >
                                Use Master Password
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handlePasswordVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Master Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="Enter password..."
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-9"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || !password}
                                >
                                    {loading ? "Verifying..." : "Confirm Password"}
                                </Button>
                            </form>

                            {hasPasskey && (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">
                                                Or
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs gap-2"
                                        onClick={() => setMode("passkey")}
                                    >
                                        <Fingerprint className="h-3 w-3" />
                                        Use Passkey
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
