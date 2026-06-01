# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Run all tests
npm test

# Run a specific test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Reset the database
npm run db:reset
```

Environment: create a `.env` file and set `ANTHROPIC_API_KEY`. Without it the app runs using `MockLanguageModel` instead of Claude.

## Architecture

UIGen is a Next.js 15 App Router app that generates React components via AI and previews them live in the browser — without writing any files to disk.

### Virtual File System

`src/lib/file-system.ts` — `VirtualFileSystem` is the core data structure. It is an in-memory tree of `FileNode` objects (files and directories). Key facts:
- Serialized to/from plain JSON for persistence (stored in the `Project.data` column as a JSON string).
- The server reconstructs the VFS from the client-supplied serialized snapshot on every API request.
- Methods like `replaceInFile`, `insertInFile`, `createFileWithParents` directly implement the AI tool actions.

### AI Chat API

`src/app/api/chat/route.ts` — POST endpoint that:
1. Reconstructs `VirtualFileSystem` from the client-sent `files` payload.
2. Calls Vercel AI SDK `streamText` with the Anthropic model (`claude-haiku-4-5`) and two tools:
   - `str_replace_editor` — create/view/edit files (built in `src/lib/tools/str-replace.ts`)
   - `file_manager` — rename/delete files (built in `src/lib/tools/file-manager.ts`)
3. On `onFinish`, saves `messages` + `fileSystem.serialize()` back to the Prisma `Project` record (only for authenticated users).

Falls back to `MockLanguageModel` (`src/lib/provider.ts`) when `ANTHROPIC_API_KEY` is absent.

The system prompt (`src/lib/prompts/generation.tsx`) instructs the model to always create `/App.jsx` as the entry point, use `@/` import aliases, and style with Tailwind.

### Client-Side State (Contexts)

`src/lib/contexts/file-system-context.tsx` — `FileSystemContext` holds the live `VirtualFileSystem` instance and a `refreshTrigger` counter. `handleToolCall` is the bridge: the Vercel AI SDK fires `onToolCall` on the client, and `handleToolCall` applies `str_replace_editor` and `file_manager` commands directly to the in-memory VFS, then increments `refreshTrigger` to drive re-renders.

`src/lib/contexts/chat-context.tsx` — `ChatContext` wraps `useChat` from `@ai-sdk/react`. It wires `body.files` (serialized VFS snapshot sent on every message) and routes `onToolCall` to `FileSystemContext.handleToolCall`.

### Live Preview Pipeline

`src/components/preview/PreviewFrame.tsx` — watches `refreshTrigger` and re-renders an `<iframe srcdoc>` on every VFS change.

`src/lib/transform/jsx-transformer.ts` — the preview pipeline:
1. Transpiles each `.jsx`/`.tsx`/`.ts`/`.js` file using `@babel/standalone`.
2. Creates blob URLs for each transpiled module.
3. Builds an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) that maps `@/` aliases, relative paths, and third-party package names (fetched from `esm.sh`) to their blob URLs or CDN URLs.
4. Injects the import map into a full HTML document loaded into the iframe. Tailwind CSS is loaded from CDN inside the preview iframe.

### Authentication

`src/lib/auth.ts` (server-only) — JWT sessions stored in httpOnly cookies via `jose`. Session payload: `{ userId, email, expiresAt }`. Default secret is `"development-secret-key"`; set `JWT_SECRET` in `.env` for production.

`src/middleware.ts` — only protects `/api/projects` and `/api/filesystem` routes. The chat API (`/api/chat`) is intentionally unprotected so anonymous users can generate components; it simply skips the DB save step when `projectId` is absent or the user is unauthenticated.

Anonymous users' work is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts` so it can be migrated to a new account on sign-up.

### Data Model

Prisma + SQLite (`prisma/dev.db`).

```prisma
User  { id, email, password, projects[] }
Project { id, name, userId?, messages (JSON string), data (JSON string) }
```

`Project.data` stores the full serialized VFS. `Project.messages` stores the full conversation history as a JSON array.

### Routing

- `/` (`src/app/page.tsx`) — anonymous users see the editor; authenticated users are redirected to their most-recent project or a newly created one.
- `/[projectId]` (`src/app/[projectId]/page.tsx`) — project view; loads `Project.messages` and `Project.data` from DB and passes them as `initialMessages` / `initialData` to the providers.

### Testing

Vitest with `@testing-library/react` and `jsdom`. Tests live next to their source files in `__tests__` directories. Run a single test file with `npx vitest run <path>`.
