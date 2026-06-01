import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(overrides: Partial<ToolInvocation>): ToolInvocation {
  return {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args: {},
    state: "result",
    result: "Success",
    ...overrides,
  } as ToolInvocation;
}

// str_replace_editor label tests

test("shows 'Creating <filename>' for str_replace_editor create", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "create", path: "/App.jsx" } })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor str_replace", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "str_replace", path: "/src/Card.jsx" } })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor insert", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "insert", path: "/App.jsx" } })}
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Viewing <filename>' for str_replace_editor view", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "view", path: "/index.ts" } })}
    />
  );
  expect(screen.getByText("Viewing index.ts")).toBeDefined();
});

test("shows 'Undoing edit in <filename>' for str_replace_editor undo_edit", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "undo_edit", path: "/App.jsx" } })}
    />
  );
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

// file_manager label tests

test("shows 'Renaming <filename>' for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({
        toolName: "file_manager",
        args: { command: "rename", path: "/OldName.jsx" },
      })}
    />
  );
  expect(screen.getByText("Renaming OldName.jsx")).toBeDefined();
});

test("shows 'Deleting <filename>' for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({
        toolName: "file_manager",
        args: { command: "delete", path: "/Temp.jsx" },
      })}
    />
  );
  expect(screen.getByText("Deleting Temp.jsx")).toBeDefined();
});

// Filename extraction

test("extracts filename from nested path", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "create", path: "/src/components/Button.tsx" } })}
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("omits filename when path is absent", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "create" } })}
    />
  );
  expect(screen.getByText("Creating")).toBeDefined();
});

// Fallback for unknown tool/command

test("falls back to toolName for unknown tool", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ toolName: "unknown_tool", args: {} })}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("falls back to toolName for unknown command on known tool", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ args: { command: "unknown_command", path: "/App.jsx" } })}
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// State indicator tests

test("shows green dot when state is result with a result", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ state: "result", result: "ok" })}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call (in-progress)", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation({ state: "call", result: undefined } as unknown as ToolInvocation)}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
