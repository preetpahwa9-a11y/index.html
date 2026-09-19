# SkillSwap — a creator services marketplace

A hackathon submission for the "Creator Economy" brief. Clients request
services from creators (video editing, design, music, etc). No backend —
everything lives in the browser's `localStorage`, so it runs by opening one
HTML file.

## The 5 required features
1. **Sell a service** — a creator publishes a title, category, starting price, and description.
2. **Browse & search** — the marketplace page, searchable and filterable by category.
3. **Request a service** — a client sends a request via a form and sees a confirmation.
4. **Creator dashboard** — a creator sees incoming requests and accepts/declines them.
5. **My orders** — a client sees their requests with status: Pending, Accepted, or Declined.

There's no separate login — enter your display name in the top bar. Services
you publish and requests you send are tied to whatever name you're using;
switch the name to act as a different person (useful for testing both sides
of a request).

## The 3 decision points — and the reasoning

**DP1 · Rejection — what can a client see and do after a creator declines?**
The request stays visible in "My orders," clearly marked **Declined**. It's
never hidden or deleted. Reasoning: silently erasing it would feel like being
ghosted, and the client needs the record to know they're free to request
someone else. Nothing else about the client's account is restricted after a
decline.

**DP2 · Double booking — can a service accept a new request while another is Pending?**
Yes. The app doesn't track time slots, so "Pending" means "waiting on the
creator to respond," not "the creator is busy." Blocking new requests would
hide real demand from the creator and punish a client just because someone
else's request arrived first. The creator decides, per request, what they can
actually take on — accepting one request does not auto-decline the others.

**DP3 · Discovery — how are services ranked on the marketplace page?**
Newest first. "Cheapest first" would punish creators for pricing fairly, and
a fair rotation needs slot/impression tracking this app doesn't have.
Newest-first is simple to explain to a client, hard to game, and guarantees
every new creator a moment at the top of the list the second they publish.

## How to run it (step by step, for VS Code)

1. Open the `skillswap` folder in VS Code: `File → Open Folder…`
2. Install the **Live Server** extension (Extensions icon in the left
   sidebar → search "Live Server" by Ritwick Dey → Install). This is what
   lets you *preview* the site instead of just editing text.
3. Right-click `index.html` in the file list → **"Open with Live Server."**
   Your browser opens automatically at something like
   `http://127.0.0.1:5500/index.html`, showing the live site.
4. Edit any file and save (`Ctrl+S` / `Cmd+S`) — Live Server refreshes the
   page automatically so you can see changes instantly.

If you don't want to install anything: just double-click `index.html` and it
will open directly in your browser. Everything still works — you only need
Live Server if you want auto-refresh while editing.

## Project structure
```
skillswap/
├── index.html   — page structure: Explore, Sell a service, My orders, Dashboard
├── style.css    — design system (tokens, layout, components) and responsive rules
├── script.js    — all app logic (data, rendering, the 3 decisions)
└── README.md    — this file
```

## Design notes
The interface was redesigned to read as a professional marketplace rather
than a demo: a deliberate token system (ink/paper/teal-accent) defined as
CSS variables in `style.css`, a Fraunces/Space Grotesk type pairing, a hero
with a real search bar and category shortcuts, and a dashboard with metrics
computed from the existing data (active services, pending requests, accepted
orders, total requests — no numbers are faked). Category shortcuts and the
"Clear filters" empty-state action run through the same search/filter logic
as the search box, so they only ever surface real results.

## What's deliberately simplified (say this if asked in Q&A)
- Data is stored in the browser (`localStorage`), not a real database —
  each browser/device has its own separate data. Fine for a demo; a real
  version would need a backend (e.g. Node + a database) so data is shared
  across users and devices.
- "Signed in as" is just a typed name — no passwords or accounts.
- No payments — a request is a request/confirmation flow only, not a checkout.
