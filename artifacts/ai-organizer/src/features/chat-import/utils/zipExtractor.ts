/**
 * ZIP Extractor Utility
 * Handles extraction of ZIP archives containing chat exports
 */

export interface ExtractedFile {
  name: string;
  content: string | ArrayBuffer;
  isText: boolean;
}

export async function extractZipFile(file: File): Promise<ExtractedFile[]> {
  // For browser environment, we'll use a simple approach
  // In production, you'd use a library like JSZip
  
  try {
    // Use native DecompressionStream if available
    if (typeof DecompressionStream !== 'undefined') {
      const decompressed = await decompressWithNativeAPI(file);
      return decompressed;
    }
    throw new Error('ZIP extraction requires JSZip library');
    
  } catch (error) {
    console.error('ZIP extraction failed:', error);
    throw error;
  }
}

async function decompressWithNativeAPI(_file: File): Promise<ExtractedFile[]> {
  // This is a placeholder - in practice you'd use JSZip or similar
  throw new Error('JSZip library required for ZIP extraction');
}

/**
 * Find the main conversation file in extracted files
 */
export function findConversationFile(files: ExtractedFile[]): ExtractedFile | null {
  // Priority order for conversation files
  const priorityNames = [
    'conversations.json',
    'chat.json',
    'messages.json',
    'export.json',
    'history.json'
  ];
  
  for (const name of priorityNames) {
    const file = files.find(f => f.name.toLowerCase() === name);
    if (file && file.isText) return file;
  }
  
  // Fallback: find any JSON file
  const jsonFile = files.find(f => 
    f.name.toLowerCase().endsWith('.json') && f.isText
  );
  
  return jsonFile || null;
}

/**
 * Check if a file is a ZIP archive
 */
export function isZipFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.zip');
}
