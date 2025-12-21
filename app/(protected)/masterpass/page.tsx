"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppwrite } from "@/app/appwrite-provider";
import { MasterPassModal } from "@/components/overlays/MasterPassModal";
import { openAuthPopup } from "@/lib/authUrl";

export default function MasterPassPage() {
  const [showModal, setShowModal] = useState(false);
  const { user, isAuthReady, openIDMWindow } = useAppwrite();
  const router = useRouter();

  // Once auth is ready, determine what to show
  useEffect(() => {
    if (!isAuthReady) return;

    if (user) {
      // User is logged in, show masterpass unlock modal
      setShowModal(true);
    }
    // Do NOT auto-open auth popup - this causes confusion and loops
  }, [user, isAuthReady]);

  const handleModalClose = () => {
    // After unlocking masterpass, go to dashboard
    router.replace("/dashboard");
  };

  if (!isAuthReady) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access your vault.</p>
          <button
            onClick={() => {
              try {
                openIDMWindow();
              } catch (err) {
                console.error("Failed to open auth popup:", err);
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Connect Account
          </button>
        </div>
      </div>
    );
  }

  return <MasterPassModal isOpen={showModal} onClose={handleModalClose} />;
}
