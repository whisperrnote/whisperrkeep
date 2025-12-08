"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import SudoModal from "@/components/overlays/SudoModal";
import { masterPassCrypto } from "@/app/(protected)/masterpass/logic";

import { markSudoActive, isSudoActive } from "@/lib/sudo-mode";

interface SudoOptions {
    onSuccess: () => void;
    onCancel?: () => void;
}

interface SudoContextType {
    requestSudo: (options: SudoOptions) => void;
}

const SudoContext = createContext<SudoContextType | undefined>(undefined);

export function SudoProvider({ children }: { children: ReactNode }) {
    const [isSudoOpen, setIsSudoOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<SudoOptions | null>(null);

    const requestSudo = useCallback((options: SudoOptions) => {
        if (isSudoActive()) {
            options.onSuccess();
            return;
        }

        setPendingAction(options);
        setIsSudoOpen(true);
    }, []);

    const handleSuccess = useCallback(() => {
        markSudoActive();
        setIsSudoOpen(false);
        if (pendingAction) {
            pendingAction.onSuccess();
            setPendingAction(null);
        }
    }, [pendingAction]);

    const handleCancel = useCallback(() => {
        setIsSudoOpen(false);
        if (pendingAction?.onCancel) {
            pendingAction.onCancel();
        }
        setPendingAction(null);
    }, [pendingAction]);

    return (
        <SudoContext.Provider value={{ requestSudo }}>
            {children}
            <SudoModal
                isOpen={isSudoOpen}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </SudoContext.Provider>
    );
}

export function useSudo() {
    const context = useContext(SudoContext);
    if (!context) {
        throw new Error("useSudo must be used within a SudoProvider");
    }
    return context;
}
