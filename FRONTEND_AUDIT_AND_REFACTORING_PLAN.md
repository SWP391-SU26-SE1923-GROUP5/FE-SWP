# Frontend (`FE-main`) Exhaustive System Audit & Refactoring Plan

This document serves as the complete, deeply skeptical, word-by-word audit report and execution plan across all routes (`app/`), actions (`lib/actions/`), components (`components/`), and types (`types/`) inside the `FE-main` frontend repository.

---

## Executive Summary: Current System Integrity & Verified Progress

### Verified Completed Frontend Fixes (Build Clean)
The following files have been updated, verified, and compile with **0 TypeScript errors (`npx tsc --noEmit`)**:
1. **`components/Pagination.tsx` [NEW]**: A universal, elegant, responsive pagination component supporting both **URL SearchParams navigation** (`?page=X&limit=Y` for Server Components) and **in-memory State navigation** (`onPageChange` for Client Components like the Trash Bin).
2. **`app/home/[type]/page.tsx`**: Upgraded to read `page` and `limit` from URL query parameters, pass them into `getFiles()`, and render `<Pagination />` gracefully beneath the file cards grid.
3. **`app/trash/page.tsx`**: Replaced hardcoded inline pagination HTML in both Table View and Grid View with the unified `<Pagination />` component. Cleaned up duplicate text containers for 100% UI consistency across the platform.
4. **`components/FileUploader.tsx` & `MobileNavigation.tsx`**: Fixed the critical mobile upload bug where `<FileUploader />` was called without a `subjects` prop, causing an empty dropdown (`Choose an existing subject...`) on mobile devices. `FileUploader` now automatically loads subjects via `getSubjects()` on fallback.
5. **`lib/actions/providers/local.storage.ts`**:
   - **`getSubjects()`**: Appended `?Limit=100` to the fetch URL so the frontend immediately receives up to 100 subjects right now, preventing the 10-item truncation before the backend team updates the `PaginationParams` default.
   - **`getFiles()`**: Refined batch fetching when `types.length > 0` (`/home/documents`, `/home/images`, etc.) to fetch up to `Limit=100` (`MaxLimit`) from `/api/Document`, run clean category filtering (`types.includes(getFileCategory(file.fileType))`), calculate exact `total = documents.length`, and slice for `page` (`(page - 1) * limit` to `page * limit`).

---

## 1. 🚨 Broken Legacy Code & Dead Appwrite Leftovers (Critical Action Needed)

When running TypeScript validation (`cmd /c npx tsc --noEmit`), **100% of our newly modified pages and components compiled with 0 errors**. However, the TypeScript compiler threw **13 critical compilation errors** across older legacy/unrelated files due to dead `Appwrite` stubs, direct backend database bindings, and out-of-sync type definitions:

### A. Server Action Breakdown (`lib/actions/admin.actions.ts`)
- **The Issue**: `admin.actions.ts` still attempts to import `appwriteConfig` and `createAdminClient` from `@/lib/appwrite/config` and `@/lib/appwrite` (`error TS2307: Cannot find module '@/lib/appwrite/config'`), even though the entire system migrated away from Appwrite to the `.NET` C# REST API (`BE-dev1`).
- **Direct Database/AWS Couplings**: `admin.actions.ts` also instantiates direct `pg.Pool` (`process.env.DATABASE_URL`) connections and AWS `@aws-sdk/client-s3` (`S3Client`) instances directly inside frontend Next.js Server Actions.
- **Why It Must Be Cleaned**: Having direct database connection pools inside frontend server actions bypasses the C# backend API (`BE-dev1`), violates clean architecture, risks connection exhaustion, and breaks the build because `@/lib/appwrite` no longer exists.
- **Refactoring Strategy**: Refactor `admin.actions.ts` to call the `/api/Admin` endpoints on `BE-dev1` using standard REST `fetch()` calls (like `local.storage.ts`) and completely strip out all Appwrite (`node-appwrite`), `pg`, and `@aws-sdk/client-s3` imports from the frontend.

### B. Admin UI Route Type Mismatches (`app/admin/*`)
- **The Issues**:
  1. `app/admin/layout.tsx` (Line 23): `error TS2339: Property 'avatar' does not exist on type 'User'.`
  2. `app/admin/settings/page.tsx` (Lines 44-45): `error TS2339: Property 'username' does not exist on type 'User'.` and `Property 'accountId' does not exist on type 'User'.`
  3. `app/admin/users/page.tsx` (Line 29) & `admin.actions.ts` (Line 255): `error TS2339: Property '$id' does not exist on type 'User'.`
- **Root Cause**: The `/admin/*` pages were originally built against legacy Appwrite User objects (which used `$id`, `username`, `accountId`, and `avatar`). Our unified `User` interface in `types/index.d.ts` (synced with `BE-dev1`) uses `id`, `fullName`, and `email`.
- **Refactoring Strategy**: Update all variable bindings inside `app/admin/layout.tsx`, `app/admin/settings/page.tsx`, and `app/admin/users/page.tsx` to reference `user.id`, `user.fullName`, and our `avatarPlaceholderUrl` constant.

### C. Component Type Errors (`components/*`)
- **`components/ActionDropdown.tsx` (Lines 198-199)**:
  - `error TS2339: Property 'id' does not exist on type 'QuizResponse'` and `Property 'title' does not exist on type 'QuizResponse'`.
  - **Root Cause**: The `QuizResponse` interface inside `types/index.d.ts` defines `quizId: string;` and `documentName?: string;`, but `ActionDropdown.tsx` attempts to access `.id` and `.title` when rendering quiz options.
  - **Refactoring Strategy**: Align property lookups in `ActionDropdown.tsx` to check `quiz.quizId || (quiz as any).id` and `quiz.title || (quiz as any).documentName || "Quiz"`.
- **`components/ApryseViewer.tsx` (Line 44)**:
  - `error TS2353: Object literal may only specify known properties, and 'enableReadOnlyMode' does not exist in type 'WebViewerOptions'.`
  - **Refactoring Strategy**: Remove the invalid `enableReadOnlyMode` property from `WebViewerOptions` or cast the options object safely to satisfy the WebViewer SDK definitions.
- **`components/FilePreviewWrapper.tsx` (Line 122)**:
  - `error TS2339: Property 'contentType' does not exist on type '{ data: string; }'.`
  - **Refactoring Strategy**: Safely check for `(response as any).contentType` or update the return type of the document preview action to explicitly include `contentType?: string;`.

---

## 2. 🔀 Routing Inconsistencies & Split Directories (`app/`)

An exhaustive review of `app/` revealed that major features are currently split between **singular** and **plural** top-level directory names:

| Feature Area | Plural List Route | Singular Detail / Study Route | Why This Is Inconsistent & Confusing |
| :--- | :--- | :--- | :--- |
| **Flashcards** | `app/flashcards/page.tsx` (`/flashcards`) | `app/flashcard/[flashcardId]/page.tsx` (`/flashcard/[id]`) | List view lives in `/flashcards`, but clicking a deck navigates to `/flashcard/123`. Separating singular/plural top-level folders prevents clean nested layout sharing (`layout.tsx`) and clutters the root route structure. |
| **Quizzes** | `app/quizzes/page.tsx` (`/quizzes`) | `app/quiz/[quizId]/page.tsx` (`/quiz/[id]`) | List view lives in `/quizzes`, but taking a quiz navigates to `/quiz/123`. |
| **Documents** | `app/home/[type]/page.tsx` (`/home/documents`) | `app/document/report/[id]/page.tsx` (`/document/report/[id]`) | The main active files dashboard uses `/home/[type]`, but AI reports live under `/document/report/[id]`. Furthermore, there is no dedicated `/document/[id]` detail page. |

### Why This Architecture Should Be Refactored
1. **Layout Isolation**: If a user is on `/flashcards` and transitions to `/flashcard/123`, Next.js must unmount the `/flashcards` layout and mount the `/flashcard` layout from scratch.
2. **Maintenance Overhead**: Having 16+ root folders (`flashcard`, `flashcards`, `quiz`, `quizzes`, `document`, `home`, etc.) makes project navigation unnecessarily complex.

### Recommended Route Consolidation Strategy
- Migrate detail pages inside their respective plural route structure:
  - Move `app/flashcard/[flashcardId]/page.tsx` -> `app/flashcards/[flashcardId]/page.tsx` (`/flashcards/[id]`).
  - Move `app/quiz/[quizId]/page.tsx` -> `app/quizzes/[quizId]/page.tsx` (`/quizzes/[id]`).
- Add strict 308 permanent redirects (`redirect('/flashcards/:id')`) inside `app/flashcard/[flashcardId]/page.tsx` during transition to ensure zero broken links or bookmarks.

---

## 3. 📄 Missing / Incomplete Pages That Need Adding

To deliver an elegant, complete, premium AI Study Hub web application, two critical standalone pages should be added to the frontend routing structure:

### A. Standalone Document Detail / Study Hub Page (`app/document/[id]/page.tsx`)
- **Current Limitation**: When users click a file on `/home/documents` or `/trash`, they either view a small modal wrapper or jump straight to the AI report (`/document/report/[id]`).
- **Required New Page**: Create a dedicated, premium **Document Detail & Study Hub (`/document/[id]`)** page featuring:
  1. **Split-Screen Layout**: Embedded document viewer (`ApryseViewer` / PDF Preview) on the left side.
  2. **AI Action Sidebar**: Right side panel displaying quick buttons to `Generate Quiz`, `Generate Flashcards`, `View AI Report`, and `Reprocess Embeddings`.
  3. **Associated Content Tabs**: Interactive tabs showing all existing Flashcard Decks and Quizzes generated from this specific `documentId`.

### B. Dedicated Subject Hub Page (`app/home/subject/[subjectId]/page.tsx` or `app/subjects/[id]/page.tsx`)
- **Current Limitation**: Users can select a subject when uploading (`FileUploader`) and filter by `?subjectId=abc` via URL query params on the dashboard, but there is no dedicated, unified **Subject Dashboard page**.
- **Required New Page**: Create a dedicated **Subject Hub (`/subjects/[id]`)** displaying:
  1. **Subject Header**: Subject Name, Subject Code, Total Documents Count, Total Storage Used, and XP/Gamification badge.
  2. **Category breakdown**: Filtered tabs (`Documents`, `Images`, `Media`, `Others`) specific to this subject.
  3. **Subject Study Center**: Combined list of all Quizzes and Flashcard decks belonging to any document uploaded under this subject.

---

## 4. 🧹 Files Needing Comment Cleanup & Code Standardization

### A. `lib/actions/providers/local.storage.ts`
- **Comment Cleanup**: Remove large blocks of outdated commented-out mock code, obsolete TODOs regarding `dummy.json`, and legacy Appwrite fallback comments.
- **Error Handling Standardization**: Standardize catch blocks. Currently, some methods use `res.json().catch(() => ({}))` while others use generic `throw new Error(...)` or `this.handleError(error, "ActionName")`. Every method should consistently invoke `this.handleError(error, "ActionName")` for unified error logging and user notification.

### B. `components/Sort.tsx`
- **Logic Refactoring**: Currently, when `Sort` updates the `sort` parameter or filters by `subjectId`, it replaces the URL search parameters (`router.push`). We must verify that changing sort order or subject selection cleanly resets `page=1` in the query string so users don't get stranded on `page=4` of a newly filtered query that only has 1 page.

### C. `types/index.d.ts` & `types/admin.ts`
- **Cleanup & Deduping**: Unify `QuizResponse`, `Flashcard`, and `User` definitions between `index.d.ts` and `admin.ts` so components (`ActionDropdown`, `AdminUsers`) never suffer from property name mismatches (`id` vs `quizId`, `$id` vs `id`).

---

## 🎯 Prioritized Action Plan & Execution Roadmap

### Phase 1: Immediate Type Safety & Build Stabilization (Zero Errors)
1. **Clean `admin.actions.ts`**: Remove `@/lib/appwrite`, `pg.Pool`, and `@aws-sdk/client-s3` imports. Replace with clean REST API calls to `/api/Admin`.
2. **Fix `app/admin/*` and `ActionDropdown.tsx`**: Update property references (`user.id`, `user.fullName`, `quiz.quizId`) to resolve all 13 TypeScript build errors. Verify `cmd /c npx tsc --noEmit` exits cleanly with **0 errors**.

### Phase 2: Route Consolidation & Comment Cleaning
1. **Clean `local.storage.ts` & `Sort.tsx`**: Strip legacy comments and standardize URL parameter resets (`page=1` on filter/sort change).
2. **Consolidate `flashcard` -> `flashcards` and `quiz` -> `quizzes`**: Move detail study routes under plural root directories with clean backward-compatible redirects.

### Phase 3: Premium New Page Implementations
1. **Build `app/document/[id]/page.tsx`**: Implement the split-screen Document Detail & Study Center page.
2. **Build `app/subjects/[id]/page.tsx`**: Implement the comprehensive Subject Hub page with category tabs and study decks.

---

## 5. 🛠️ UI/UX Polish: ActionDropdown & Dashboard Layout Audit (Completed)

### A. Root Cause & Fix of Missing/Unclickable Three Dots (`ActionDropdown`)
- **Radix UI `asChild` Mismatch (`components/ActionDropdown.tsx`)**:
  Radix UI `<DropdownMenuTrigger asChild>` expects a direct native DOM node (`<button>` or `<div>`) to receive ref forwarding, event attachment (`onClick`), and ARIA attributes (`aria-expanded`). Previously wrapping `<Image src="/assets/icons/dots.svg" />` (`next/image`) directly caused event listeners to drop.
  - **Resolution**: Wrapped `<Image />` inside a native `<button type="button" onClick={(e) => e.stopPropagation()} className="... shrink-0 cursor-pointer">` node.
- **Click Event Bubbling in File Cards (`components/Card.tsx`)**:
  `ActionDropdown` sits inside `FilePreviewWrapper` (`onClick={handleOpenRealDoc}`). Without `e.stopPropagation()` on the trigger button, clicking the three dots opened the document preview modal instead of the dropdown action menu.
  - **Resolution**: `stopPropagation()` attached to the trigger button prevents modal triggering.

### B. Dashboard "Recent files uploaded" Clutter & Overflow (`app/home/page.tsx`)
- **Flex Overflow due to Missing `min-w-0` (`app/home/page.tsx`)**:
  In CSS Flexbox, flex items (`flex-1`) have an intrinsic minimum width of `auto`. When a file title (`file.fileName`) was long (`BACKEND_MASTER_SYNTHESIS_...`), `FilePreviewWrapper` refused to shrink and pushed the right-side pills and `ActionDropdown` outside the 450px sidebar container.
  - **Resolution**: Added `min-w-0` on `FilePreviewWrapper` and `truncate` (`line-clamp-1`) on `recent-file-name` so text cleanly truncates with ellipses (`...`).
- **Compact Pills Alignment**:
  Restructured the pills container (`flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2`) with strict `max-w-[110px]` limits on subject badges and `whitespace-nowrap` on AI status badges so they remain perfectly aligned right next to the three dots icon (`ActionDropdown`).

### C. Share & Details Modal Horizontal Overflow (`components/ActionsModalContent.tsx` & `ActionDropdown.tsx`)
- **Header Banner Overflow (`ImageThumbnail`)**:
  When sharing a file with a long name (`BACKEND_MASTER_SYNTHESIS_FULL_v18.pdf`), `file-details-thumbnail` (`@apply !mb-1 flex items-center gap-3 ... p-3`) overflowed horizontally to the right of the `shad-dialog` window (`max-w-[400px]`).
  - **Resolution**: Added `min-w-0 w-full overflow-hidden` to the header card (`ImageThumbnail`) and `truncate w-full` to `<p className="subtitle-2 mb-0.5 truncate w-full text-light-100">` so any file title truncates neatly with ellipses inside the grey banner.
- **Shared Users List Collisions (`ShareInput`)**:
  Long email addresses and user counters (`1 users`) overlapping or pushing items past `DialogContent` boundaries.
  - **Resolution**: Added `min-w-0 flex-1 truncate` across all items (`ownerName`, `ownerEmail`, `email`) and set explicit `sm:max-w-[460px] w-full overflow-hidden` on `DialogContent` (`ActionDropdown.tsx`), eliminating scrollbars and ensuring clean alignment.

### D. Trash Page & Feature Hub Empty States Full-Width Alignment (`app/trash/page.tsx`)
- **Restricted Empty State Container Width (`max-w-2xl mx-auto`)**:
  On `http://localhost:3000/trash`, when the trash bin was clean (`trashFiles.length === 0`), the empty state white card (`Your Trash Bin is Clean`) was constrained to `max-w-2xl` (`672px`). Because the top search/filter header bar spans the full container width (`w-full`), having a narrow box in the center created massive uncoordinated horizontal margins and looked unbalanced on desktop screens.
  - **Resolution**: Replaced `max-w-2xl mx-auto` with `w-full` across both `trashFiles.length === 0` and `filteredAndSortedFiles.length === 0` in `app/trash/page.tsx`, and ensured `w-full` on `flashcards` and `quizzes` empty states (`app/flashcards/page.tsx`, `app/quizzes/page.tsx`). The empty state containers now expand to the full width (`w-full`) of the page grid, perfectly matching the header bar and data table.

### E. Trash Page Sidebar Navigation Integration (`constants/nav.ts`, `Sidebar.tsx`, `MobileNavigation.tsx`)
- **Missing Direct Navigation to Trash Bin**:
  Users had no easy way to navigate to `/trash` directly from the sidebar storage links.
  - **Resolution**:
    1. Added `Trash Bin` (`url: "/trash", section: "main"`) directly to `navItems` in `constants/nav.ts` under the Storage section right below `Others`.
    2. Updated `renderNavIcon` in both `components/Sidebar.tsx` and `components/MobileNavigation.tsx` to render `Trash2` (`lucide-react`) with a soft red icon (`text-red-500/80`) when idle and clean white (`text-white`) when active (`shad-active`).
    3. Fixed active icon contrast for all `lucide-react` nav icons (`BarChart3`, `Bell`, `Trophy`) by replacing `text-brand` with `text-white` when `isActive === true`, preventing dark-green-on-light-green color blending.
