import React from "react";
import { WorkspaceLeftPane } from "./WorkspaceLeftPane";
import { WorkspaceRightPane } from "./WorkspaceRightPane";

type WorkspaceSplitAreaProps = {
  leftPane: React.ComponentProps<typeof WorkspaceLeftPane>;
  rightPane: React.ComponentProps<typeof WorkspaceRightPane>;
};

export function WorkspaceSplitArea({ leftPane, rightPane }: WorkspaceSplitAreaProps) {
  return (
    <div className="flex flex-1 min-h-0" style={{ display: "flex", flex: "1 1 auto", minHeight: 0 }}>
      <WorkspaceLeftPane {...leftPane} />
      <WorkspaceRightPane {...rightPane} />
    </div>
  );
}
