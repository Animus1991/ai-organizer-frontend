/**
 * DragDropUpload - Global drag & drop file upload zone
 * Provides visual feedback and handles file uploads across the app
 */

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";

// File upload types
export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  url?: string;
}

export type FileAccept = 
  | "documents" 
  | "images" 
  | "all" 
  | string; // Custom MIME types

// Context type
interface DragDropContextType {
  isDragging: boolean;
  files: UploadedFile[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  uploadFiles: (handler: (file: File) => Promise<string>) => Promise<void>;
  setAcceptedTypes: (types: FileAccept) => void;
  acceptedTypes: FileAccept;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

// MIME type mappings
const acceptMap: Record<string, string[]> = {
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/rtf",
  ],
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  all: [],
};

// Generate unique ID
const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider props
interface DragDropProviderProps {
  children: React.ReactNode;
  onFilesAdded?: (files: File[]) => void;
  onFileUploaded?: (file: File, url: string) => void;
  defaultAccept?: FileAccept;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onFilesAdded,
  onFileUploaded,
  defaultAccept = "documents",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [acceptedTypes, setAcceptedTypes] = useState<FileAccept>(defaultAccept);
  const dragCounterRef = useRef(0);

  // Check if file type is accepted
  const isFileAccepted = useCallback((file: File): boolean => {
    if (acceptedTypes === "all") return true;
    const accepted = acceptMap[acceptedTypes] || [acceptedTypes];
    if (accepted.length === 0) return true;
    return accepted.some((type) => file.type.match(type));
  }, [acceptedTypes]);

  // Add files to the list
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList)
      .filter(isFileAccepted)
      .map((file): UploadedFile => ({
        id: generateId(),
        file,
        progress: 0,
        status: "pending",
      }));

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      onFilesAdded?.(newFiles.map((f) => f.file));
    }
  }, [isFileAccepted, onFilesAdded]);

  // Remove a file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Upload files using provided handler
  const uploadFiles = useCallback(async (handler: (file: File) => Promise<string>) => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    
    for (const fileRecord of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileRecord.id ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        const url = await handler(fileRecord.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileRecord.id
              ? { ...f, status: "completed" as const, progress: 100, url }
              : f
          )
        );
        onFileUploaded?.(fileRecord.file, url);
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileRecord.id
              ? { ...f, status: "error" as const, error: String(error) }
              : f
          )
        );
      }
    }
  }, [files, onFileUploaded]);

  // Global drag event handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [addFiles]);

  return (
    <DragDropContext.Provider
      value={{
        isDragging,
        files,
        addFiles,
        removeFile,
        clearFiles,
        uploadFiles,
        setAcceptedTypes,
        acceptedTypes,
      }}
    >
      {children}
      {isDragging && <GlobalDropOverlay />}
    </DragDropContext.Provider>
  );
};

// Hook to use drag drop
export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error("useDragDrop must be used within DragDropProvider");
  }
  return context;
};

// Global overlay when dragging files
const GlobalDropOverlay: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(99, 102, 241, 0.15)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99990,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
          border: "2px dashed #6366f1",
          borderRadius: "20px",
          padding: "60px 80px",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📥</div>
        <div style={{ fontSize: "20px", fontWeight: 600, color: "#eaeaea", marginBottom: "8px" }}>
          Drop files here
        </div>
        <div style={{ fontSize: "14px", color: "#71717a" }}>
          Release to upload your files
        </div>
      </div>
    </div>
  );
};

// Local drop zone component for specific areas
interface DropZoneProps {
  onFilesDropped?: (files: File[]) => void;
  accept?: FileAccept;
  multiple?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesDropped,
  accept = "documents",
  multiple = true,
  children,
  style,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files.length) {
      const files = Array.from(e.dataTransfer.files);
      onFilesDropped?.(multiple ? files : [files[0]]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      onFilesDropped?.(files);
    }
  };

  // Get accept string for input
  const getAcceptString = () => {
    if (accept === "all") return "*/*";
    const types = acceptMap[accept] || [accept];
    return types.join(",");
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={className}
      style={{
        border: isDragging ? "2px dashed #6366f1" : "2px dashed rgba(255, 255, 255, 0.15)",
        borderRadius: "12px",
        padding: "32px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        background: isDragging ? "rgba(99, 102, 241, 0.08)" : "rgba(255, 255, 255, 0.02)",
        ...style,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={getAcceptString()}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
      {children || (
        <>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.7 }}>
            {isDragging ? "📥" : "📄"}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#eaeaea", marginBottom: "6px" }}>
            {isDragging ? "Drop files here" : "Click or drag files to upload"}
          </div>
          <div style={{ fontSize: "12px", color: "#71717a" }}>
            {accept === "documents" && "PDF, DOC, DOCX, TXT"}
            {accept === "images" && "JPEG, PNG, GIF, WebP"}
            {accept === "all" && "All file types accepted"}
          </div>
        </>
      )}
    </div>
  );
};

// File list component to show uploaded files
interface FileListProps {
  showProgress?: boolean;
  onRemove?: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ showProgress = true, onRemove }) => {
  const { files, removeFile } = useDragDrop();

  if (files.length === 0) return null;

  const handleRemove = (id: string) => {
    removeFile(id);
    onRemove?.(id);
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📕";
    if (type.includes("word") || type.includes("document")) return "📘";
    if (type.includes("image")) return "🖼️";
    if (type.includes("text")) return "📝";
    return "📄";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {files.map((file) => (
        <div
          key={file.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span style={{ fontSize: "20px" }}>{getFileIcon(file.file.type)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#eaeaea",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.file.name}
            </div>
            <div style={{ fontSize: "11px", color: "#71717a", marginTop: "2px" }}>
              {formatFileSize(file.file.size)}
              {file.status === "error" && (
                <span style={{ color: "#ef4444", marginLeft: "8px" }}>{file.error}</span>
              )}
            </div>
            {showProgress && file.status === "uploading" && (
              <div
                style={{
                  marginTop: "6px",
                  height: "3px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${file.progress}%`,
                    height: "100%",
                    background: "#6366f1",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {file.status === "completed" && (
              <span style={{ color: "#22c55e", fontSize: "16px" }}>✓</span>
            )}
            {file.status === "error" && (
              <span style={{ color: "#ef4444", fontSize: "16px" }}>✕</span>
            )}
            {file.status === "uploading" && (
              <span style={{ color: "#6366f1", animation: "spin 1s linear infinite" }}>◌</span>
            )}
            <button
              onClick={() => handleRemove(file.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                padding: "4px",
                fontSize: "14px",
              }}
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Upload button component
interface UploadButtonProps {
  onUpload: (file: File) => Promise<string>;
  label?: string;
  style?: React.CSSProperties;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  onUpload,
  label = "Upload",
  style,
}) => {
  const { files, uploadFiles } = useDragDrop();
  const [isUploading, setIsUploading] = useState(false);
  const pendingCount = files.filter((f) => f.status === "pending").length;

  const handleUpload = async () => {
    if (pendingCount === 0) return;
    setIsUploading(true);
    try {
      await uploadFiles(onUpload);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <button
      onClick={handleUpload}
      disabled={pendingCount === 0 || isUploading}
      style={{
        padding: "10px 20px",
        background: pendingCount > 0 ? "#6366f1" : "rgba(255, 255, 255, 0.1)",
        border: "none",
        borderRadius: "8px",
        color: pendingCount > 0 ? "white" : "#71717a",
        fontSize: "14px",
        fontWeight: 500,
        cursor: pendingCount > 0 ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {isUploading ? (
        <>
          <span style={{ animation: "spin 1s linear infinite" }}>◌</span>
          Uploading...
        </>
      ) : (
        <>
          <span>📤</span>
          {label} {pendingCount > 0 && `(${pendingCount})`}
        </>
      )}
    </button>
  );
};

export default DragDropProvider;
