# Player Module – Lesson Graph Loader

The **Player module** provides the core functionality to render interactive video lessons based on a graph structure (menus, quizzes, overlays).  
The entry point for loading lesson content is the **`useLessonGraphLoader`** hook.

---

## `useLessonGraphLoader`

**File:** `src/components/player/adapters/useLessonGraphLoader.ts`

This hook fetches and prepares the lesson graph (list of nodes/segments) from the API so that the Player can render menus, quizzes, and navigation logic.

### Usage

```tsx
import { useLessonGraphLoader } from "@/components/player/adapters/useLessonGraphLoader";

export default function ExamplePlayer({ organizationId, lessonId }) {
  const { graph, loading, error } = useLessonGraphLoader({
    organizationId,
    lessonId,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!graph) return <p>No graph available</p>;

  return <pre>{JSON.stringify(graph, null, 2)}</pre>;
}
```

---

### Parameters

- **`organizationId: string`** – the organization/workspace identifier.  
- **`lessonId: string`** – the specific lesson to load.

---

### Returns

The hook returns an object:

| Key      | Type             | Description |
|----------|------------------|-------------|
| `graph`  | `any | null`     | The lesson graph, typically an array of nodes (`contentList`). `null` until loaded. |
| `loading`| `boolean`        | Indicates if the graph is currently being fetched. |
| `error`  | `string`         | Error message if the fetch failed. Empty string if no error. |

---

### Behavior

1. On mount (or when `organizationId` / `lessonId` changes), the hook calls:  
   ```ts
   fetchLessonPreview(organizationId, lessonId)
   ```
2. Extracts `lessonContent.contentList` and sets it as the **graph**.  
3. Manages **loading** and **error** states.  
4. Cancels updates if the component unmounts mid-request.

---

### Error Handling

- If `lessonContent.contentList` is missing, the hook throws:  
  **`"Contenido no disponible."`** (Content not available).  
- If the request fails, it sets:  
  **`"Error cargando preview."`** (Error loading preview).  

Both cases populate the `error` state for display.

---

### Common Issues

- **Empty graph** → Ensure the API returns a valid `lessonContent.contentList`.  
- **Stale state after unmount** → handled via the `cancel` flag, no need for manual cleanup.  
- **Wrong organizationId/lessonId** → API may return 404 or empty lesson data.

---

🔗 Next steps: The `graph` object returned by this hook is consumed by **`useInteractiveVideoCore`** and rendered in **`InteractiveVideoPlayer`**.  


---

# Graph Helpers

**File:** `src/components/player/utils/graphHelpers.ts`

Utility functions for navigating and transforming the **lesson graph** used by the Player.  
These helpers normalize node access, type checks, and conversions to **video segments** and **UI artifacts** (menus/quizzes).

> The “graph” is typically the `lessonContent.contentList` returned by the API. Each node is expected to have an `id`, `type`, optional timing (`start`, `end`), media fields (`url`, `poster`, `title`), and references to child nodes (e.g., `children`, `next`, or `edges`). Field names may vary per backend version, so these helpers centralize the mapping logic.

---

## Data Model (assumptions)

While the exact schema may evolve, the helpers assume the following concepts:

- **Node**: `{ id: string; type: string; ... }`
- **Media node**: may include `{ url?: string; start?: number; end?: number; poster?: string; title?: string }`
- **Branching**: nodes may reference children via `children: string[]` or edges with metadata (order/labels).
- **Choice group**: a grouping that triggers a **menu** (set of options) shown at a given time / node boundary.

These assumptions are **kept loose** on purpose. The helpers are the single place that adapt to backend differences so the Player code remains stable.

---

## Exports

### `T(n: any): string | undefined`
Returns the **type** of a node in a normalized way.

- **Why**: Backends sometimes change `kind`/`type` casing or nesting.
- **Returns** the lowercase (or canonical) type string if available.

**Example**
```ts
if (T(node) === "video") {
  // render as timed media segment
}
```

---

### `node(graph: any, id: string): any | null`
Finds a node by `id` in the graph.

- Uses the most efficient available lookup (index map if present; otherwise linear search).
- Returns `null` if not found.

**Example**
```ts
const n = node(graph, "node-42");
if (!n) throw new Error("Node not found");
```

---

### `isType(n: any, ...types: string[]): boolean`
Type guard for nodes.

- Case-insensitive comparison.
- Supports multiple types: `isType(n, "video", "image", "clip")`.

**Example**
```ts
if (isType(n, "menu", "choice-group")) openMenu();
```

---

### `children(graph: any, parentId: string): any[]`
Returns the **children** of a node, normalized as an array of nodes.

- Sort order is preserved if the backend provides an ordering field.
- Safely returns `[]` if there are no children.

**Example**
```ts
const options = children(graph, groupId);
for (const c of options) { /* render option button */ }
```

---

### `findChoiceGroupAfter(graph: any, fromIdOrTime: string | { nodeId: string; at?: number }): any | null`
Finds the **next choice/branch group** after a given node (or time within a node).

- Useful to determine when to **pause playback** and show a menu.
- If there is no group ahead, returns `null`.

**Example**
```ts
const nextGroup = findChoiceGroupAfter(graph, { nodeId: currentNodeId, at: currentTime });
if (nextGroup) pauseAndShowMenu(nextGroup);
```

---

### `getMenuForGroup(graph: any, groupId: string): { id: string; items: any[]; title?: string } | null`
Resolves a **menu model** from a choice group id.

- Normalizes the underlying structure (group → menu → menu items).
- Returns `null` if the group/menu is not found.

**Example**
```ts
const menu = getMenuForGroup(graph, groupId);
setMenuState(menu);
```

---

### `toSegment(n: any): { url: string; start: number; end?: number; poster?: string; title?: string }`
Converts a **media node** into a **renderable segment** for the video player.

- Ensures `url` and `start` exist (throws if missing).
- Copies optional fields (`end`, `poster`, `title`) if available.

**Example**
```ts
const segment = toSegment(videoNode);
videoRef.current.src = segment.url;
// seek to segment.start, stop at segment.end if present
```

---

## Error Handling & Null Safety

- All helpers are **null-safe** and try to avoid throwing unless a precondition is broken (e.g., `toSegment` without `url`).
- Always check for `null` when calling `node`, `findChoiceGroupAfter`, or `getMenuForGroup`.

---

## Performance Notes

- If the graph is large, consider prebuilding an **id → node** index once and sharing it with helpers (some implementations of `node()` do this lazily).
- Avoid calling `children()` repeatedly in tight render loops; cache results when possible.

---

## Example Flow (Player)

```ts
// 1) Resolve current node
const n = node(graph, currentNodeId);

// 2) If it’s a media node, map to segment
if (isType(n, "video", "clip")) {
  const seg = toSegment(n);
  playSegment(seg);
}

// 3) Check for branching ahead
const group = findChoiceGroupAfter(graph, { nodeId: n.id, at: currentTime });
if (group) {
  const menu = getMenuForGroup(graph, group.id);
  showMenu(menu);
}

// 4) Navigate to a chosen child
const next = children(graph, choiceTargetId)[0];
goTo(next.id);
```

---

## Common Pitfalls

- **Backend field drift**: If the API changes field names (e.g., `contentList` → `nodes`, `kind` → `type`), update the helpers only—**not** the Player.
- **Timing gaps**: Ensure that `start/end` values on media nodes are consistent; `toSegment` won’t invent timing.
- **Orphan edges**: `children()` filters out missing targets; log or validate upstream if you detect gaps.

---

If you need this file to include the **exact typing** of your current backend, share a sample `contentList` and I’ll tailor the helpers + TypeScript types to your schema.

# Navigation Helpers (`nav.ts`)

**File:** `src/components/player/utils/nav.ts`

This module centralizes **navigation logic** for the Interactive Player. It decides **what to render next** (video segment, quiz, or menu) and whether there is **interactive content ahead** of a given video node. It builds on the graph utilities provided by `graphHelpers.ts`.

---

## Dependencies

```ts
import {
  T,
  node,
  isType,
  children,
  findChoiceGroupAfter,
} from "@/components/player/utils/graphHelpers";
```

- `T` – enum-like map of normalized node types (`T.VIDEO`, `T.QUIZ`, `T.CHOICE_GROUP`, `T.JUMP`).
- `node(graph, id)` – returns a node by id.
- `isType(node, ...types)` – type guard.
- `children(node)` – returns node children (normalized array of ids or nodes depending on implementation).
- `findChoiceGroupAfter(graph, from)` – locates the next choice/branch group after a node/time.

> The functions here treat the **lesson graph** as a directed structure where special nodes can **open menus**, **start quizzes**, **jump** to other nodes, or **play video segments**.

---

## `hasInteractiveAfter(list, videoNodeId)`

**Signature**
```ts
export function hasInteractiveAfter(list: any, videoNodeId: string): boolean
```

**Purpose**  
Checks if there is **interactive content immediately after** the given video node, or shortly ahead in the flow.

**How it works**
1. Tries `findChoiceGroupAfter(list, videoNodeId)` — if a choice group is registered after this video, returns `true`.
2. Otherwise, looks at the **first child** of the video node (if any) and checks if it is a **QUIZ**, **CHOICE_GROUP**, or **JUMP**.
   - QUIZ / CHOICE_GROUP → interactive → `true`
   - JUMP → considered interactive because it alters the path → `true`
3. Returns `false` if none of the above apply.

**Typical use-cases**
- Decide if the player should **preload** a menu/quiz overlay.
- Toggle UI states like **“Next is interactive”** badges or **auto-pause** indicators.

---

## `bfsResolveFactory({...})`

**Signature**
```ts
export function bfsResolveFactory({
  list,
  goToVideoNode,
  setMenuId,
  setQuizId,
  onEvent,
}: {
  list: any;
  goToVideoNode: (id: string, videoNode: any) => void;
  setMenuId: (id: string | null) => void;
  setQuizId: (id: string | null) => void;
  onEvent?: (e: any) => void;
}): (startId: string) => void
```

**Purpose**  
Creates a **resolver function** that, given a `startId`, determines **the next actionable target** in the graph using a **Breadth-First Search (BFS)** and triggers the corresponding side-effect:
- Video → `goToVideoNode(id, node)`
- Quiz → `setQuizId(id)` (`setMenuId(null)`)
- Menu (Choice Group) → `setMenuId(id)` (`setQuizId(null)`)
- Jump → **follow `jumpToNodeId`** and continue resolving

It also emits **UI events** via `onEvent`:
- `{ type: "OPEN_MENU", groupId }`
- `{ type: "OPEN_QUIZ", quizId }`

**Resolution order**  
1. **Direct hit**: If `startId` itself is a `CHOICE_GROUP`, `VIDEO`, `QUIZ`, or `JUMP`, resolve immediately (following JUMPs recursively).
2. **BFS expansion**: If not actionable, enqueue neighbors (children + jump targets) and scan level-by-level until an actionable node is found.
3. **Short-circuit**: The first actionable node discovered **wins** and stops the search.

**Why BFS?**  
BFS prioritizes **closest** actionable nodes from the current context, producing predictable UX: nearby menus/quizzes or the next video node are preferred over far branches.

**Pseudocode (simplified)**
```ts
const bfsResolve = bfsResolveFactory(...);
bfsResolve(currentNodeId);
// -> may open a menu/quiz or navigate to the next video segment
```

**Event contract**
- When opening a menu: `onEvent?.({ type: "OPEN_MENU", groupId })`
- When opening a quiz:  `onEvent?.({ type: "OPEN_QUIZ", quizId })`

> Consumers can listen to these events to log analytics, pause media, or update UI overlays.

---

## Example Integration

```ts
const resolve = bfsResolveFactory({
  list: graph,
  goToVideoNode: (id, n) => {
    // map node to segment and play
    // e.g., player.load(toSegment(n)); player.play();
  },
  setMenuId: (groupId) => setOverlay({ type: "menu", groupId }),
  setQuizId: (quizId) => setOverlay({ type: "quiz", quizId }),
  onEvent: (e) => analytics.track("player_event", e),
});

// When a node finishes or user selects an option:
resolve(nextNodeId);
```

---

## Edge Cases & Notes

- **Jumps chaining**: A `JUMP` can redirect to another `JUMP`. The resolver follows them safely.
- **Missing nodes**: The BFS skips unknown node ids. Ensure graph integrity in backend validations.
- **Children shape**: `children(n)` should return a consistent iterable (ids or nodes). If it returns nodes, map to ids before enqueueing.
- **Priority**: VIDEO > QUIZ > CHOICE_GROUP are treated equally as actionable; the **first found** by BFS is chosen.
- **Interactivity lookahead**: Use `hasInteractiveAfter` to anticipate pauses/overlays at the end of a video segment.

---

If you share a **sample graph schema**, this doc can be extended with precise TypeScript types and a state diagram reflecting your exact node kinds and transitions.

# Video Utilities (`time & buffer helpers`)

**File excerpt:** Typically placed in `src/components/player/utils/`

This module provides **low-level helpers** for working with video playback in the Player:  
- `fmt` → converts a raw time in seconds into a `m:ss` string.  
- `computeBufferedRelative` → calculates how much of the video is buffered relative to a segment start.

---

## `fmt(t: number): string`

**Purpose**  
Formats a number of seconds into a human-friendly `minutes:seconds` string.

**Behavior**
- If input is not finite → returns `"0:00"`.
- Rounds **down** to nearest whole second.
- Splits into minutes and seconds.
- Pads seconds with a leading zero if `< 10`.

**Examples**
```ts
fmt(0);        // "0:00"
fmt(5);        // "0:05"
fmt(75);       // "1:15"
fmt(600);      // "10:00"
fmt(NaN);      // "0:00"
```

---

## `computeBufferedRelative(v, start, setBufferedEnd)`

**Signature**
```ts
export function computeBufferedRelative(
  v: HTMLVideoElement,
  start: number,
  setBufferedEnd: (n: number) => void
)
```

**Purpose**  
Determines how much video data is **buffered (preloaded)** beyond the `currentTime`, expressed **relative to a segment start offset**.

**Parameters**
- `v: HTMLVideoElement` → the active video element.
- `start: number` → the start time (in seconds) of the current video segment.
- `setBufferedEnd: (n: number) => void` → callback to update buffered duration relative to `start`.

**How it works**
1. Reads `v.buffered` (a `TimeRanges` object with loaded time spans).
2. Iterates over each buffered range:
   - For ranges ending **after** `v.currentTime`, keep track of the **furthest end** time.
3. Computes `end - start` (how much is buffered beyond the current segment start).
4. Calls `setBufferedEnd()` with the result.
5. On error (e.g. video not ready), sets buffered length to `0`.

**Example**
```ts
// Suppose segment starts at 30s, currentTime=35s
// Buffered ranges: [30..40], [45..60]
computeBufferedRelative(videoRef.current, 30, (n) => {
  console.log("Buffered relative to segment:", n);
});
// -> might log: 10 (seconds buffered from 30s → 40s)
```

---

## Common Use Cases

- **Progress bars**: show how much of the current segment is loaded (vs. played).
- **Adaptive UI**: disable skipping ahead if the buffer is too short.
- **Debugging**: log how much is preloaded relative to your clip boundaries.

---

## Notes

- `TimeRanges` is browser-provided; its ranges may be fragmented (multiple intervals).
- Always handle the case where **no buffer** is available → function defaults to `0`.
- This helper is **safe** to call repeatedly (e.g., on `timeupdate` or `progress` events).

---

These utilities are **purely presentational and state-sync helpers**:  
- `fmt` → formatting for display (timestamps, UI labels).  
- `computeBufferedRelative` → syncing buffer state with React via a setter.  

# Player Types (`types.ts`)

**File excerpt:** typically under `src/components/player/utils/types.ts`

This file defines the **core TypeScript types** used throughout the Interactive Video Player.  
These types describe segments, cues, the lesson graph, and the events emitted by the player.

---

## `Segment`

```ts
export type Segment = {
  url: string;
  start: number;
  end?: number;
  poster?: string;
  title?: string;
};
```

Represents a **media segment** that the player can load and play.

- **`url`** → required. The media source (video URL).
- **`start`** → required. Start time in seconds (relative to the video asset).
- **`end?`** → optional. End time in seconds. If omitted, the segment continues until media end.
- **`poster?`** → optional. Poster image URL to display before playback.
- **`title?`** → optional. Human-friendly title (for overlays or debugging).

**Example**
```ts
const seg: Segment = {
  url: "https://cdn.example.com/lesson1.mp4",
  start: 120,
  end: 150,
  poster: "https://cdn.example.com/thumb.jpg",
  title: "Intro Part 2",
};
```

---

## `Cue`

```ts
export type Cue = {
  at: number;
  type: "quiz" | "menu" | "jump";
  targetId: string;
};
```

Represents a **timed cue** inside a video segment that triggers interactivity.

- **`at`** → second mark (relative to current segment).
- **`type`** → the type of interactive action:
  - `"quiz"` → open a quiz overlay.
  - `"menu"` → open a branching menu.
  - `"jump"` → jump to another node in the graph.
- **`targetId`** → the graph node id associated with this cue.

**Example**
```ts
const cue: Cue = { at: 45, type: "quiz", targetId: "quiz-123" };
```

---

## `Graph`

```ts
export type Graph = {
  rootId: string;
  items: Record<string, any>;
};
```

Represents the **lesson graph**.

- **`rootId`** → entry point node id (usually the first video segment).
- **`items`** → dictionary of nodes keyed by id.  
  Each node may represent a video, quiz, menu, or jump.

**Example**
```ts
const graph: Graph = {
  rootId: "start-node",
  items: {
    "start-node": { id: "start-node", type: "video", url: "..." },
    "quiz-123": { id: "quiz-123", type: "quiz", ... },
  },
};
```

---

## `PlayerEvent`

```ts
export type PlayerEvent =
  | { type: "START_SEGMENT"; nodeId: string; segment: Segment }
  | { type: "OPEN_MENU"; groupId: string }
  | { type: "OPEN_QUIZ"; quizId: string }
  | { type: "JUMP"; fromId: string; toId: string }
  | { type: "COMPLETE_SEGMENT"; nodeId: string }
  | { type: "ERROR"; message: string };
```

Events emitted by the Player to signal state changes and user interactions.

- **`START_SEGMENT`** → playback begins for a new segment.
- **`OPEN_MENU`** → a menu (choice group) has been opened.
- **`OPEN_QUIZ`** → a quiz has been opened.
- **`JUMP`** → navigation occurred from one node to another (`fromId → toId`).
- **`COMPLETE_SEGMENT`** → playback of a segment finished successfully.
- **`ERROR`** → an error occurred; `message` provides details.

**Example**
```ts
function onPlayerEvent(e: PlayerEvent) {
  switch (e.type) {
    case "START_SEGMENT":
      console.log("Started segment", e.segment);
      break;
    case "OPEN_MENU":
      console.log("Menu opened:", e.groupId);
      break;
    case "ERROR":
      console.error("Player error:", e.message);
      break;
  }
}
```

---

## Why these types matter

- Provide **type safety** for the Player core (`useInteractiveVideoCore`, `nav`, etc.).
- Enforce a consistent shape of events across the system.
- Make graph traversal and UI rendering predictable with strong typing.

---

# InteractiveVideoPlayer Component

**File:** `src/components/player/InteractiveVideoPlayer.tsx`

The **InteractiveVideoPlayer** is the main UI component that renders an **interactive video lesson**.  
It integrates the **video surface**, **progress bar**, and interactive **overlays** (menus and quizzes).  
The logic behind playback and overlays comes from `useInteractiveVideoCore`.

---

## Props

```ts
type Props = {
  graph: Graph | null;
  onClose: () => void;
  onEvent?: Parameters<typeof useInteractiveVideoCore>[0]["onEvent"];
  renderMenu?: (menu: any, onSelect: (id: string) => void) => React.ReactNode;
  renderQuiz?: (args: {
    list: any;
    quizId: string;
    goToVideoNode: (id: string, n: any) => void;
    setMenuId: (id: string | null) => void;
    setQuizId: (id: string | null) => void;
  }) => React.ReactNode;
};
```

### `graph: Graph | null`
- The lesson graph to render.  
- If `null`, the player cannot load content.

### `onClose: () => void`
- Callback to close the player overlay.  
- Typically used to exit fullscreen or return to feed view.

### `onEvent?: (e: PlayerEvent) => void`
- Optional event callback (from `useInteractiveVideoCore`).  
- Receives player lifecycle events like `START_SEGMENT`, `OPEN_MENU`, `OPEN_QUIZ`, etc.

### `renderMenu?`
- Custom renderer for interactive menus.  
- Signature: `(menu, onSelect) => ReactNode`  
- If omitted, falls back to `<DefaultMenu />`.

### `renderQuiz?`
- Custom renderer for quizzes.  
- Signature: `(args) => ReactNode`  
- Args include `list`, `quizId`, and core actions.  
- If omitted, falls back to `<DefaultQuiz />`.

---

## Internals

The component consumes state & actions from `useInteractiveVideoCore`:

```ts
const { state, actions } = useInteractiveVideoCore({ graph, onEvent });
const { loading, error, video, progress, overlays } = state;
```

- **`loading`** – while fetching lesson graph or preparing first segment.  
- **`error`** – error message if initialization failed.  
- **`video`** – active segment metadata `{ baseUrl, poster, ref }`.  
- **`progress`** – playback progress `{ segCurrent, segDuration, bufferedEnd }`.  
- **`overlays`** – interactive UI state `{ menu, quizId, list }`.  
- **`actions`** – navigation helpers (`goToVideoNode`, `setMenuId`, `setQuizId`, `onSelectOption`).

---

## Render Flow

1. **Loading/Error states**  
   - Shows a placeholder `<OverlayRoot>` with message until video is ready.  
   - Error messages shown in **salmon red**.

2. **Main video surface**  
   - `<VideoSurface>` renders the actual `<video>` element.  
   - `<ProgressBar>` shows current time, duration, and buffered range.

3. **Overlays**  
   - **Menu overlay** → `overlays.menu` present → render via `renderMenu` or fallback `DefaultMenu`.  
   - **Quiz overlay** → `overlays.quizId` present → render via `renderQuiz` or fallback `DefaultQuiz`.  

**Example UI stack**
```
OverlayRoot
 ├─ VideoSurface
 ├─ ProgressBar
 ├─ (optional) Menu overlay
 └─ (optional) Quiz overlay
```

---

## Example Usage

```tsx
<InteractiveVideoPlayer
  graph={graph}
  onClose={() => setOpen(false)}
  onEvent={(e) => console.log("Player event", e)}
  renderMenu={(menu, onSelect) => (
    <CustomMenu menu={menu} onSelect={onSelect} />
  )}
  renderQuiz={({ list, quizId, goToVideoNode }) => (
    <CustomQuiz list={list} quizId={quizId} onSelect={goToVideoNode} />
  )}
/>
```

---

## Why this component matters

- Provides a **turnkey interactive player** that works out-of-the-box with default UI.  
- Supports **custom overlays** for branding or UX flexibility.  
- Centralizes **video playback**, **progress tracking**, and **interactive branching** in one place.

---

# OverlayRoot Component

**File:** `src/components/player/OverlayRoot.tsx`

The **OverlayRoot** is a simple full-screen overlay container used by the **Interactive Video Player**.  
It provides a **dark background**, a **top-right close button**, and a **content area** for player UI or error/loading messages.

---

## Props

```ts
type Props = {
  children: React.ReactNode;
  onClose: () => void;
};
```

- **`children`** → the content to render inside the overlay (video player, menus, quizzes, or messages).  
- **`onClose`** → callback triggered when the user clicks the close button. Typically used to exit the player.

---

## Styles

The component uses inline styles for simplicity:

- **`root`**  
  - Fixed full-screen container (`position: fixed; inset: 0`).  
  - Dark translucent background (`rgba(0,0,0,.98)`).  
  - Flex column layout with high `z-index`.

- **`topbar`**  
  - Horizontal bar aligned to the right.  
  - Contains the close button.

- **`iconBtn`**  
  - Close button style: transparent background, no border, white icon color.

- **`body`**  
  - Flexible content area (`flex: 1`).  
  - Uses CSS Grid to vertically center contents.  
  - Provides padding and relative positioning.

---

## Behavior

- The overlay renders with `role="dialog"` and `aria-modal="true"` for accessibility.  
- Clicking the **close button** calls `onClose`.  
- The close button is represented by **Heroicons `XMarkIcon`** (28x28).

---

## Example Usage

```tsx
<OverlayRoot onClose={() => setOpen(false)}>
  <div style={{ color: "#aaa" }}>Loading...</div>
</OverlayRoot>

<OverlayRoot onClose={() => setOpen(false)}>
  <InteractiveVideoPlayer graph={graph} onClose={() => setOpen(false)} />
</OverlayRoot>
```

---

## Why this component matters

- Provides a **consistent overlay shell** for the player.  
- Ensures **accessibility** with dialog semantics.  
- Encapsulates **close logic** in a reusable pattern.  
- Serves as the root container for video surface, progress bar, and overlays.

---
# `useInteractiveVideoCore` Hook

**File:** `src/components/player/useInteractiveVideoCore.ts`

`useInteractiveVideoCore` is the **state & control layer** for the Interactive Video Player.  
It converts a **lesson graph** into playable **segments**, manages **overlays** (menus/quizzes), tracks **progress/buffer**, and emits **player events**.

---

## Signature

```ts
type Args = {
  graph: Graph | null;
  onEvent?: (e: PlayerEvent) => void;
};

export function useInteractiveVideoCore({ graph, onEvent }: Args) {
  // ...
}
```

- **`graph`**: a normalized lesson `Graph` (or `null` while loading).
- **`onEvent`**: optional callback for lifecycle events (see **PlayerEvent**).

---

## Returns

```ts
{
  state: {
    loading: boolean;
    error: string;
    video: { baseUrl: string | null; poster?: string; ref: React.RefObject<HTMLVideoElement> };
    progress: { segCurrent: number; segDuration: number; bufferedEnd: number };
    overlays: { menu: any | null; quizId: string | null; list: any };
  };
  actions: {
    onSelectOption(targetId: string): void;
    goToVideoNode(id: string, n: any): void;
    setMenuId(id: string | null): void;
    setQuizId(id: string | null): void;
  };
}
```

### State
- **`loading` / `error`** — status flags while initializing or on failure.
- **`video`**
  - `baseUrl`: current media URL (switching this reloads the `<video>`.
  - `poster`: current poster image (optional).
  - `ref`: `HTMLVideoElement` ref (used internally to control playback).
- **`progress`**
  - `segCurrent`: current time **within the active segment** (seconds).
  - `segDuration`: effective segment duration (`end - start`), clamped to file duration.
  - `bufferedEnd`: buffered amount **relative to segment start**.
- **`overlays`**
  - `menu`: resolved menu model for an active choice group (or `null`).
  - `quizId`: the currently open quiz id (or `null`).
  - `list`: the active graph (convenience pass-through).

### Actions
- **`onSelectOption(targetId)`** — resolve a user choice using a BFS to the next actionable node (video/quiz/menu/jump).
- **`goToVideoNode(id, node)`** — navigate to a specific video node (resets cues, updates poster, (re)loads segment).
- **`setMenuId(id)` / `setQuizId(id)`** — imperatively toggle overlays (rarely needed outside custom UIs).

---

## Initialization Flow

When `graph` is set:
1. **Search first video** using BFS from `graph.rootId`.
2. If none found → set `error: "No se encontró video."` and stop.
3. Build initial `Segment` with `toSegment(node)`.
4. **Trim end or not?** If `hasInteractiveAfter(graph, videoId)` is `true` and the raw segment includes `end`, keep it; otherwise **clear `end`** so playback continues until file end.
5. Set **current node**, **segment**, **baseUrl**, **poster**, **overlays cleared**, **cueIndex=0**.
6. Emit `onEvent({ type: "START_SEGMENT", nodeId, segment })`.

---

## Media Setup & Buffering

On segment change:
- Wait for `loadedmetadata`, then:
  - Seek to `segment.start`.
  - Compute **effective duration** (`end ?? mediaDuration) - start`.
  - Update `segDuration`, `segCurrent=0`.
  - Compute `bufferedEnd` with `computeBufferedRelative(video, start, setBufferedEnd)`.
  - Attempt `video.play()` (ignore rejections).
- On `progress`, recompute `bufferedEnd`.

---

## Cue Pipeline

Cues are derived per node with:
```ts
const raw = (resolveFromText?.(list, currentNodeId) ?? []) as Cue[];
```
They are filtered (finite & non-negative) and **sorted by `at`**.

On every `timeupdate`:
- Calculate **segment-relative** time: `rel = currentTime - start` (clamped to segment duration).
- If the **next cue** is reached:
  - **Pause video**.
  - Handle by type:
    - `"menu"` → `setMenuId(targetId)`, `setQuizId(null)`, fire `OPEN_MENU`.
    - `"quiz"` → `setQuizId(targetId)`, `setMenuId(null)`, fire `OPEN_QUIZ`.
    - `"jump"` → resolve destination:
      - Video → `goToVideoNode`
      - Choice group → `setMenuId`
      - Quiz → `setQuizId`
      - Emit `JUMP { fromId, toId }`
  - Advance `cueIndex`.

> A small tolerance (`~50ms`) is used when comparing `rel` vs. `cue.at` to avoid precision issues.

---

## End-of-Segment Logic

If `segment.end` is defined and `currentTime` reaches it (within ~50ms):
1. **Pause video** and emit `COMPLETE_SEGMENT`.
2. Try **`findChoiceGroupAfter`** — if found, open menu & emit `OPEN_MENU`.
3. Else, look at **children** of the current node:
   - If first child is a **quiz**, open quiz & emit `OPEN_QUIZ`.
   - Otherwise, find the **next video** child and `goToVideoNode`.

This produces a **natural flow**: end → branch menu → quiz → next video.

---

## Navigation

- **`goToVideoNode(id, videoNode)`**
  - Build `Segment` with `toSegment`.
  - If **same `baseUrl`** (same file), update `segment` and **seek** via `requestAnimationFrame` to avoid flicker; otherwise set `baseUrl` to trigger a `<video>` reload.
  - Clear overlays, reset cue index, emit `START_SEGMENT`.

- **`onSelectOption(targetId)`**
  - Builds a resolver with `bfsResolveFactory({ list, goToVideoNode, setMenuId, setQuizId, onEvent })`.
  - Runs BFS from `targetId` to the **nearest actionable node** and activates it.

---

## Events Emitted

- `START_SEGMENT` — a segment begins.
- `OPEN_MENU` — a menu (choice group) opens.
- `OPEN_QUIZ` — a quiz opens.
- `JUMP` — jump navigation from → to.
- `COMPLETE_SEGMENT` — segment reached its end.
- `ERROR` — not currently thrown here, but reserved for future errors.

Use these to **track analytics**, **pause external UI**, or **persist progress**.

---

## Example Integration

```tsx
const { state, actions } = useInteractiveVideoCore({
  graph,
  onEvent: (e) => console.log("[player]", e),
});

<video ref={state.video.ref} src={state.video.baseUrl ?? undefined} poster={state.video.poster} />
{state.overlays.menu && (
  <MenuOverlay menu={state.overlays.menu} onSelect={actions.onSelectOption} />
)}
{state.overlays.quizId && (
  <QuizOverlay id={state.overlays.quizId} onComplete={(nextId) => actions.goToVideoNode(nextId, /* node */)} />
)}
```

---

## Notes & Edge Cases

- **Graph Integrity**: Unknown/missing nodes are skipped; ensure backend validation.
- **Same-file Seeking**: The `requestAnimationFrame` seek path avoids a reload when `baseUrl` is unchanged.
- **Floating-Point Tolerance**: A small margin (`0.05s`) avoids missing cues/end boundaries.
- **Autoplay Policies**: `video.play()` might be blocked; UX should allow user gesture to start if needed.
- **Interactive End Trimming**: `hasInteractiveAfter` keeps `end` only when interactivity follows; otherwise, the segment plays to file end.

---

This hook is the **engine** of the interactive player: it binds the lesson graph to media playback and orchestrates menus, quizzes, and jumps with predictable, event-driven behavior.

# VideoSurface Component

**File:** `src/components/player/VideoSurface.tsx`

The **VideoSurface** is a thin wrapper around the native `<video>` element.  
It standardizes styling and props so the Interactive Video Player has a consistent video display.

---

## Props

```ts
type Props = {
  src: string;
  poster?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};
```

- **`src`** → required. The video file URL.  
- **`poster?`** → optional poster image URL (displayed before playback starts).  
- **`videoRef`** → a `RefObject` for controlling playback (seek, play, pause, etc.) from React hooks like `useInteractiveVideoCore`.

---

## Rendered `<video>` element

```tsx
<video
  ref={videoRef}
  src={src}
  poster={poster}
  controls={false}
  autoPlay
  playsInline
  style={{
    width: "100%",
    height: "auto",
    background: "#000",
    borderRadius: 12,
    display: "block",
  }}
/>
```

### Attributes
- **`controls={false}`** → hides default browser controls (player UI is custom).  
- **`autoPlay`** → attempts to start playback automatically.  
- **`playsInline`** → ensures mobile Safari/iOS plays inline instead of fullscreen.  
- **`poster`** → displayed until the first frame is rendered.  
- **`ref`** → allows external hooks to manage playback state.

### Styles
- `width: 100%` → responsive to container width.  
- `height: auto` → preserves aspect ratio.  
- `background: #000` → black background behind video.  
- `borderRadius: 12px` → rounded corners for a modern look.  
- `display: block` → ensures no inline spacing issues.

---

## Example Usage

```tsx
const videoRef = useRef<HTMLVideoElement | null>(null);

<VideoSurface
  src="https://cdn.example.com/lesson.mp4"
  poster="https://cdn.example.com/thumb.jpg"
  videoRef={videoRef}
/>
```

This ref can then be used with player hooks:

```tsx
videoRef.current?.play();
videoRef.current?.pause();
videoRef.current!.currentTime = 120; // jump to 2 minutes
```

---

## Why this component matters

- Provides a **consistent video surface** for all lessons.  
- Decouples **UI** (progress bars, overlays) from the raw `<video>` tag.  
- Ensures proper attributes (`playsInline`, no controls) for **mobile-first playback**.  
- Keeps **styling consistent** across all uses of video in the player.

---
