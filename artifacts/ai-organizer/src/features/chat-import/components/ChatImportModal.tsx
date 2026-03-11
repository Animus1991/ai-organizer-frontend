/**
 * Chat Import Modal — Modern UI with semantic HSL tokens
 * Supports drag-drop + file select for chat archives
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Upload, X, FileText, ChevronLeft, Check, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useChatImport } from '../hooks/useChatImport';
import { ParsedConversation } from '../parsers/ChatArchiveParser';

interface ChatImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (conversations: ParsedConversation[]) => void;
}

export const ChatImportModal: React.FC<ChatImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { state, result, importFiles, reset } = useChatImport();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) modalRef.current.focus();
  }, [isOpen]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.json') || f.name.endsWith('.zip')
    );
    if (files.length > 0) setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    const importResult = await importFiles(selectedFiles);
    if (importResult.success && importResult.conversations.length > 0) {
      setShowPreview(true);
    }
  }, [selectedFiles, importFiles]);

  const handleConfirmImport = useCallback(() => {
    if (result?.conversations) onImportComplete?.(result.conversations);
    handleClose();
  }, [result, onImportComplete]);

  const handleClose = useCallback(() => {
    reset();
    setSelectedFiles([]);
    setShowPreview(false);
    onClose();
  }, [reset, onClose]);

  if (!isOpen) return null;

  const btnBase: React.CSSProperties = {
    padding: isMobile ? '10px 14px' : '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'hsl(var(--foreground) / 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: isMobile ? '12px' : '24px',
      }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Εισαγωγή Συνομιλιών"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px hsl(var(--foreground) / 0.15)',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            📁 Εισαγωγή Συνομιλιών
          </h2>
          <button
            onClick={handleClose}
            title="Κλείσιμο"
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--muted) / 0.5)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {!showPreview ? (
          <>
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed hsl(var(--${dragOver ? 'primary' : 'border'}))`,
                borderRadius: '12px',
                padding: isMobile ? '24px 16px' : '32px',
                textAlign: 'center',
                background: dragOver ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--muted) / 0.3)',
                transition: 'all 0.2s ease',
                marginBottom: '16px',
              }}
            >
              <Upload style={{ width: 36, height: 36, margin: '0 auto 8px', color: 'hsl(var(--primary))' }} />
              <p style={{ color: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
                Σύρε & άφησε αρχεία εδώ
              </p>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', margin: '4px 0 12px', lineHeight: 1.4 }}>
                ChatGPT, Claude, Gemini, Copilot, Perplexity, Meta AI, DeepSeek, Mistral κ.ά. (JSON, ZIP)
              </p>
              <input
                type="file"
                accept=".json,.zip"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="chat-import-input"
              />
              <label
                htmlFor="chat-import-input"
                style={{
                  ...btnBase,
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  border: 'none',
                }}
              >
                <Upload style={{ width: 14, height: 14 }} />
                Επιλογή αρχείων
              </label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
                  Επιλεγμένα ({selectedFiles.length})
                </p>
                {selectedFiles.map((file) => (
                  <div
                    key={file.name}
                    style={{
                      padding: '8px 12px',
                      background: 'hsl(var(--muted) / 0.4)',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <FileText style={{ width: 14, height: 14, color: 'hsl(var(--primary))' }} />
                    <span style={{ color: 'hsl(var(--foreground))', flex: 1 }}>{file.name}</span>
                    <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {state.isLoading && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    {state.currentFile}
                  </span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {state.processedFiles}/{state.totalFiles}
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  background: 'hsl(var(--muted))',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${state.progress}%`,
                    height: '100%',
                    background: 'hsl(var(--primary))',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={handleClose} style={{
                ...btnBase,
                background: 'hsl(var(--muted) / 0.5)',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}>
                Ακύρωση
              </button>
              <button
                onClick={handleImport}
                disabled={selectedFiles.length === 0 || state.isLoading}
                style={{
                  ...btnBase,
                  background: selectedFiles.length > 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)',
                  color: 'hsl(var(--primary-foreground))',
                  border: 'none',
                  cursor: selectedFiles.length > 0 && !state.isLoading ? 'pointer' : 'not-allowed',
                  opacity: selectedFiles.length === 0 || state.isLoading ? 0.6 : 1,
                }}
              >
                {state.isLoading ? (
                  <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Εισαγωγή...</>
                ) : (
                  <><Upload style={{ width: 14, height: 14 }} /> Εισαγωγή</>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '12px' }}>
                Προεπισκόπηση εισαγωγής
              </p>
              
              {result?.conversations.map((conv) => (
                <div
                  key={conv.id}
                  style={{
                    padding: '12px',
                    background: 'hsl(var(--muted) / 0.3)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '13px' }}>
                      {conv.title}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      background: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      {conv.messages.length} μηνύματα
                    </span>
                  </div>
                  <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', marginTop: '4px' }}>
                    {conv.platform} • {conv.startTime.toLocaleDateString('el-GR')}
                  </div>
                </div>
              ))}

              {result?.warnings && result.warnings.length > 0 && (
                <div style={{
                  marginTop: '12px', padding: '12px',
                  background: 'hsl(var(--warning) / 0.08)',
                  border: '1px solid hsl(var(--warning) / 0.2)',
                  borderRadius: '10px',
                }}>
                  <p style={{ color: 'hsl(var(--warning))', fontWeight: 700, fontSize: '12px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle style={{ width: 14, height: 14 }} /> Προειδοποιήσεις
                  </p>
                  {result.warnings.map((w, i) => (
                    <div key={i} style={{ color: 'hsl(var(--warning))', fontSize: '11px' }}>• {w}</div>
                  ))}
                </div>
              )}

              {result?.errors && result.errors.length > 0 && (
                <div style={{
                  marginTop: '12px', padding: '12px',
                  background: 'hsl(var(--destructive) / 0.08)',
                  border: '1px solid hsl(var(--destructive) / 0.2)',
                  borderRadius: '10px',
                }}>
                  <p style={{ color: 'hsl(var(--destructive))', fontWeight: 700, fontSize: '12px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle style={{ width: 14, height: 14 }} /> Σφάλματα
                  </p>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ color: 'hsl(var(--destructive))', fontSize: '11px' }}>• {e}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPreview(false)} style={{
                ...btnBase,
                background: 'hsl(var(--muted) / 0.5)',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}>
                <ChevronLeft style={{ width: 14, height: 14 }} />
                Πίσω
              </button>
              <button onClick={handleConfirmImport} style={{
                ...btnBase,
                background: 'hsl(var(--success))',
                color: 'hsl(var(--success-foreground, var(--primary-foreground)))',
                border: 'none',
              }}>
                <Check style={{ width: 14, height: 14 }} />
                Δημιουργία & Εισαγωγή
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatImportModal;
