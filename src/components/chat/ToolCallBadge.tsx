import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getLabel(toolName: string, args: Record<string, string>): string {
  const filename = args.path ? args.path.split("/").filter(Boolean).pop() : undefined;
  const suffix = filename ? ` ${filename}` : "";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":     return `Creating${suffix}`;
      case "str_replace":
      case "insert":     return `Editing${suffix}`;
      case "view":       return `Viewing${suffix}`;
      case "undo_edit":  return `Undoing edit in${suffix}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return `Renaming${suffix}`;
      case "delete": return `Deleting${suffix}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getLabel(toolInvocation.toolName, toolInvocation.args ?? {});
  const done = toolInvocation.state === "result" && "result" in toolInvocation && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
