"use client";

import React, { useState } from "react";
import { FloatingContainer } from "@/components/ui/FloatingContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useAI } from "@/app/context/AIContext";

export function AIModal({ onClose }: { onClose: () => void }) {
  const { askAI, isLoading } = useAI();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setResponse(null);
    try {
      const result = await askAI(prompt);
      setResponse(result);
    } catch (error) {
      setResponse("Sorry, I couldn't process that request.");
    }
  };

  return (
    <FloatingContainer
      title="Whisperrkeep AI Assistant"
      onClose={onClose}
      defaultPosition={{ x: window.innerWidth - 400, y: 100 }}
      className="w-96"
    >
      <div className="space-y-4">
        <div className="bg-primary/5 p-3 rounded-md text-sm text-muted-foreground border border-primary/10">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p>
              I can help you generate passwords, organize folders, or answer security questions. 
              <br />
              <strong>Note:</strong> I do not have access to your decrypted secrets.
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
          <Button type="submit" size="icon" disabled={isLoading || !prompt.trim()}>
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

