"use client";

import type { ChatToolName } from "kal-shared";
import { memo } from "react";
import { Search, CheckCircle, Loader } from "react-feather";

export interface ToolStep {
  tool: ChatToolName;
  message: string;
  status: "running" | "done";
}

// Map tool names to friendly icons
function ToolIcon({
  tool,
  status,
}: {
  tool: ChatToolName;
  status: "running" | "done";
}) {
  if (status === "done") {
    return <CheckCircle size={13} className="text-accent shrink-0" />;
  }

  if (tool === "search_database" || tool === "extract_search_term") {
    return (
      <Search size={13} className="text-content-muted shrink-0 animate-pulse" />
    );
  }

  return (
    <Loader size={13} className="text-content-muted shrink-0 animate-spin" />
  );
}

export const ToolStepIndicator = memo(function ToolStepIndicator({
  steps,
}: {
  steps: ToolStep[];
}) {
  if (steps.length === 0) return null;

  return (
    <div className="flex gap-2.5">
      {/* Avatar column — matches ChatMessage layout */}
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-dark-elevated border border-dark-border text-accent mt-0.5">
        <span className="font-bold text-[11px]">K</span>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-1.5 py-1">
        {steps.map((step, i) => (
          <div
            key={`${step.tool}-${i}`}
            className="flex items-center gap-1.5 text-xs text-content-muted"
          >
            <ToolIcon tool={step.tool} status={step.status} />
            <span
              className={
                step.status === "done"
                  ? "text-content-secondary"
                  : "text-content-muted"
              }
            >
              {step.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
