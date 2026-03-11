import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { SearchHit } from "../types";
import type { SegmentRow } from "../../../hooks/home/useHomeState";
import { stripIdsFromText } from "../utils/text";

type PreviewDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  item: SearchHit | SegmentRow | null;
  onOpen: (item: SearchHit | SegmentRow) => void;
};

export function PreviewDrawer({ isOpen, onClose, item, onOpen }: PreviewDrawerProps) {
  if (!isOpen || !item) return null;

  const isSearchHit = 'snippet' in item;
  const title = item.title || (isSearchHit ? `Result ${item.id}` : `Segment ${item.id}`);
  const content = isSearchHit 
    ? item.snippet || ""
    : (item as SegmentRow).content || "";

  const handleOpen = () => {
    onOpen(item);
    onClose();
  };

  return (
    <div className="previewDrawerOverlay" onClick={onClose}>
      <div className="previewDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="previewHeader">
          <div className="previewTitle">{title}</div>
          <div className="previewActions">
            <button className="miniBtn" onClick={handleOpen} type="button">
              Open in Slot
            </button>
            <button className="miniBtn miniBtnDanger" onClick={onClose} type="button">
              ×
            </button>
          </div>
        </div>
        <div className="previewBody">
          <div className="previewContent">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                table: ({ children }) => (
                  <div className="previewTableWrap">
                    <table>{children}</table>
                  </div>
                ),
              }}
            >
              {stripIdsFromText(content)}
            </ReactMarkdown>
          </div>
        </div>
        <div className="previewFooter">
          <div className="previewHint">Press ESC or click outside to close</div>
        </div>
      </div>
    </div>
  );
}
