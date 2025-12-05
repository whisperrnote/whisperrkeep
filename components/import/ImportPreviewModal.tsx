"use client";

import { useState, useMemo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ImportItem, DeduplicationEngine } from "@/lib/import/deduplication";
import { Check, X, ArrowRight, Database, Merge } from "lucide-react";

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawItems: ImportItem[];
  onConfirm: (finalItems: ImportItem[]) => void;
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  rawItems,
  onConfirm,
}: ImportPreviewModalProps) {
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [mergeSimilar, setMergeSimilar] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time calculation of the final list
  const { finalItems, duplicateCount, mergeCount } = useMemo(() => {
    let processed = [...rawItems];
    const initialCount = processed.length;
    let duplicatesRemoved = 0;
    let itemsMerged = 0;

    if (removeDuplicates) {
        const deduped = DeduplicationEngine.processExactDuplicates(processed);
        duplicatesRemoved = initialCount - deduped.length;
        processed = deduped;
    }

    if (mergeSimilar) {
        const beforeMerge = processed.length;
        const merged = DeduplicationEngine.processSmartMerge(processed);
        itemsMerged = beforeMerge - merged.length;
        processed = merged;
    }

    return {
        finalItems: processed,
        duplicateCount: duplicatesRemoved,
        mergeCount: itemsMerged
    };
  }, [rawItems, removeDuplicates, mergeSimilar]);

  const handleConfirm = () => {
    setIsProcessing(true);
    // Add small delay for UX "Processing" feel if needed, or just go
    setTimeout(() => {
        onConfirm(finalItems);
        setIsProcessing(false);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="max-w-4xl max-h-[85vh] flex flex-col">
      <div className="flex-none p-6 border-b border-border">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Import Preview
        </h2>
        <p className="text-muted-foreground mt-1">
            Review and clean your data before importing.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div 
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${removeDuplicates ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:bg-accent'}`}
                onClick={() => setRemoveDuplicates(!removeDuplicates)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        Remove Exact Duplicates
                    </h3>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${removeDuplicates ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                        {removeDuplicates && <Check className="h-3 w-3" />}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Removes items that have identical URL, Username, and Password. Keeps the most complete version.
                </p>
                {removeDuplicates && (
                    <div className="mt-2 text-xs font-bold text-red-500">
                        -{duplicateCount} items removed
                    </div>
                )}
            </div>

            <div 
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${mergeSimilar ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:bg-accent'}`}
                onClick={() => setMergeSimilar(!mergeSimilar)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Merge className="h-4 w-4 text-blue-500" />
                        Smart Merge
                    </h3>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${mergeSimilar ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                        {mergeSimilar && <Check className="h-3 w-3" />}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Merges items with same domain and credentials into a single robust entry. Combines notes.
                </p>
                {mergeSimilar && (
                    <div className="mt-2 text-xs font-bold text-blue-500">
                        -{mergeCount} items merged
                    </div>
                )}
            </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-md mb-6">
            <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{rawItems.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Original</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
             <div className="text-center">
                <div className="text-2xl font-bold text-primary">{finalItems.length}</div>
                <div className="text-xs text-primary uppercase tracking-wide">Final Count</div>
            </div>
        </div>

        {/* Preview Table */}
        <div className="border rounded-md overflow-hidden">
            <div className="bg-muted px-4 py-2 text-xs font-medium text-muted-foreground grid grid-cols-12 gap-4">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Username</div>
                <div className="col-span-4">URL</div>
                <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="max-h-[300px] overflow-y-auto bg-card">
                {finalItems.slice(0, 100).map((item, i) => (
                    <div key={i} className="px-4 py-3 border-b last:border-0 grid grid-cols-12 gap-4 text-sm hover:bg-muted/50">
                         <div className="col-span-3 font-medium truncate" title={item.name}>{item.name || "Untitled"}</div>
                         <div className="col-span-3 text-muted-foreground truncate" title={item.username}>{item.username}</div>
                         <div className="col-span-4 text-blue-500 truncate" title={item.url || ""}>{item.url}</div>
                         <div className="col-span-2 text-right">
                            {item._status === 'merged' && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Merged</span>
                            )}
                            {item._status === 'new' && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full">New</span>
                            )}
                         </div>
                    </div>
                ))}
                {finalItems.length > 100 && (
                    <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30">
                        ...and {finalItems.length - 100} more
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="flex-none p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
        <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? "Processing..." : `Import ${finalItems.length} Items`}
        </Button>
      </div>
    </Dialog>
  );
}

