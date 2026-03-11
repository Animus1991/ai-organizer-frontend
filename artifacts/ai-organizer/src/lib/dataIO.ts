/**
 * Data Export/Import Utilities
 * Handles backup, restore, and data transfer operations
 */

export interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    documents?: any[];
    segments?: any[];
    folders?: any[];
    smartNotes?: any[];
    preferences?: Record<string, any>;
    searchHistory?: string[];
  };
}

/**
 * Export data to JSON file
 */
export function exportToJSON(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, filename || `ai-organizer-export-${formatDate()}.json`);
}

/**
 * Export data to CSV format (for tables)
 */
export function exportToCSV(
  rows: Record<string, any>[],
  filename?: string,
  headers?: string[]
): void {
  if (rows.length === 0) return;

  const keys = headers || Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row =>
      keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename || `export-${formatDate()}.csv`);
}

/**
 * Import JSON data from file
 */
export async function importFromJSON(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.exportedAt) {
          reject(new Error('Invalid export file format'));
          return;
        }
        resolve(data as ExportData);
      } catch (err) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Import CSV data from file
 */
export async function importFromCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          reject(new Error('CSV file is empty or has no data rows'));
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const row: Record<string, string> = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          return row;
        });

        resolve(rows);
      } catch (err) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Format date for filenames
 */
function formatDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Create a backup of all local data
 */
export function createLocalBackup(): ExportData {
  const backup: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {},
  };

  // Collect localStorage data
  const keysToBackup = [
    'aiorg_preferences',
    'aiorg_search_history',
    'aiorg_slots',
    'aiorg_floating_pads',
    'aiorg_pinned_chunks',
  ];

  keysToBackup.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        backup.data[key as keyof typeof backup.data] = JSON.parse(value);
      } catch {
        // Skip invalid JSON
      }
    }
  });

  return backup;
}

/**
 * Restore local data from backup
 */
export function restoreFromBackup(backup: ExportData): void {
  if (!backup.data) return;

  Object.entries(backup.data).forEach(([key, value]) => {
    if (value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
}

export default {
  exportToJSON,
  exportToCSV,
  importFromJSON,
  importFromCSV,
  createLocalBackup,
  restoreFromBackup,
};
