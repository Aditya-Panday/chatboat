# Covers&All Chat Widget (Phase 1)

Standalone AI customer support widget for Covers&All. Embed it on any site with a single script tag.

Production embed:

```html
<script src="https://chat.coversandall.com/widget.js"></script>
```

Local development:

```html
<script
  src="http://localhost:3001/widget.js"
  data-website="coversandall"
></script>
```

## Run locally

```bash
cp .env.example .env
# optional: OPENCODE_MODEL=big-pickle
npm install
npm run dev
```

Widget app: [http://localhost:3001](http://localhost:3001)  
Loader script: [http://localhost:3001/widget.js](http://localhost:3001/widget.js)

Add the script tag above to **any** local project (your store, Next app, plain HTML) to test the iframe widget.

## Configure OpenCode Console inference

The chat API calls OpenCode Console's hosted OpenAI-compatible endpoint from the server only.

```bash
OPENCODE_MODEL=big-pickle
# OPENCODE_API_KEY=optional_for_paid_models
# OPENCODE_API_URL=https://dev.opencode.ai/inference/openai/v1/chat/completions
```

Free models such as `big-pickle` work without an API key, but OpenCode **requires** the request to include `User-Agent: opencode/...`. The server sets this automatically.

If you still see rate-limit errors after many test messages, wait for the daily reset (~midnight UTC) or add `OPENCODE_API_KEY` from [OpenCode Console](https://console.dev.opencode.ai) for paid models.

## How `widget.js` works

1. Creates a fixed bottom-right iframe pointing at `/widget`.
2. Stores `coversall_visitor_id` in the **host** site's `localStorage`.
3. Reads the **parent page** (URL, title, H1, meta description, JSON-LD product, price, breadcrumbs, cart count).
4. Sends that context to the iframe via `postMessage`.
5. Sizes the iframe from the **parent viewport**:
   - Closed: launcher (~96×96px)
   - Desktop open: 450×650px panel + padding
   - Mobile open: nearly full-screen using parent height
6. Refreshes context on navigation (`popstate`, SPA `pushState`/`replaceState`, hash changes).
7. Before each chat message, the widget requests the latest parent context again.

## Public JavaScript SDK

After loading `widget.js`, the parent page can control the widget through `window.widget`:

```html
<script
  src="http://localhost:3001/widget.js"
  data-website="coversandall"
></script>
```

```js
// Open the widget (same as clicking the launcher)
window.widget.initiateChat();

// Minimize — preserves the current conversation
window.widget.closeChat();

// Hide immediately — no confirmation UI, conversation preserved
window.widget.hideChat();

// Show again after hideChat()
window.widget.showChat();

// End conversation — clears messages and returns to Welcome Screen
window.widget.endChat();

// Check if the panel is currently visible
window.widget.isOpen();
```

### closeChat vs hideChat vs endChat

| Method | UI | Conversation |
|--------|----|--------------|
| `closeChat()` | Minimizes to launcher (same as **Close Chat** in the X menu) | Preserved |
| `hideChat()` | Hides the entire widget immediately (no confirmation) | Preserved |
| `endChat()` | Returns to Welcome Screen | Cleared |

### Events

```js
window.widget.on("widget_ready", ({ visitorId }) => {
  console.log("Widget ready", visitorId);
});

window.widget.on("widget_opened", (data) => {
  console.log("Widget opened", data);
});

window.widget.on("widget_closed", (data) => {
  console.log("Widget closed", data);
});

window.widget.on("chat_started", (data) => {
  console.log("Chat started", data);
});

window.widget.on("chat_ended", (data) => {
  console.log("Chat ended", data);
});

window.widget.on("agent_requested", (data) => {
  console.log("Agent requested", data);
});

// Remove a listener
window.widget.off("chat_started", myCallback);
```

Supported events: `widget_ready`, `widget_opened`, `widget_closed`, `chat_started`, `chat_ended`, `agent_requested`.

Commands called before the iframe is ready are queued and sent automatically once the widget loads.

### Legacy API

`window.CoversAllChat` remains available for backward compatibility:

```js
window.CoversAllChat.open();   // → widget.initiateChat()
window.CoversAllChat.close();  // → widget.closeChat()
window.CoversAllChat.setContext({ productId: "SKU-123" });
window.CoversAllChat.track({ event: "PRODUCT_VIEWED" });
```

## Host context API

```js
window.widget.setContext({
  productId: "CVA-SEC-001",
  productName: "Outdoor Sectional Couch Cover",
  pageType: "PDP",
});

window.widget.track({
  event: "PRODUCT_VIEWED",
  data: { productId: "CVA-SEC-001" },
});
```

Optional page markup the loader auto-detects:

```html
<body data-product-id="SKU-123" data-product-name="Patio Cover">
```

Product JSON-LD, `og:title`, `meta description`, H1, and common price selectors are also read automatically.

Context is sent to the AI **only when the visitor sends a chat message**, not on every page event.

## Agent handoff (Phase 1)

`Chat with Agent` updates local state only. Replace `lib/handoff.ts` with a real API call later without changing the UI.

## Folder structure

```text
coversandall-chat-widget/
├── app/widget/page.tsx
├── app/api/chat/route.ts
├── components/
├── lib/
└── public/widget.js
```
