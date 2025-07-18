"use client";

import type React from "react";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  uploadProgress: number;
  status: "uploading" | "success" | "error";
  id: string;
  url?: string;
}

interface PdfUploaderProps {
  onFileUpload?: (file: File, url: string) => void;
  onFileRemove?: (fileId: string) => void;
  className?: string;
  apiEndpoint?: string;
}

export default function PdfUploader({
  onFileUpload,
  onFileRemove,
  className = "",
  apiEndpoint = "http://localhost:8000/api/pdf/upload-pdf",
}: PdfUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file only";
    }
    if (file.size > 200 * 1024 * 1024) {
      return "File size must be less than 200MB";
    }
    return null;
  };

  const uploadFileToBackend = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(apiEndpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Upload failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.url || data.file_url || data.public_url;
  };

  const simulateProgressAndUpload = async (
    file: UploadedFile
  ): Promise<void> => {
    try {
      const progressInterval = setInterval(() => {
        setUploadedFile((prev) => {
          if (!prev || prev.status !== "uploading") return prev;
          const newProgress = Math.min(
            prev.uploadProgress + Math.random() * 15,
            90
          );
          return { ...prev, uploadProgress: newProgress };
        });
      }, 300);

      const fileUrl = await uploadFileToBackend(file.file);

      clearInterval(progressInterval);

      setUploadedFile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          uploadProgress: 100,
          status: "success",
          url: fileUrl,
        };
      });

      toast.success("PDF uploaded successfully!", {
        description: `${file.name} is ready for processing`,
        duration: 5000,
        action: {
          label: "View",
          onClick: () => window.open(fileUrl, "_blank"),
        },
      });

      onFileUpload?.(file.file, fileUrl);
    } catch (error) {
      // Clear any progress interval
      setUploadedFile((prev) => {
        if (!prev) return null;
        return { ...prev, status: "error", uploadProgress: 0 };
      });

      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error("Upload failed", {
        description: errorMessage,
        duration: 7000,
        action: {
          label: "Retry",
          onClick: () => handleFile(file.file),
        },
      });
    }
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error("Invalid file", {
          description: validationError,
          duration: 5000,
        });
        return;
      }

      if (uploadedFile) {
        setUploadedFile(null);
      }

      const newFile: UploadedFile = {
        file,
        name: file.name,
        size: formatFileSize(file.size),
        uploadProgress: 0,
        status: "uploading",
        id: Date.now().toString(),
      };

      setUploadedFile(newFile);

      toast.info("Upload started", {
        description: `Uploading ${file.name} to cloud storage...`,
        duration: 3000,
      });

      await simulateProgressAndUpload(newFile);
    },
    [uploadedFile, onFileUpload, apiEndpoint]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]); // Only take the first file
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFile]
  );

  const handleRemoveFile = useCallback(() => {
    if (uploadedFile) {
      onFileRemove?.(uploadedFile.id);
      setUploadedFile(null);

      toast.info("File removed", {
        description: "You can upload a new PDF file now",
        duration: 3000,
      });
    }
  }, [uploadedFile, onFileRemove]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 transition-colors duration-200 cursor-pointer ${
          isDragOver
            ? "border-blue-400 bg-gray-900/50"
            : uploadedFile
            ? "border-gray-600 bg-gray-900/30"
            : "border-gray-600 hover:border-gray-300 hover:bg-gray-700/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploadedFile ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!uploadedFile ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-violet-800 flex items-center justify-center mb-6 border border-gray-500">
                <CloudUpload className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                Upload PDF Document
              </h3>
              <p className="text-gray-400 mb-6">
                Drag and drop your PDF file here, or click to browse
              </p>

              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100/10 border border-gray-700">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">PDF Files</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100/10 border border-gray-700">
                  <span className="text-sm text-gray-400">Up to 200MB</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Files are uploaded to secure cloud storage
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-900/50 border border-gray-700">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {uploadedFile.name}
                  </h4>
                  <p className="text-xs text-gray-400">{uploadedFile.size}</p>
                  {uploadedFile.url && (
                    <p className="text-xs text-blue-400 mt-1">
                      Stored in cloud storage
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {uploadedFile.status === "uploading" && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                      <span className="text-xs text-blue-400">
                        Uploading...
                      </span>
                    </div>
                  )}
                  {uploadedFile.status === "success" && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400">Complete</span>
                    </div>
                  )}
                  {uploadedFile.status === "error" && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400">Failed</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="p-1 h-8 w-8 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {uploadedFile.status === "uploading" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">
                      Uploading to cloud storage...
                    </span>
                    <span className="text-blue-400">
                      {Math.round(uploadedFile.uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadedFile.uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadedFile.status === "success" && (
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium mb-1">
                    PDF uploaded successfully!
                  </p>
                  <p className="text-xs text-gray-400">
                    File stored securely in cloud storage
                  </p>
                  {uploadedFile.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(uploadedFile.url, "_blank")}
                      className="mt-2 h-8 text-xs border-green-400/30 text-green-400 hover:bg-green-400/10"
                    >
                      View File
                    </Button>
                  )}
                </div>
              )}

              {/* Error Message */}
              {uploadedFile.status === "error" && (
                <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-400 font-medium mb-1">
                    Upload failed
                  </p>
                  <p className="text-xs text-gray-400">
                    Please try again or check your connection
                  </p>
                  <Button
                    onClick={() => handleFile(uploadedFile.file)}
                    size="sm"
                    className="mt-2 h-8 text-xs bg-red-500 text-white hover:bg-red-600"
                  >
                    Retry Upload
                  </Button>
                </div>
              )}

              {/* Upload Another File Button */}
              {uploadedFile.status === "success" && (
                <div className="text-center">
                  <Button
                    onClick={openFileDialog}
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-600 h-8 text-xs"
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Upload Another PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <CloudUpload className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-medium">
                Drop your PDF file here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
