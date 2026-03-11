export type SearchHit = {
  id: string;
  docId: number;
  title: string;
  snippet: string;
  score?: number | null;
  createdAt?: string | null;
};

export type Pending = {
  hit: SearchHit;
};

export type Slot =
  | { slotId: string; kind: "empty"; title: string; locked?: boolean; lockPassword?: string }
  | { slotId: string; kind: "doc"; title: string; docId: number; text: string; locked?: boolean; lockPassword?: string }
  | {
      slotId: string;
      kind: "notepad";
      title: string;
      text: string;
      wrap: boolean;
      locked?: boolean;
      lockPassword?: string;
      onToggleWrap?: () => void;
      onInsertTime?: () => void;
      onDownload?: () => void;
      onClear?: () => void;
      onFloat?: () => void;
    };

export type FloatingPad = {
  id: string;
  title: string;
  text: string;
  wrap: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  sticky?: boolean;
  minimized?: boolean;
  sourceSlotId?: string; // Connection to original slot
};

export type FloatingPadPatch = Partial<Omit<FloatingPad, "id">>;
