import type { SegmentRow } from "../../../hooks/home/useHomeState";
import { useLanguage } from "../../../context/LanguageContext";

type PinnedChunk = {
  id: string;
  title: string;
  content: string;
  timestamp: number;
};

type PinnedChunksProps = {
  pinnedChunks: PinnedChunk[];
  onUnpin: (id: string) => void;
  onOpen: (chunk: PinnedChunk) => void;
  onClear: () => void;
};

export function PinnedChunks({ pinnedChunks, onUnpin, onOpen, onClear }: PinnedChunksProps) {
  const { t } = useLanguage();
  if (pinnedChunks.length === 0) {
    return (
      <div className="pinnedChunks empty">
        <div className="pinnedTitle">{t("workspace.pinnedChunks")}</div>
        <div className="pinnedEmpty">{t("workspace.noPinnedChunks")}</div>
      </div>
    );
  }

  return (
    <div className="pinnedChunks">
      <div className="pinnedHeader">
        <div className="pinnedTitle">{t("workspace.pinnedChunks")} ({pinnedChunks.length})</div>
        <button className="miniBtn" onClick={onClear} type="button">
          {t("action.clearAll")}
        </button>
      </div>
      <div className="pinnedItems">
        {pinnedChunks.map((chunk) => (
          <div key={chunk.id} className="pinnedChunk">
            <div className="pinnedChunkHeader">
              <div className="pinnedChunkTitle">{chunk.title}</div>
              <div className="pinnedChunkActions">
                <button className="miniBtn" onClick={() => onOpen(chunk)} type="button">
                  {t("action.open")}
                </button>
                <button className="miniBtn miniBtnDanger" onClick={() => onUnpin(chunk.id)} type="button">
                  {t("action.unpin")}
                </button>
              </div>
            </div>
            <div className="pinnedChunkContent">
              {chunk.content.slice(0, 120)}
              {chunk.content.length > 120 && "..."}
            </div>
            <div className="pinnedChunkTime">
              {new Date(chunk.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
