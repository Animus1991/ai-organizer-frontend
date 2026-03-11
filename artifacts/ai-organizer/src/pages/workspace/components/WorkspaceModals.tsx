import React from "react";
import { SegmentType, EvidenceGrade, type SegmentationMode } from "../../../lib/api";
import DocumentStructureTree from "../../../components/DocumentStructureTree";
import Drawer from "../../../components/Drawer";
import FolderManagerDrawer from "../../../components/FolderManagerDrawer";
import EnhancedOutlineWizard from "../../../components/EnhancedOutlineWizard";
import SearchModal from "../../../components/SearchModal";
import SynonymsManager from "../../../components/SynonymsManager";
import OntologyManager from "../../../components/OntologyManager";
import ConceptMapper from "../../../components/ConceptMapper";
import { BoundaryConditionsPanel } from "../../../components/BoundaryConditionsPanel";
import { ContradictionFinder } from "../../../components/ContradictionFinder";
import { ArgumentMapVisualizer } from "../../../components/ArgumentMapVisualizer";
import { TheoryStrengthScorecard } from "../../../components/TheoryStrengthScorecard";
import { PropositionTypeCategorizer } from "../../../components/PropositionTypeCategorizer";
import { EvidenceRequirementsGenerator } from "../../../components/EvidenceRequirementsGenerator";
import { PublicationReadinessChecker } from "../../../components/PublicationReadinessChecker";
import { CounterTheoryRegistry } from "../../../components/CounterTheoryRegistry";
import { EvidenceChainBuilder } from "../../../components/EvidenceChainBuilder";
import { TheoryEvolutionTimeline } from "../../../components/TheoryEvolutionTimeline";
import { DocumentEditModal, DocumentNotesModal, ManualChunkModal, ChunkEditModal, SmartNotesModal } from "../../../components/workspace";
import { useLanguage } from "../../../context/LanguageContext";

type WorkspaceModalsProps = {
  docId: number;
  segments: any[];
  selectedSegId: number | null;
  onStructureTreeSelect: (segment: any) => void;
  structureTreeOpen: boolean;
  setStructureTreeOpen: (open: boolean) => void;
  foldersOpen: boolean;
  setFoldersOpen: (open: boolean) => void;
  folders: any[];
  setFolders: (folders: any[]) => void;
  folderMap: Record<string, string>;
  setFolderMap: (map: Record<string, string>) => void;
  setDuplicatedChunks: (chunks: any[]) => void;
  loadFolderMap: (docId: number, skipCache?: boolean) => Promise<Record<string, string>>;
  loadDuplicatedChunks: (docId: number) => any[];
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  synonymsManagerOpen: boolean;
  setSynonymsManagerOpen: (open: boolean) => void;
  notesOpen: boolean;
  setNotesOpen: (open: boolean) => void;
  noteHtml: string;
  noteText: string;
  setNoteHtml: (html: string) => void;
  setNoteText: (text: string) => void;
  setNoteDirty: (dirty: boolean) => void;
  noteDirty: boolean;
  noteStatus: string;
  saveNoteLocal: () => void;
  resetNoteFromDocument: () => void;
  smartNotesOpen: boolean;
  setSmartNotesOpen: (open: boolean) => void;
  smartNotes: any[];
  currentSmartNote: any;
  smartNoteHtml: string;
  smartNoteText: string;
  smartNoteTags: string[];
  smartNoteCategory: string;
  smartNotePriority: "low" | "medium" | "high";
  smartNoteDirty: boolean;
  smartNoteStatus: string;
  smartNoteSearchQuery: string;
  smartNoteSelectedCategory: string;
  smartNoteSelectedTag: string;
  smartNoteSelectedPriority: string;
  smartNoteSortBy: "category" | "title" | "date-desc" | "date-asc" | "priority";
  newTagInput: string;
  setSmartNoteHtml: (html: string) => void;
  setSmartNoteText: (text: string) => void;
  setSmartNoteTags: (tags: string[]) => void;
  setSmartNoteCategory: (category: string) => void;
  setSmartNotePriority: (priority: "low" | "medium" | "high") => void;
  setSmartNoteDirty: (dirty: boolean) => void;
  setSmartNoteStatus: (status: string) => void;
  setSmartNoteSearchQuery: (query: string) => void;
  setSmartNoteSelectedCategory: (category: string) => void;
  setSmartNoteSelectedTag: (tag: string) => void;
  setSmartNoteSelectedPriority: (priority: string) => void;
  setSmartNoteSortBy: (value: "category" | "title" | "date-desc" | "date-asc" | "priority") => void;
  setNewTagInput: (value: string) => void;
  createNewSmartNote: () => void;
  refreshSmartNotes: () => Promise<void>;
  saveSmartNoteLocal: () => void;
  deleteSmartNoteLocal: (id: string) => void;
  loadSmartNoteForEdit: (note: any) => void;
  addTagToSmartNote: (tag: string) => void;
  removeTagFromSmartNote: (tag: string) => void;
  filteredSmartNotes: any[];
  allCategories: string[];
  allTags: string[];
  manualOpen: boolean;
  setManualOpen: (open: boolean) => void;
  docText: string;
  mode: SegmentationMode;
  manualTitle: string;
  setManualTitle: (title: string) => void;
  manualSel: any;
  setManualSel: (sel: any) => void;
  manualStatus: string;
  setManualStatus: (status: string) => void;
  saveManualChunk: () => Promise<void>;
  manualSegments: any[];
  manualOpenSeg: any;
  setManualOpenSeg: (seg: any) => void;
  manualListScrollRef: React.RefObject<HTMLDivElement | null>;
  manualLastScrollTopRef: React.RefObject<number>;
  handleManualFolderChange: (segmentId: number, folderId: string | null) => Promise<void>;
  manualClickTimerRef: React.RefObject<number | null>;
  setSelectedSegId: (id: number | null) => void;
  openChunkEditor: (seg: any) => void;
  handleDeleteSingle: (seg: any) => void;
  deletingSegId: number | null;
  confirmDeleteSingle: (seg: any) => void;
  cancelDelete: () => void;
  segHtmlKey: (segId: number) => string;
  chunkEditOpen: boolean;
  setChunkEditOpen: (open: boolean) => void;
  chunkEditSeg: any;
  chunkEditTitle: string;
  setChunkEditTitle: (title: string) => void;
  chunkEditHtml: string;
  setChunkEditHtml: (html: string) => void;
  chunkEditDirty: boolean;
  setChunkEditDirty: (dirty: boolean) => void;
  chunkEditContent: string;
  setChunkEditContent: (text: string) => void;
  chunkEditStart: number;
  setChunkEditStart: (start: number) => void;
  chunkEditEnd: number;
  setChunkEditEnd: (end: number) => void;
  chunkEditFolderId: string | null;
  setChunkEditFolderId: (folderId: string | null) => void;
  chunkEditStatus: string;
  setChunkEditStatus: (status: string) => void;
  chunkEditSegmentType: SegmentType | null;
  setChunkEditSegmentType: (value: SegmentType | null) => void;
  chunkEditEvidenceGrade: EvidenceGrade | null;
  setChunkEditEvidenceGrade: (value: EvidenceGrade | null) => void;
  chunkEditFalsifiabilityCriteria: string;
  setChunkEditFalsifiabilityCriteria: (value: string) => void;
  saveChunkEdit: () => Promise<void>;
  chunkEditFullscreen: boolean;
  setChunkEditFullscreen: (value: boolean) => void;
  showChunkListInEdit: boolean;
  setShowChunkListInEdit: (value: boolean) => void;
  showAllChunksInEdit: boolean;
  setShowAllChunksInEdit: (value: boolean) => void;
  chunkEditSyncFromDoc: boolean;
  setChunkEditSyncFromDoc: (value: boolean) => void;
  docEditOpen: boolean;
  setDocEditOpen: (open: boolean) => void;
  docEditHtml: string;
  setDocEditHtml: (value: string) => void;
  docEditText: string;
  setDocEditText: (value: string) => void;
  saveDocEdit: () => Promise<void>;
  docEditStatus: string;
  docEditSaving: boolean;
  navToDocument: (documentId: number, segmentId?: number) => void;
};

export function WorkspaceModals(props: WorkspaceModalsProps) {
  const { t } = useLanguage();
  const [conceptMapperOpen, setConceptMapperOpen] = React.useState(false);
  const [ontologyManagerOpen, setOntologyManagerOpen] = React.useState(false);
  const [boundaryPanelOpen, setBoundaryPanelOpen] = React.useState(false);
  const [contradictionFinderOpen, setContradictionFinderOpen] = React.useState(false);
  const [argumentMapOpen, setArgumentMapOpen] = React.useState(false);
  const [theoryScorecardOpen, setTheoryScorecardOpen] = React.useState(false);
  const [propCategorizerOpen, setPropCategorizerOpen] = React.useState(false);
  const [evidenceReqsOpen, setEvidenceReqsOpen] = React.useState(false);
  const [pubReadinessOpen, setPubReadinessOpen] = React.useState(false);
  const [counterTheoryOpen, setCounterTheoryOpen] = React.useState(false);
  const [evidenceChainOpen, setEvidenceChainOpen] = React.useState(false);
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const {
    docId,
    segments,
    selectedSegId,
    onStructureTreeSelect,
    structureTreeOpen,
    setStructureTreeOpen,
    foldersOpen,
    setFoldersOpen,
    folders,
    setFolders,
    folderMap,
    setFolderMap,
    setDuplicatedChunks,
    loadFolderMap,
    loadDuplicatedChunks,
    wizardOpen,
    setWizardOpen,
    searchModalOpen,
    setSearchModalOpen,
    synonymsManagerOpen,
    setSynonymsManagerOpen,
    notesOpen,
    setNotesOpen,
    noteHtml,
    noteText,
    setNoteHtml,
    setNoteText,
    setNoteDirty,
    noteDirty,
    noteStatus,
    saveNoteLocal,
    resetNoteFromDocument,
    smartNotesOpen,
    setSmartNotesOpen,
    smartNotes,
    currentSmartNote,
    smartNoteHtml,
    smartNoteText,
    smartNoteTags,
    smartNoteCategory,
    smartNotePriority,
    smartNoteDirty,
    smartNoteStatus,
    smartNoteSearchQuery,
    smartNoteSelectedCategory,
    smartNoteSelectedTag,
    smartNoteSelectedPriority,
    smartNoteSortBy,
    newTagInput,
    setSmartNoteHtml,
    setSmartNoteText,
    setSmartNoteTags,
    setSmartNoteCategory,
    setSmartNotePriority,
    setSmartNoteDirty,
    setSmartNoteStatus,
    setSmartNoteSearchQuery,
    setSmartNoteSelectedCategory,
    setSmartNoteSelectedTag,
    setSmartNoteSelectedPriority,
    setSmartNoteSortBy,
    setNewTagInput,
    createNewSmartNote,
    refreshSmartNotes,
    saveSmartNoteLocal,
    deleteSmartNoteLocal,
    loadSmartNoteForEdit,
    addTagToSmartNote,
    removeTagFromSmartNote,
    filteredSmartNotes,
    allCategories,
    allTags,
    manualOpen,
    setManualOpen,
    docText,
    mode,
    manualTitle,
    setManualTitle,
    manualSel,
    setManualSel,
    manualStatus,
    setManualStatus,
    saveManualChunk,
    manualSegments,
    manualOpenSeg,
    setManualOpenSeg,
    manualListScrollRef,
    manualLastScrollTopRef,
    handleManualFolderChange,
    manualClickTimerRef,
    setSelectedSegId,
    openChunkEditor,
    handleDeleteSingle,
    deletingSegId,
    confirmDeleteSingle,
    cancelDelete,
    segHtmlKey,
    chunkEditOpen,
    setChunkEditOpen,
    chunkEditSeg,
    chunkEditTitle,
    setChunkEditTitle,
    chunkEditHtml,
    setChunkEditHtml,
    chunkEditDirty,
    setChunkEditDirty,
    chunkEditContent,
    setChunkEditContent,
    chunkEditStart,
    setChunkEditStart,
    chunkEditEnd,
    setChunkEditEnd,
    chunkEditFolderId,
    setChunkEditFolderId,
    chunkEditStatus,
    setChunkEditStatus,
    chunkEditSegmentType,
    setChunkEditSegmentType,
    chunkEditEvidenceGrade,
    setChunkEditEvidenceGrade,
    chunkEditFalsifiabilityCriteria,
    setChunkEditFalsifiabilityCriteria,
    saveChunkEdit,
    chunkEditFullscreen,
    setChunkEditFullscreen,
    showChunkListInEdit,
    setShowChunkListInEdit,
    showAllChunksInEdit,
    setShowAllChunksInEdit,
    chunkEditSyncFromDoc,
    setChunkEditSyncFromDoc,
    docEditOpen,
    setDocEditOpen,
    docEditHtml,
    setDocEditHtml,
    docEditText,
    setDocEditText,
    saveDocEdit,
    docEditStatus,
    docEditSaving,
    navToDocument,
  } = props;

  return (
    <>
      <DocumentNotesModal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        html={noteHtml}
        text={noteText}
        onHtmlChange={(html) => {
          setNoteHtml(html);
          setNoteDirty(true);
        }}
        onTextChange={setNoteText}
        onSave={saveNoteLocal}
        onResetFromDocument={resetNoteFromDocument}
        dirty={noteDirty}
        status={noteStatus}
      />

      <SmartNotesModal
        open={smartNotesOpen}
        onClose={() => setSmartNotesOpen(false)}
        docId={docId}
        onRefresh={refreshSmartNotes}
        smartNotes={smartNotes}
        currentSmartNote={currentSmartNote}
        smartNoteHtml={smartNoteHtml}
        smartNoteText={smartNoteText}
        smartNoteTags={smartNoteTags}
        smartNoteCategory={smartNoteCategory}
        smartNotePriority={smartNotePriority}
        smartNoteDirty={smartNoteDirty}
        smartNoteStatus={smartNoteStatus}
        smartNoteSearchQuery={smartNoteSearchQuery}
        smartNoteSelectedCategory={smartNoteSelectedCategory}
        smartNoteSelectedTag={smartNoteSelectedTag}
        newTagInput={newTagInput}
        onHtmlChange={(html) => {
          setSmartNoteHtml(html);
          setSmartNoteDirty(true);
        }}
        onTextChange={setSmartNoteText}
        onTagsChange={(tags) => {
          setSmartNoteTags(tags);
          setSmartNoteDirty(true);
        }}
        onCategoryChange={(category) => {
          setSmartNoteCategory(category);
          setSmartNoteDirty(true);
        }}
        onPriorityChange={(priority) => {
          setSmartNotePriority(priority);
          setSmartNoteDirty(true);
        }}
        onDirtyChange={setSmartNoteDirty}
        onStatusChange={setSmartNoteStatus}
        onSearchQueryChange={setSmartNoteSearchQuery}
        onSelectedCategoryChange={setSmartNoteSelectedCategory}
        onSelectedTagChange={setSmartNoteSelectedTag}
        smartNoteSelectedPriority={smartNoteSelectedPriority}
        onSelectedPriorityChange={setSmartNoteSelectedPriority}
        smartNoteSortBy={smartNoteSortBy}
        onSortByChange={setSmartNoteSortBy}
        onNewTagInputChange={setNewTagInput}
        onCreateNew={createNewSmartNote}
        onSave={saveSmartNoteLocal}
        onDelete={deleteSmartNoteLocal}
        onLoadNote={loadSmartNoteForEdit}
        onAddTag={addTagToSmartNote}
        onRemoveTag={removeTagFromSmartNote}
        filteredSmartNotes={filteredSmartNotes}
        allCategories={allCategories}
        allTags={allTags}
      />

      <ManualChunkModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        docText={docText}
        mode={mode}
        title={manualTitle}
        onTitleChange={setManualTitle}
        selection={manualSel}
        onSelectionChange={(sel) => {
          setManualSel(sel);
          setManualStatus(sel ? `Selected ${sel.end - sel.start} chars.` : "No selection.");
        }}
        status={manualStatus}
        onStatusChange={setManualStatus}
        onSave={saveManualChunk}
        manualSegments={manualSegments}
        openSegment={manualOpenSeg}
        onOpenSegmentChange={(seg) => {
          if (manualListScrollRef.current) (manualLastScrollTopRef as any).current = manualListScrollRef.current.scrollTop;
          setManualOpenSeg(seg);
        }}
        folderMap={folderMap}
        folders={folders}
        onFolderChange={handleManualFolderChange}
        onSegmentSelect={(seg) => {
          if (manualClickTimerRef.current) window.clearTimeout(manualClickTimerRef.current as any);
          (manualClickTimerRef as any).current = window.setTimeout(() => {
            setSelectedSegId(seg.id);
            setManualStatus(`Selected saved chunk: ${seg.title}`);
          }, 170);
        }}
        onSegmentOpen={(seg) => {
          if (manualClickTimerRef.current) window.clearTimeout(manualClickTimerRef.current);
          setSelectedSegId(seg.id);
          if (manualListScrollRef.current) (manualLastScrollTopRef as any).current = manualListScrollRef.current.scrollTop;
          setManualOpenSeg(seg);
        }}
        onSegmentEdit={openChunkEditor}
        onSegmentDelete={handleDeleteSingle}
        deletingSegId={deletingSegId}
        onConfirmDelete={confirmDeleteSingle}
        onCancelDelete={cancelDelete}
        segHtmlKey={segHtmlKey}
      />

      <ChunkEditModal
        open={chunkEditOpen}
        segment={chunkEditSeg}
        onClose={() => setChunkEditOpen(false)}
        docText={docText}
        title={chunkEditTitle}
        onTitleChange={setChunkEditTitle}
        html={chunkEditHtml}
        content={chunkEditContent}
        onHtmlChange={(html) => {
          setChunkEditHtml(html);
          setChunkEditDirty(true);
        }}
        onContentChange={setChunkEditContent}
        start={chunkEditStart}
        end={chunkEditEnd}
        onStartChange={setChunkEditStart}
        onEndChange={setChunkEditEnd}
        folderId={chunkEditFolderId}
        onFolderChange={setChunkEditFolderId}
        folders={folders}
        dirty={chunkEditDirty}
        status={chunkEditStatus}
        onStatusChange={setChunkEditStatus}
        segmentType={chunkEditSegmentType}
        onSegmentTypeChange={(type) => {
          setChunkEditSegmentType(type);
          setChunkEditDirty(true);
        }}
        evidenceGrade={chunkEditEvidenceGrade}
        onEvidenceGradeChange={(grade) => {
          setChunkEditEvidenceGrade(grade);
          setChunkEditDirty(true);
        }}
        falsifiabilityCriteria={chunkEditFalsifiabilityCriteria}
        onFalsifiabilityCriteriaChange={(criteria) => {
          setChunkEditFalsifiabilityCriteria(criteria);
          setChunkEditDirty(true);
        }}
        onSave={saveChunkEdit}
        fullscreen={chunkEditFullscreen}
        onFullscreenChange={setChunkEditFullscreen}
        showChunkList={showChunkListInEdit}
        onShowChunkListChange={setShowChunkListInEdit}
        showAllChunks={showAllChunksInEdit}
        onShowAllChunksChange={setShowAllChunksInEdit}
        segments={segments}
        onChunkSelect={openChunkEditor}
        syncFromDoc={chunkEditSyncFromDoc}
        onSyncFromDocChange={setChunkEditSyncFromDoc}
      />

      <DocumentEditModal
        open={docEditOpen}
        onClose={() => setDocEditOpen(false)}
        html={docEditHtml}
        text={docEditText}
        onHtmlChange={setDocEditHtml}
        onTextChange={setDocEditText}
        onSave={saveDocEdit}
        status={docEditStatus}
        saving={docEditSaving}
        docId={docId}
      />

      <FolderManagerDrawer
        docId={docId}
        open={foldersOpen}
        onClose={() => setFoldersOpen(false)}
        folders={folders}
        onChanged={async (updatedFolders) => {
          setFolders([...updatedFolders]);
          const nextFolderMap = await loadFolderMap(docId, true);
          setFolderMap({ ...nextFolderMap });
          setDuplicatedChunks(loadDuplicatedChunks(docId));
        }}
      />

      <EnhancedOutlineWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        documentId={docId}
        segments={segments}
      />

      <Drawer
        open={structureTreeOpen}
        onClose={() => setStructureTreeOpen(false)}
        title={t("structure.drawerTitle", { docId })}
        width={500}
      >
        <DocumentStructureTree
          segments={segments}
          selectedSegmentId={selectedSegId}
          onSegmentClick={(segment) => {
            onStructureTreeSelect(segment);
          }}
          groupBy="type"
          showMetadata={true}
        />
      </Drawer>

      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectResult={(result) => {
          if (result.type === "document") {
            const targetDocId = typeof result.documentId === "number" ? result.documentId : result.id;
            if (typeof targetDocId === "number") {
              navToDocument(targetDocId);
            }
          } else if (result.type === "segment") {
            if (typeof result.documentId === "number") {
              navToDocument(result.documentId, result.id as number);
            }
          }
          setSearchModalOpen(false);
        }}
      />

      <SynonymsManager
        open={synonymsManagerOpen}
        onClose={() => setSynonymsManagerOpen(false)}
      />

      <OntologyManager open={ontologyManagerOpen} onClose={() => setOntologyManagerOpen(false)} />

      <ConceptMapper segments={segments} open={conceptMapperOpen} onClose={() => setConceptMapperOpen(false)} />

      <BoundaryConditionsPanel open={boundaryPanelOpen} onClose={() => setBoundaryPanelOpen(false)} />

      <ContradictionFinder open={contradictionFinderOpen} onClose={() => setContradictionFinderOpen(false)} />

      <ArgumentMapVisualizer open={argumentMapOpen} onClose={() => setArgumentMapOpen(false)} />

      <TheoryStrengthScorecard open={theoryScorecardOpen} onClose={() => setTheoryScorecardOpen(false)} />

      <PropositionTypeCategorizer open={propCategorizerOpen} onClose={() => setPropCategorizerOpen(false)} />
      <EvidenceRequirementsGenerator open={evidenceReqsOpen} onClose={() => setEvidenceReqsOpen(false)} />
      <PublicationReadinessChecker open={pubReadinessOpen} onClose={() => setPubReadinessOpen(false)} />
      <CounterTheoryRegistry open={counterTheoryOpen} onClose={() => setCounterTheoryOpen(false)} />
      <EvidenceChainBuilder open={evidenceChainOpen} onClose={() => setEvidenceChainOpen(false)} />
      <TheoryEvolutionTimeline open={timelineOpen} onClose={() => setTimelineOpen(false)} />
    </>
  );
}
