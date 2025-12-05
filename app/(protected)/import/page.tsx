"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppwrite } from "@/app/appwrite-provider";
import { validateBitwardenExport } from "@/utils/import/bitwarden-mapper";
import { useBackgroundTask } from "@/app/context/BackgroundTaskContext";
import { ImportPreviewModal } from "@/components/import/ImportPreviewModal";
import { ImportItem } from "@/lib/import/deduplication";
import { analyzeBitwardenExport } from "@/utils/import/bitwarden-mapper";

export default function ImportPage() {
  const { user } = useAppwrite();
  const { startImport, isImporting: globalImporting } = useBackgroundTask();
  const [importType, setImportType] = useState<string>("bitwarden");
  const [file, setFile] = useState<File | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<ImportItem[]>([]);
  // const [rawFileContent, setRawFileContent] = useState<string>(""); // Unused

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setErrorState(null);
  };

  const parseAndPreview = async (file: File) => {
    try {
        const text = await file.text();
        // setRawFileContent(text);
        
        let items: ImportItem[] = [];

        if (importType === "bitwarden") {
            const data = JSON.parse(text);
            if (!validateBitwardenExport(data)) throw new Error("Invalid Bitwarden format");
            
            // Map to our internal structure for preview
            const mapped = analyzeBitwardenExport(data, user?.$id || "");
            items = mapped.credentials.map(c => ({
                ...c,
                _status: 'new'
            }));
        } else if (importType === "whisperrkeep") {
            const data = JSON.parse(text);
             if (!data.version && !data.credentials) throw new Error("Invalid WhisperrKeep format");
             
             items = (data.credentials || []).map((c: unknown) => ({
                 ...(c as Partial<ImportItem>),
                 _status: 'new'
             }));
        } else {
            throw new Error("Preview not supported for this format yet");
        }

        if (items.length === 0) {
            throw new Error("No items found in file");
        }

        setPreviewItems(items);
        setIsPreviewOpen(true);

    } catch (error) {
        throw error;
    }
  };

  const handleImportClick = async () => {
    if (!user) {
      setErrorState("You must be logged in to import data.");
      return;
    }

    if (!file) {
      setErrorState("Please select a file to import.");
      return;
    }

    if (globalImporting) {
        setErrorState("An import is already in progress.");
        return;
    }

    setErrorState(null);

    try {
       // Validate first
       await parseAndPreview(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Import failed.";
      setErrorState(errorMessage);
    }
  };

  const handleFinalImport = (finalItems: ImportItem[]) => {
      setIsPreviewOpen(false);
      // We need to pass the FINAL deduplicated list to the background task
      // Currently startImport takes raw string. We might need to update startImport 
      // OR re-serialize the finalItems to a JSON string that the importer understands.
      
      // Strategy: Serialize finalItems into a specialized "internal-processed" format 
      // OR just standard WhisperrKeep format which the importer already knows!
      
      const processedPayload = JSON.stringify({
          version: 1,
          credentials: finalItems,
          folders: [], // We are simplifying to just creds for this specific dedupe flow for now
          totpSecrets: []
      });

      // We send this as "whisperrkeep" type because it's now normalized JSON
      startImport("whisperrkeep", processedPayload, user!.$id);
  };

  const isFileValid =
    file &&
    ((importType === "bitwarden" && file.name.endsWith(".json")) ||
      (importType === "whisperrkeep" && file.name.endsWith(".json")) ||
      (importType === "json" && file.name.endsWith(".json")) ||
      (!["bitwarden", "json", "whisperrkeep"].includes(importType) &&
        file.name.endsWith(".csv")));

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-gray-600">
          Import your passwords and data from other password managers
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select Password Manager
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={importType === "bitwarden" ? "default" : "outline"}
                    onClick={() => setImportType("bitwarden")}
                    className="justify-start"
                  >
                    Bitwarden
                  </Button>
                  <Button
                    variant={importType === "whisperrkeep" ? "default" : "outline"}
                    onClick={() => setImportType("whisperrkeep")}
                    className="justify-start"
                  >
                    WhisperrNote Backup
                  </Button>
                  <Button
                    variant={importType === "zoho" ? "default" : "outline"}
                    onClick={() => setImportType("zoho")}
                    className="justify-start"
                    disabled
                  >
                    Zoho Vault
                  </Button>
                  <Button
                    variant={importType === "proton" ? "default" : "outline"}
                    onClick={() => setImportType("proton")}
                    className="justify-start"
                    disabled
                  >
                    Proton Pass
                  </Button>
                  <Button
                    variant={importType === "json" ? "default" : "outline"}
                    onClick={() => setImportType("json")}
                    className="justify-start"
                    disabled
                  >
                    Custom JSON
                  </Button>
                </div>
              </div>

              {importType === "bitwarden" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">
                    How to export from Bitwarden:
                  </h3>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Log into your Bitwarden web vault</li>
                    <li>
                      Go to <strong>Tools</strong> →{" "}
                      <strong>Export Vault</strong>
                    </li>
                    <li>
                      Select <strong>JSON (.json)</strong> format
                    </li>
                    <li>
                      Enter your master password and click{" "}
                      <strong>Export Vault</strong>
                    </li>
                    <li>Save the file and upload it here</li>
                  </ol>
                </div>
              )}

              {importType === "whisperrkeep" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">
                    Restoring from WhisperrNote:
                  </h3>
                  <p className="text-sm text-blue-700">
                    Upload a JSON file previously exported from WhisperrNote/WhisperrKeep.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-3">
                  Select File
                  {importType === "bitwarden" && (
                    <span className="text-gray-500">(JSON format)</span>
                  )}
                  {importType === "whisperrkeep" && (
                     <span className="text-gray-500">(JSON format)</span>
                  )}
                </label>
                <Input
                  type="file"
                  accept={
                    (importType === "bitwarden" || importType === "whisperrkeep")
                      ? ".json"
                      : importType === "json"
                        ? ".json"
                        : ".csv"
                  }
                  onChange={handleFileChange}
                  className="mb-2"
                />
                {file && (
                  <div className="text-sm text-gray-600">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <Button
                onClick={handleImportClick}
                disabled={globalImporting || !isFileValid}
                className="w-full"
              >
                {globalImporting ? "Import in Progress..." : "Preview & Import"}
              </Button>
              
              {errorState && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                      {errorState}
                  </div>
              )}
            </div>
          </Card>

          {!globalImporting && (
            <Card className="p-6">
              <h3 className="font-medium mb-3">⚠️ Important Notes</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  • <strong>Please stay connected</strong> to the internet.
                </p>
                <p>• A floating widget will show progress.</p>
                <p>• You can navigate to other pages while importing.</p>
                <p>• Your data will be encrypted with your master password</p>
                <p>• Folders and organization will be preserved</p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-medium mb-3">What gets imported?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">Login Credentials</div>
                  <div className="text-gray-600">
                    Usernames, passwords, URLs, and notes
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">TOTP Secrets</div>
                  <div className="text-gray-600">
                    Two-factor authentication codes (automatically separated)
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">Folders & Organization</div>
                  <div className="text-gray-600">
                    Folder structure and item organization
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">Custom Fields</div>
                  <div className="text-gray-600">
                    Additional fields and metadata
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <ImportPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        rawItems={previewItems}
        onConfirm={handleFinalImport}
      />
    </div>
  );
}
