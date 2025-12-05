"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AnalysisMode } from "@/lib/ai/types";
import { PrivacyFilter } from "@/lib/ai/sanitizer";
import { generateAIContent } from "@/app/actions/ai";
import { AIModal } from "@/components/ai/AIModal";

interface AIContextType {
  analyze: (mode: AnalysisMode, data: any) => Promise<any>;
  askAI: (prompt: string) => Promise<string>;
  openAIModal: () => void;
  closeAIModal: () => void;
  isAIModalOpen: boolean;
  isLoading: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const analyze = async (mode: AnalysisMode, rawData: any) => {
    setIsLoading(true);
    try {
      // 1. Sanitize Data on Client Side (Zero Knowledge Enforcement)
      const sanitizedPayload = PrivacyFilter.sanitize(mode, rawData);

      // 2. Call Server Action (Stateless Proxy)
      const response = await generateAIContent({
        mode,
        data: sanitizedPayload,
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // 3. Parse JSON response if expected
      try {
        return JSON.parse(response.data || "{}");
      } catch {
        return response.data;
      }
    } catch (error) {
      console.error("AI Analysis Failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const askAI = async (prompt: string) => {
    setIsLoading(true);
    try {
      const response = await generateAIContent({
        mode: 'GENERAL_QUERY',
        prompt,
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data || "";
    } catch (error) {
      console.error("AI Query Failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openAIModal = () => setIsAIModalOpen(true);
  const closeAIModal = () => setIsAIModalOpen(false);

  return (
    <AIContext.Provider
      value={{
        analyze,
        askAI,
        openAIModal,
        closeAIModal,
        isAIModalOpen,
        isLoading,
      }}
    >
      {children}
      {isAIModalOpen && <AIModal onClose={closeAIModal} />}
    </AIContext.Provider>
  );
}

