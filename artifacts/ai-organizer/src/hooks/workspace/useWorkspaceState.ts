import { useState, useRef, type Dispatch, type SetStateAction } from "react";
import type { SegmentDTO, SegmentsListMeta, SegmentationSummary, SegmentType, EvidenceGrade, SegmentationMode } from "../../lib/api";
import type { FolderDTO } from "../../lib/segmentFolders";
import type { SourceFilter } from "../../components/workspace";
import type { SelInfo } from "../../lib/documentWorkspace/selection";
import type { SmartNote } from "../../lib/documentWorkspace/smartNotes";

export interface WorkspaceState {
  // Basic state
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  docText: string;
  setDocText: Dispatch<SetStateAction<string>>;
  filename: string | null;
  setFilename: Dispatch<SetStateAction<string | null>>;

  // Ingest fields
  parseStatus: string;
  setParseStatus: Dispatch<SetStateAction<string>>;
  parseError: string | null;
  setParseError: Dispatch<SetStateAction<string | null>>;
  sourceType: string | null;
  setSourceType: Dispatch<SetStateAction<string | null>>;

  // Summary + list
  summary: SegmentationSummary[];
  setSummary: Dispatch<SetStateAction<SegmentationSummary[]>>;
  mode: SegmentationMode;
  setMode: Dispatch<SetStateAction<SegmentationMode>>;
  segments: SegmentDTO[];
  setSegments: Dispatch<SetStateAction<SegmentDTO[]>>;
  segmentsMeta: SegmentsListMeta | null;
  setSegmentsMeta: Dispatch<SetStateAction<SegmentsListMeta | null>>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  sourceFilter: SourceFilter;
  setSourceFilter: Dispatch<SetStateAction<SourceFilter>>;
  advancedFiltersOpen: boolean;
  setAdvancedFiltersOpen: Dispatch<SetStateAction<boolean>>;
  minLength: number | undefined;
  setMinLength: Dispatch<SetStateAction<number | undefined>>;
  maxLength: number | undefined;
  setMaxLength: Dispatch<SetStateAction<number | undefined>>;
  activePreset: string;
  setActivePreset: Dispatch<SetStateAction<string>>;
  
  // Semantic Search Options
  semanticSearch: boolean;
  setSemanticSearch: (enabled: boolean) => void;
  searchLanguage: "auto" | "el" | "en";
  setSearchLanguage: (lang: "auto" | "el" | "en") => void;
  expandVariations: boolean;
  setExpandVariations: (enabled: boolean) => void;
  synonymsManagerOpen: boolean;
  setSynonymsManagerOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;

  // Selection / viewer
  selectedSegId: number | null;
  setSelectedSegId: Dispatch<SetStateAction<number | null>>;
  openSeg: SegmentDTO | null;
  setOpenSeg: Dispatch<SetStateAction<SegmentDTO | null>>;
  highlightRef: React.RefObject<HTMLSpanElement | null>;
  listScrollRef: React.RefObject<HTMLDivElement | null>;
  lastScrollTopRef: React.MutableRefObject<number>;
  clickTimerRef: React.MutableRefObject<number | null>;

  // Manual modal
  manualOpen: boolean;
  setManualOpen: Dispatch<SetStateAction<boolean>>;
  manualTitle: string;
  setManualTitle: Dispatch<SetStateAction<string>>;
  manualPreRef: React.RefObject<HTMLPreElement | null>;
  manualSel: SelInfo | null;
  setManualSel: Dispatch<SetStateAction<SelInfo | null>>;
  manualStatus: string;
  setManualStatus: Dispatch<SetStateAction<string>>;
  manualOpenSeg: SegmentDTO | null;
  setManualOpenSeg: Dispatch<SetStateAction<SegmentDTO | null>>;
  manualListScrollRef: React.RefObject<HTMLDivElement | null>;
  manualLastScrollTopRef: React.MutableRefObject<number>;
  manualClickTimerRef: React.MutableRefObject<number | null>;

  // Chunk edit modal
  chunkEditOpen: boolean;
  setChunkEditOpen: Dispatch<SetStateAction<boolean>>;
  chunkEditSeg: SegmentDTO | null;
  setChunkEditSeg: Dispatch<SetStateAction<SegmentDTO | null>>;
  chunkEditTitle: string;
  setChunkEditTitle: Dispatch<SetStateAction<string>>;
  chunkEditStart: number;
  setChunkEditStart: Dispatch<SetStateAction<number>>;
  chunkEditEnd: number;
  setChunkEditEnd: Dispatch<SetStateAction<number>>;
  chunkEditContent: string;
  setChunkEditContent: Dispatch<SetStateAction<string>>;
  chunkEditHtml: string;
  setChunkEditHtml: Dispatch<SetStateAction<string>>;
  chunkEditDirty: boolean;
  setChunkEditDirty: Dispatch<SetStateAction<boolean>>;
  chunkEditStatus: string;
  setChunkEditStatus: Dispatch<SetStateAction<string>>;
  chunkEditFolderId: string | null;
  setChunkEditFolderId: Dispatch<SetStateAction<string | null>>;
  chunkEditPreRef: React.RefObject<HTMLPreElement | null>;
  chunkEditSyncFromDoc: boolean;
  setChunkEditSyncFromDoc: (sync: boolean) => void;
  // P2: Research-Grade Fields
  chunkEditSegmentType: SegmentType | null;
  setChunkEditSegmentType: (type: SegmentType | null) => void;
  chunkEditEvidenceGrade: EvidenceGrade | null;
  setChunkEditEvidenceGrade: (grade: EvidenceGrade | null) => void;
  chunkEditFalsifiabilityCriteria: string;
  setChunkEditFalsifiabilityCriteria: (criteria: string) => void;

  // Document edit modal
  docEditOpen: boolean;
  setDocEditOpen: (open: boolean) => void;
  docEditText: string;
  setDocEditText: (text: string) => void;
  docEditHtml: string;
  setDocEditHtml: (html: string) => void;
  docEditStatus: string;
  setDocEditStatus: (status: string) => void;
  docEditSaving: boolean;
  setDocEditSaving: (saving: boolean) => void;

  // Chunk editing layout state
  chunkEditFullscreen: boolean;
  setChunkEditFullscreen: (fullscreen: boolean) => void;
  showChunkListInEdit: boolean;
  setShowChunkListInEdit: (show: boolean) => void;
  showAllChunksInEdit: boolean;
  setShowAllChunksInEdit: (show: boolean) => void;

  // Notes (Word-like)
  notesOpen: boolean;
  setNotesOpen: Dispatch<SetStateAction<boolean>>;
  noteHtml: string;
  setNoteHtml: (html: string) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  noteStatus: string;
  setNoteStatus: (status: string) => void;
  noteDirty: boolean;
  setNoteDirty: (dirty: boolean) => void;

  // Smart Notes
  smartNotesOpen: boolean;
  setSmartNotesOpen: Dispatch<SetStateAction<boolean>>;
  smartNotes: SmartNote[];
  setSmartNotes: (notes: SmartNote[]) => void;
  currentSmartNote: SmartNote | null;
  setCurrentSmartNote: (note: SmartNote | null) => void;
  smartNoteHtml: string;
  setSmartNoteHtml: (html: string) => void;
  smartNoteText: string;
  setSmartNoteText: (text: string) => void;
  smartNoteTags: string[];
  setSmartNoteTags: (tags: string[]) => void;
  smartNoteCategory: string;
  setSmartNoteCategory: (category: string) => void;
  smartNotePriority: 'low' | 'medium' | 'high';
  setSmartNotePriority: (priority: 'low' | 'medium' | 'high') => void;
  smartNoteChunkId: number | undefined;
  setSmartNoteChunkId: (id: number | undefined) => void;
  smartNoteDirty: boolean;
  setSmartNoteDirty: (dirty: boolean) => void;
  smartNoteStatus: string;
  setSmartNoteStatus: (status: string) => void;
  smartNoteSearchQuery: string;
  setSmartNoteSearchQuery: (query: string) => void;
  smartNoteSelectedCategory: string;
  setSmartNoteSelectedCategory: (category: string) => void;
  smartNoteSelectedTag: string;
  setSmartNoteSelectedTag: (tag: string) => void;
  smartNoteSelectedPriority: string;
  setSmartNoteSelectedPriority: (priority: string) => void;
  smartNoteSortBy: 'date-desc' | 'date-asc' | 'category' | 'priority' | 'title';
  setSmartNoteSortBy: (sortBy: 'date-desc' | 'date-asc' | 'category' | 'priority' | 'title') => void;
  newTagInput: string;
  setNewTagInput: (input: string) => void;

  // Folders
  foldersOpen: boolean;
  setFoldersOpen: Dispatch<SetStateAction<boolean>>;
  folders: FolderDTO[];
  setFolders: Dispatch<SetStateAction<FolderDTO[]>>;
  folderFilter: string;
  setFolderFilter: Dispatch<SetStateAction<string>>;
  folderMap: Record<string, string>;
  setFolderMap: Dispatch<SetStateAction<Record<string, string>>>;

  // Drag and drop
  draggedSegment: SegmentDTO | null;
  setDraggedSegment: (seg: SegmentDTO | null) => void;
  dragOverFolder: string | null;
  setDragOverFolder: (folderId: string | null) => void;

  // Deletion confirmation
  deletingSegId: number | null;
  setDeletingSegId: (id: number | null) => void;
  deletingManualSegId: number | null;
  setDeletingManualSegId: (id: number | null) => void;

  // Other
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
  structureTreeOpen: boolean;
  setStructureTreeOpen: (open: boolean) => void;
  recycleBinOpen: boolean;
  setRecycleBinOpen: (open: boolean) => void;
  duplicatedChunks: any[];
  setDuplicatedChunks: (chunks: any[]) => void;
  currentFolder: FolderDTO | null;
  setCurrentFolder: (folder: FolderDTO | null) => void;

  // Computed
  canSegment: boolean;
  segHtmlKey: (segId: number) => string;
}

export function useWorkspaceState(docId: number, initialFilename?: string | null): WorkspaceState {
  // Basic state
  const [status, setStatus] = useState<string>("");
  const [docText, setDocText] = useState<string>("");
  const [filename, setFilename] = useState<string | null>(initialFilename ?? null);

  // Ingest fields
  const [parseStatus, setParseStatus] = useState<string>("pending");
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<string | null>(null);

  // Summary + list
  const [summary, setSummary] = useState<SegmentationSummary[]>([]);
  const [mode, setMode] = useState<SegmentationMode>("qa");
  const [segments, setSegments] = useState<SegmentDTO[]>([]);
  const [segmentsMeta, setSegmentsMeta] = useState<SegmentsListMeta | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [minLength, setMinLength] = useState<number | undefined>(undefined);
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<string>("all");
  
  // Semantic Search Options
  const [semanticSearch, setSemanticSearch] = useState(false);
  const [searchLanguage, setSearchLanguage] = useState<"auto" | "el" | "en">("auto");
  const [expandVariations, setExpandVariations] = useState(true);
  const [synonymsManagerOpen, setSynonymsManagerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Selection / viewer
  const [selectedSegId, setSelectedSegId] = useState<number | null>(null);
  const [openSeg, setOpenSeg] = useState<SegmentDTO | null>(null);
  const highlightRef = useRef<HTMLSpanElement | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const clickTimerRef = useRef<number | null>(null);

  // Manual modal
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const manualPreRef = useRef<HTMLPreElement | null>(null);
  const [manualSel, setManualSel] = useState<SelInfo | null>(null);
  const [manualStatus, setManualStatus] = useState<string>("");
  const [manualOpenSeg, setManualOpenSeg] = useState<SegmentDTO | null>(null);
  const manualListScrollRef = useRef<HTMLDivElement | null>(null);
  const manualLastScrollTopRef = useRef<number>(0);
  const manualClickTimerRef = useRef<number | null>(null);

  // Chunk edit modal
  const [chunkEditOpen, setChunkEditOpen] = useState(false);
  const [chunkEditSeg, setChunkEditSeg] = useState<SegmentDTO | null>(null);
  const [chunkEditTitle, setChunkEditTitle] = useState("");
  const [chunkEditStart, setChunkEditStart] = useState<number>(0);
  const [chunkEditEnd, setChunkEditEnd] = useState<number>(0);
  const [chunkEditContent, setChunkEditContent] = useState("");
  const [chunkEditHtml, setChunkEditHtml] = useState<string>("<p></p>");
  const [chunkEditDirty, setChunkEditDirty] = useState<boolean>(false);
  const [chunkEditStatus, setChunkEditStatus] = useState("");
  const [chunkEditFolderId, setChunkEditFolderId] = useState<string | null>(null);
  const chunkEditPreRef = useRef<HTMLPreElement | null>(null);
  const [chunkEditSyncFromDoc, setChunkEditSyncFromDoc] = useState(true);
  // P2: Research-Grade Fields
  const [chunkEditSegmentType, setChunkEditSegmentType] = useState<SegmentType | null>(null);
  const [chunkEditEvidenceGrade, setChunkEditEvidenceGrade] = useState<EvidenceGrade | null>(null);
  const [chunkEditFalsifiabilityCriteria, setChunkEditFalsifiabilityCriteria] = useState<string>("");

  // Document edit modal
  const [docEditOpen, setDocEditOpen] = useState(false);
  const [docEditText, setDocEditText] = useState("");
  const [docEditHtml, setDocEditHtml] = useState<string>("<p></p>");
  const [docEditStatus, setDocEditStatus] = useState("");
  const [docEditSaving, setDocEditSaving] = useState(false);

  // Chunk editing layout state
  const [chunkEditFullscreen, setChunkEditFullscreen] = useState(false);
  const [showChunkListInEdit, setShowChunkListInEdit] = useState(true);
  const [showAllChunksInEdit, setShowAllChunksInEdit] = useState(false);

  // Notes (Word-like)
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteHtml, setNoteHtml] = useState<string>("<p></p>");
  const [noteText, setNoteText] = useState<string>("");
  const [noteStatus, setNoteStatus] = useState<string>("");
  const [noteDirty, setNoteDirty] = useState<boolean>(false);

  // Smart Notes
  const [smartNotesOpen, setSmartNotesOpen] = useState(false);
  const [smartNotes, setSmartNotes] = useState<SmartNote[]>([]);
  const [currentSmartNote, setCurrentSmartNote] = useState<SmartNote | null>(null);
  const [smartNoteHtml, setSmartNoteHtml] = useState<string>("<p></p>");
  const [smartNoteText, setSmartNoteText] = useState<string>("");
  const [smartNoteTags, setSmartNoteTags] = useState<string[]>([]);
  const [smartNoteCategory, setSmartNoteCategory] = useState<string>("General");
  const [smartNotePriority, setSmartNotePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [smartNoteChunkId, setSmartNoteChunkId] = useState<number | undefined>(undefined);
  const [smartNoteDirty, setSmartNoteDirty] = useState<boolean>(false);
  const [smartNoteStatus, setSmartNoteStatus] = useState<string>("");
  const [smartNoteSearchQuery, setSmartNoteSearchQuery] = useState<string>("");
  const [smartNoteSelectedCategory, setSmartNoteSelectedCategory] = useState<string>("all");
  const [smartNoteSelectedTag, setSmartNoteSelectedTag] = useState<string>("");
  const [smartNoteSelectedPriority, setSmartNoteSelectedPriority] = useState<string>("all");
  const [smartNoteSortBy, setSmartNoteSortBy] = useState<'date-desc' | 'date-asc' | 'category' | 'priority' | 'title'>('date-desc');
  const [newTagInput, setNewTagInput] = useState<string>("");

  // Folders
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [folderMap, setFolderMap] = useState<Record<string, string>>({});

  // Drag and drop
  const [draggedSegment, setDraggedSegment] = useState<SegmentDTO | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Deletion confirmation
  const [deletingSegId, setDeletingSegId] = useState<number | null>(null);
  const [deletingManualSegId, setDeletingManualSegId] = useState<number | null>(null);

  // Other
  const [wizardOpen, setWizardOpen] = useState(false);
  const [structureTreeOpen, setStructureTreeOpen] = useState(false);
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  const [duplicatedChunks, setDuplicatedChunks] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderDTO | null>(null);

  // Computed values
  const canSegment = parseStatus === "ok";
  const segHtmlKey = (segId: number) => `aiorg_seg_html_${segId}`;

  return {
    // Basic state
    status,
    setStatus,
    docText,
    setDocText,
    filename,
    setFilename,

    // Ingest fields
    parseStatus,
    setParseStatus,
    parseError,
    setParseError,
    sourceType,
    setSourceType,

    // Summary + list
    summary,
    setSummary,
    mode,
    setMode,
    segments,
    setSegments,
    segmentsMeta,
    setSegmentsMeta,
    query,
    setQuery,
    sourceFilter,
    setSourceFilter,
    advancedFiltersOpen,
    setAdvancedFiltersOpen,
    minLength,
    setMinLength,
    maxLength,
    setMaxLength,
    activePreset,
    setActivePreset,
    
    // Semantic Search Options
    semanticSearch,
    setSemanticSearch,
    searchLanguage,
    setSearchLanguage,
    expandVariations,
    setExpandVariations,
    synonymsManagerOpen,
    setSynonymsManagerOpen,
    searchModalOpen,
    setSearchModalOpen,

    // Selection / viewer
    selectedSegId,
    setSelectedSegId,
    openSeg,
    setOpenSeg,
    highlightRef,
    listScrollRef,
    lastScrollTopRef,
    clickTimerRef,

    // Manual modal
    manualOpen,
    setManualOpen,
    manualTitle,
    setManualTitle,
    manualPreRef,
    manualSel,
    setManualSel,
    manualStatus,
    setManualStatus,
    manualOpenSeg,
    setManualOpenSeg,
    manualListScrollRef,
    manualLastScrollTopRef,
    manualClickTimerRef,

    // Chunk edit modal
    chunkEditOpen,
    setChunkEditOpen,
    chunkEditSeg,
    setChunkEditSeg,
    chunkEditTitle,
    setChunkEditTitle,
    chunkEditStart,
    setChunkEditStart,
    chunkEditEnd,
    setChunkEditEnd,
    chunkEditContent,
    setChunkEditContent,
    chunkEditHtml,
    setChunkEditHtml,
    chunkEditDirty,
    setChunkEditDirty,
    chunkEditStatus,
    setChunkEditStatus,
    chunkEditFolderId,
    setChunkEditFolderId,
    chunkEditPreRef,
    chunkEditSyncFromDoc,
    setChunkEditSyncFromDoc,
    // P2: Research-Grade Fields
    chunkEditSegmentType,
    setChunkEditSegmentType,
    chunkEditEvidenceGrade,
    setChunkEditEvidenceGrade,
    chunkEditFalsifiabilityCriteria,
    setChunkEditFalsifiabilityCriteria,

    // Document edit modal
    docEditOpen,
    setDocEditOpen,
    docEditText,
    setDocEditText,
    docEditHtml,
    setDocEditHtml,
    docEditStatus,
    setDocEditStatus,
    docEditSaving,
    setDocEditSaving,

    // Chunk editing layout state
    chunkEditFullscreen,
    setChunkEditFullscreen,
    showChunkListInEdit,
    setShowChunkListInEdit,
    showAllChunksInEdit,
    setShowAllChunksInEdit,

    // Notes
    notesOpen,
    setNotesOpen,
    noteHtml,
    setNoteHtml,
    noteText,
    setNoteText,
    noteStatus,
    setNoteStatus,
    noteDirty,
    setNoteDirty,

    // Smart Notes
    smartNotesOpen,
    setSmartNotesOpen,
    smartNotes,
    setSmartNotes,
    currentSmartNote,
    setCurrentSmartNote,
    smartNoteHtml,
    setSmartNoteHtml,
    smartNoteText,
    setSmartNoteText,
    smartNoteTags,
    setSmartNoteTags,
    smartNoteCategory,
    setSmartNoteCategory,
    smartNotePriority,
    setSmartNotePriority,
    smartNoteChunkId,
    setSmartNoteChunkId,
    smartNoteDirty,
    setSmartNoteDirty,
    smartNoteStatus,
    setSmartNoteStatus,
    smartNoteSearchQuery,
    setSmartNoteSearchQuery,
    smartNoteSelectedCategory,
    setSmartNoteSelectedCategory,
    smartNoteSelectedTag,
    setSmartNoteSelectedTag,
    smartNoteSelectedPriority,
    setSmartNoteSelectedPriority,
    smartNoteSortBy,
    setSmartNoteSortBy,
    newTagInput,
    setNewTagInput,

    // Folders
    foldersOpen,
    setFoldersOpen,
    folders,
    setFolders,
    folderFilter,
    setFolderFilter,
    folderMap,
    setFolderMap,

    // Drag and drop
    draggedSegment,
    setDraggedSegment,
    dragOverFolder,
    setDragOverFolder,

    // Deletion confirmation
    deletingSegId,
    setDeletingSegId,
    deletingManualSegId,
    setDeletingManualSegId,

    // Other
    wizardOpen,
    setWizardOpen,
    structureTreeOpen,
    setStructureTreeOpen,
    recycleBinOpen,
    setRecycleBinOpen,
    duplicatedChunks,
    setDuplicatedChunks,
    currentFolder,
    setCurrentFolder,

    // Computed
    canSegment,
    segHtmlKey,
  };
}

