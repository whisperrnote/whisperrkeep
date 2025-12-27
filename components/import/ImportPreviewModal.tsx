"use client";

import { useState, useMemo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { 
  Button, 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  alpha, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from "@mui/material";
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
    setTimeout(() => {
        onConfirm(finalItems);
        setIsProcessing(false);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        <Box sx={{ p: 4, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Database size={24} color="#00F5FF" />
            <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', color: 'white' }}>
              Import Preview
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Review and clean your data before importing.
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
          {/* Controls */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper
                onClick={() => setRemoveDuplicates(!removeDuplicates)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  bgcolor: removeDuplicates ? alpha('#00F5FF', 0.05) : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: removeDuplicates ? alpha('#00F5FF', 0.3) : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: removeDuplicates ? alpha('#00F5FF', 0.08) : 'rgba(255, 255, 255, 0.05)',
                    borderColor: removeDuplicates ? '#00F5FF' : 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <X size={18} color="#FF4D4D" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white' }}>
                      Remove Exact Duplicates
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '6px', 
                    border: '2px solid',
                    borderColor: removeDuplicates ? '#00F5FF' : 'rgba(255, 255, 255, 0.2)',
                    bgcolor: removeDuplicates ? '#00F5FF' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {removeDuplicates && <Check size={14} color="#000" strokeWidth={3} />}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}>
                  Removes items that have identical URL, Username, and Password. Keeps the most complete version.
                </Typography>
                {removeDuplicates && (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF4D4D' }}>
                    -{duplicateCount} items removed
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                onClick={() => setMergeSimilar(!mergeSimilar)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  bgcolor: mergeSimilar ? alpha('#00F5FF', 0.05) : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: mergeSimilar ? alpha('#00F5FF', 0.3) : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: mergeSimilar ? alpha('#00F5FF', 0.08) : 'rgba(255, 255, 255, 0.05)',
                    borderColor: mergeSimilar ? '#00F5FF' : 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Merge size={18} color="#00F5FF" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white' }}>
                      Smart Merge
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '6px', 
                    border: '2px solid',
                    borderColor: mergeSimilar ? '#00F5FF' : 'rgba(255, 255, 255, 0.2)',
                    bgcolor: mergeSimilar ? '#00F5FF' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {mergeSimilar && <Check size={14} color="#000" strokeWidth={3} />}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}>
                  Merges items with same domain and credentials into a single robust entry. Combines notes.
                </Typography>
                {mergeSimilar && (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#00F5FF' }}>
                    -{mergeCount} items merged
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Stats Bar */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 4,
            bgcolor: 'rgba(255, 255, 255, 0.03)', 
            p: 3, 
            borderRadius: '20px', 
            mb: 4,
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-space-grotesk)' }}>
                {rawItems.length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Original
              </Typography>
            </Box>
            <ArrowRight size={24} color="rgba(255, 255, 255, 0.2)" />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#00F5FF', fontFamily: 'var(--font-space-grotesk)' }}>
                {finalItems.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#00F5FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>
                Final Count
              </Typography>
            </Box>
          </Box>

          {/* Preview Table */}
          <TableContainer component={Paper} sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: 400,
            backgroundImage: 'none'
          }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'rgba(20, 20, 20, 0.95)', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', py: 2 }}>NAME</TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(20, 20, 20, 0.95)', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', py: 2 }}>USERNAME</TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(20, 20, 20, 0.95)', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', py: 2 }}>URL</TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'rgba(20, 20, 20, 0.95)', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', py: 2 }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {finalItems.slice(0, 100).map((item, i) => (
                  <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', py: 1.5 }}>{item.name || "Untitled"}</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', py: 1.5 }}>{item.username}</TableCell>
                    <TableCell sx={{ color: '#00F5FF', opacity: 0.8, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', py: 1.5 }}>{item.url}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', py: 1.5 }}>
                      {item._status === 'merged' && (
                        <Chip label="Merged" size="small" sx={{ bgcolor: alpha('#00F5FF', 0.1), color: '#00F5FF', fontWeight: 800, fontSize: '0.65rem' }} />
                      )}
                      {item._status === 'new' && (
                        <Chip label="New" size="small" sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', fontWeight: 800, fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {finalItems.length > 100 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 2, color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem', fontWeight: 600 }}>
                      ...and {finalItems.length - 100} more items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ 
          p: 4, 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2,
          bgcolor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Button 
            variant="text" 
            onClick={onClose} 
            disabled={isProcessing}
            sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700, '&:hover': { color: 'white' } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleConfirm} 
            disabled={isProcessing}
            sx={{ 
              bgcolor: '#00F5FF', 
              color: '#000', 
              fontWeight: 900,
              px: 4,
              borderRadius: '12px',
              '&:hover': { bgcolor: '#00D1DA' }
            }}
          >
            {isProcessing ? "Processing..." : `Import ${finalItems.length} Items`}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

