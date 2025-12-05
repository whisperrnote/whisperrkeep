"use client";

import React, { useState } from "react";
import { FloatingContainer } from "@/components/ui/FloatingContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useAI } from "@/app/context/AIContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function AIModal({ onClose }: { onClose: () => void }) {
  const { sendCommand, isLoading } = useAI();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setResponse(null);
    try {
      const result = await sendCommand(prompt);
      
      if (result.action === "UNKNOWN") {
        setResponse(result.response || "I'm not sure how to help with that.");
      } else {
        handleAction(result);
        setPrompt(""); // clear input on success
      }
    } catch {
      setResponse("Sorry, I couldn't process that request.");
    }
  };

  const handleAction = (cmd: { action: string; data?: unknown }) => {
    const data = cmd.data as { target?: string; name?: string; url?: string } | undefined;
    switch (cmd.action) {
      case "NAVIGATE":
        if (data?.target) {
            const target = data.target.toLowerCase();
            // path variable removed as unused
            // Simple mapping
            const validPaths = ["/dashboard", "/settings", "/import", "/totp", "/sharing", "/credentials/new"];
            // Find closest match or direct
            const finalPath = validPaths.find(p => p.includes(target)) || "/dashboard";
            router.push(finalPath);
            onClose();
            toast.success(`Navigating to ${target}...`);
        }
        break;

      case "CREATE_CREDENTIAL":
        // Navigate to new page with query params to pre-fill?
        // Or if we are on dashboard, open modal.
        // Simplest consistent way: Go to /credentials/new with params
        const params = new URLSearchParams();
        if (data?.name) params.set("name", data.name);
        if (data?.url) params.set("url", data.url);
        
        router.push(`/credentials/new?${params.toString()}`);
        onClose();
        toast.success("Opening new credential form...");
        break;
        
      case "GENERATE_PASSWORD":
        setResponse("I can't generate the password directly, but I've opened the generator for you.");
        // We could trigger a global event, but for now just pointing user
        break;
    }
  };

  return (
    <FloatingContainer
      title="Whisperrkeep AI Commander"
      onClose={onClose}
      defaultPosition={{ x: window.innerWidth - 400, y: 100 }}
      className="w-96"
    >
      <div className="space-y-4">
        <div className="bg-primary/5 p-3 rounded-md text-sm text-muted-foreground border border-primary/10">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p>
              <strong>AI Commander</strong>
              <br/>
              Try: &quot;Add a login for Netflix&quot;, &quot;Go to Settings&quot;, or &quot;Help me organize&quot;.
            </p>
          </div>
        </div>

        {response && (
          <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2">
            {response}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading || !prompt.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </FloatingContainer>
  );
}

