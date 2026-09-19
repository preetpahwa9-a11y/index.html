/* =========================================================
   SkillSwap — a creator services marketplace
   Everything is stored in the browser's localStorage, so it
   works with zero backend/server. Good enough for a demo —
   see README.md for why, and what you'd change for production.
   ========================================================= */

const STORAGE_GIGS = "skillswap_gigs";
const STORAGE_BOOKINGS = "skillswap_bookings";
const STORAGE_USER = "skillswap_username";

// ---------- tiny "database" helpers ----------
function loadGigs() {
  return JSON.parse(localStorage.getItem(STORAGE_GIGS) || "[]");
}
function saveGigs(gigs) {
  localStorage.setItem(STORAGE_GIGS, JSON.stringify(gigs));
}
function loadBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_BOOKINGS) || "[]");
}
function saveBookings(bookings) {
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(bookings));
}
function getCurrentUser() {
  return localStorage.getItem(STORAGE_USER) || "";
}
function setCurrentUser(name) {
  localStorage.setItem(STORAGE_USER, name);
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- visual helpers: deterministic color + initials per name ----------
const PALETTE = ["#0E6B57", "#B9822E", "#7A4FA3", "#2A5FA0", "#A2402F", "#3D6E4A"];

function colorFor(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function avatarHtml(name) {
  return `<span class="avatar" style="background:${colorFor(name)}">${initialsFor(name)}</span>`;
}

// ---------- seed data, so the marketplace isn't empty on first load ----------
function seedIfEmpty() {
  if (loadGigs().length) return;
  const seed = [
    {
      id: uid(),
      creator: "Maya R.",
      title: "YouTube video editing with captions and color",
      category: "Video editing",
      rate: "$40 / video",
      description: "Cuts, captions, color, and a thumbnail. 48-hour turnaround. Send your raw footage and a note on your channel's tone.",
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
    },
    {
      id: uid(),
      creator: "Theo K.",
      title: "Custom lo-fi beat for your project",
      category: "Music & audio",
      rate: "$25 / track",
      description: "One original instrumental, mixed and mastered, royalty-free for your channel or game.",
      createdAt: Date.now() - 1000 * 60 * 60 * 30,
    },
    {
      id: uid(),
      creator: "Priya N.",
      title: "Logo and brand colors for your small business",
      category: "Graphic design",
      rate: "$60 flat",
      description: "Two logo concepts, a small color palette, and source files. A solid starting point for a first-time brand.",
      createdAt: Date.now() - 1000 * 60 * 60 * 80,
    },
  ];
  saveGigs(seed);
}

// ---------- view switching ----------
const tabButtons = document.querySelectorAll(".tab-btn");
const views = document.querySelectorAll(".view");
const mainNav = document.getElementById("mainNav");
const navToggle = document.getElementById("navToggle");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchView(btn.dataset.view);
    closeMobileNav();
  });
});

// Any element with data-goto acts as an internal link to a view
// (empty-state actions, footer links).
document.querySelectorAll("[data-goto]").forEach((el) => {
  el.addEventListener("click", () => {
    switchView(el.dataset.goto);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

navToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
function closeMobileNav() {
  mainNav.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
}

function switchView(name) {
  tabButtons.forEach((b) => {
    const active = b.dataset.view === name;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  views.forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
  renderAll();
}

// ---------- "signed in as" (stands in for login) ----------
const userNameInput = document.getElementById("userNameInput");
const whoamiAvatar = document.getElementById("whoamiAvatar");
userNameInput.value = getCurrentUser();
updateWhoamiAvatar();

userNameInput.addEventListener("input", () => {
  setCurrentUser(userNameInput.value.trim());
  updateWhoamiAvatar();
  renderAll();
});

function updateWhoamiAvatar() {
  if (!whoamiAvatar) return;
  const name = getCurrentUser();
  if (name) {
    whoamiAvatar.textContent = initialsFor(name);
    whoamiAvatar.style.background = colorFor(name);
    whoamiAvatar.style.color = "#fff";
    whoamiAvatar.style.border = "none";
  } else {
    whoamiAvatar.textContent = "?";
    whoamiAvatar.style.background = "";
    whoamiAvatar.style.color = "";
    whoamiAvatar.style.border = "";
  }
}

// ---------- toast ----------
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* =========================================================
   FEATURE 1 — Post (sell) a service
   ========================================================= */
// The category field is a fixed list of common skills plus "Other," which
// reveals a free-text field so a creator can still list anything not covered.
const gigCategorySelect = document.getElementById("gigCategory");
const gigCategoryOtherWrap = document.getElementById("gigCategoryOtherWrap");
const gigCategoryOtherInput = document.getElementById("gigCategoryOther");

gigCategorySelect.addEventListener("change", () => {
  const isOther = gigCategorySelect.value === "Other";
  gigCategoryOtherWrap.hidden = !isOther;
  gigCategoryOtherInput.required = isOther;
  if (isOther) gigCategoryOtherInput.focus();
  else gigCategoryOtherInput.value = "";
});

document.getElementById("postGigForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = getCurrentUser();
  const msg = document.getElementById("postGigMsg");

  if (!name) {
    msg.textContent = "Enter your display name in the top bar first — that's how clients will know who they're booking.";
    msg.classList.add("error");
    return;
  }

  const category = gigCategorySelect.value === "Other"
    ? gigCategoryOtherInput.value.trim()
    : gigCategorySelect.value;

  if (!category) {
    msg.textContent = "Choose a category, or type your own under \u201cOther.\u201d";
    msg.classList.add("error");
    return;
  }

  const gig = {
    id: uid(),
    creator: name,
    title: document.getElementById("gigTitle").value.trim(),
    category,
    rate: document.getElementById("gigRate").value.trim(),
    description: document.getElementById("gigDescription").value.trim(),
    createdAt: Date.now(),
  };

  const gigs = loadGigs();
  gigs.push(gig);
  saveGigs(gigs);

  document.getElementById("postGigForm").reset();
  gigCategoryOtherWrap.hidden = true;
  gigCategoryOtherInput.required = false;
  msg.classList.remove("error");
  msg.textContent = "Service published — it's live on the marketplace now.";
  renderAll();
});

/* =========================================================
   FEATURE 2 — Browse & search
   DECISION POINT 3 (Discovery): services are sorted newest-first.
   Reasoning: "cheapest first" would punish creators for pricing
   fairly, and a fair rotation needs slot/impression tracking this
   app doesn't have. Newest-first is simple to explain to a client,
   hard to game, and guarantees every new creator a moment at the
   top of the list the second they publish.
   ========================================================= */
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
searchInput.addEventListener("input", renderMarketplace);
categoryFilter.addEventListener("change", renderMarketplace);

// Hero category shortcuts — these run through the same search logic
// used by the search box, so they only ever surface real matches.
document.getElementById("heroChips")?.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-chip]");
  if (!chip) return;
  searchInput.value = chip.dataset.chip;
  categoryFilter.value = "";
  renderMarketplace();
  window.scrollTo({ top: document.getElementById("view-marketplace").offsetTop, behavior: "smooth" });
});

document.getElementById("marketplaceEmptyReset")?.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  renderMarketplace();
});

function renderMarketplace() {
  const gigs = loadGigs().slice().sort((a, b) => b.createdAt - a.createdAt); // newest first — see DP3 above

  // populate category dropdown + datalist from whatever categories exist
  const categories = [...new Set(loadGigs().map((g) => g.category).filter(Boolean))].sort();
  const prevValue = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">All categories</option>` +
    categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  categoryFilter.value = categories.includes(prevValue) ? prevValue : "";

  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  const filtered = gigs.filter((g) => {
    const matchesQuery = !q || (g.title + " " + g.description + " " + g.category).toLowerCase().includes(q);
    const matchesCat = !cat || g.category === cat;
    return matchesQuery && matchesCat;
  });

  const grid = document.getElementById("marketplaceGrid");
  const empty = document.getElementById("marketplaceEmpty");

  grid.innerHTML = filtered.map((g) => `
    <div class="gig-card">
      <div class="gig-category">${escapeHtml(g.category)}</div>
      <h2>${escapeHtml(g.title)}</h2>
      <div class="creator-line gig-creator">${avatarHtml(g.creator)} ${escapeHtml(g.creator)}</div>
      <p class="gig-desc">${escapeHtml(g.description)}</p>
      <div class="gig-footer">
        <div>
          <span class="gig-rate-label">Starting at</span>
          <span class="gig-rate">${escapeHtml(g.rate)}</span>
        </div>
        <button class="btn-primary" data-book="${g.id}">Request service</button>
      </div>
    </div>
  `).join("");

  empty.hidden = filtered.length !== 0;

  grid.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", () => openBookingModal(btn.dataset.book));
  });

  updateHeroStats(gigs, categories);
}

// ---------- hero stats panel ----------
function updateHeroStats(gigs, categories) {
  const statGigs = document.getElementById("statGigs");
  const statCategories = document.getElementById("statCategories");
  const statBooked = document.getElementById("statBooked");
  if (!statGigs) return;
  statGigs.textContent = gigs.length;
  statCategories.textContent = categories.length;
  statBooked.textContent = loadBookings().length;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* =========================================================
   FEATURE 3 — Request a service
   DECISION POINT 2 (Double booking): a service CAN receive a
   new request while another is still Pending.
   Reasoning: we don't track time slots, so "pending" doesn't
   mean "busy" — it just means "waiting on the creator". Blocking
   new requests would hide real demand from the creator and
   punish clients for someone else being slow to respond. The
   creator decides, per request, what they can actually take on.
   ========================================================= */
const modalBackdrop = document.getElementById("bookingModalBackdrop");
const bookingForm = document.getElementById("bookingForm");
let gigBeingBooked = null;

function openBookingModal(gigId) {
  const name = getCurrentUser();
  if (!name) {
    showToast("Enter your display name in the top bar first, so the creator knows who's asking.");
    return;
  }
  const gig = loadGigs().find((g) => g.id === gigId);
  if (!gig) return;
  gigBeingBooked = gig;
  document.getElementById("modalGigTitle").textContent = gig.title;
  document.getElementById("modalGigCreator").textContent = `by ${gig.creator} · ${gig.rate}`;
  document.getElementById("bookingNote").value = "";
  modalBackdrop.classList.add("active");
  document.getElementById("bookingNote").focus();
}

function closeBookingModal() {
  modalBackdrop.classList.remove("active");
}

document.getElementById("modalCancel").addEventListener("click", closeBookingModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeBookingModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.classList.contains("active")) closeBookingModal();
});

bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = getCurrentUser();
  if (!gigBeingBooked || !name) return;

  const booking = {
    id: uid(),
    gigId: gigBeingBooked.id,
    gigTitle: gigBeingBooked.title,
    creator: gigBeingBooked.creator,
    client: name,
    note: document.getElementById("bookingNote").value.trim(),
    status: "Pending",
    createdAt: Date.now(),
  };

  const bookings = loadBookings();
  bookings.push(booking);
  saveBookings(bookings);

  closeBookingModal();
  showToast(`Request sent — ${gigBeingBooked.creator} will confirm soon.`);
  renderAll();
});

/* =========================================================
   FEATURE 4 — Creator dashboard (accept / decline)
   DECISION POINT 1 (Rejection): after a decline, the client
   still sees the request in "My orders" marked Declined — it
   is never hidden or deleted.
   Reasoning: silently erasing it would feel like being ghosted,
   and the client needs the record to know they're free to book
   someone else for the same need. Nothing else about their
   account is restricted after a decline.
   ========================================================= */
function renderDashboard() {
  const name = getCurrentUser();
  const myGigs = loadGigs().filter((g) => g.creator === name);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  const bookings = loadBookings()
    .filter((b) => myGigIds.has(b.gigId))
    .sort((a, b) => b.createdAt - a.createdAt);

  // ---- metrics (all computed from existing localStorage data) ----
  const statActiveServices = document.getElementById("statActiveServices");
  const statPendingRequests = document.getElementById("statPendingRequests");
  const statAcceptedOrders = document.getElementById("statAcceptedOrders");
  const statTotalRequests = document.getElementById("statTotalRequests");
  if (statActiveServices) {
    statActiveServices.textContent = myGigs.length;
    statPendingRequests.textContent = bookings.filter((b) => b.status === "Pending").length;
    statAcceptedOrders.textContent = bookings.filter((b) => b.status === "Accepted").length;
    statTotalRequests.textContent = bookings.length;
  }

  const list = document.getElementById("dashboardList");
  const empty = document.getElementById("dashboardEmpty");
  const emptyTitle = document.getElementById("dashboardEmptyTitle");
  const emptyText = document.getElementById("dashboardEmptyText");

  if (!name) {
    list.innerHTML = "";
    empty.hidden = false;
    emptyTitle.textContent = "Sign in to see your requests";
    emptyText.textContent = "Enter your display name in the top bar to see requests for services you've published.";
    return;
  }

  list.innerHTML = bookings.map((b) => `
    <div class="list-row">
      <div class="row-main">
        <div class="creator-line"><h2>${escapeHtml(b.gigTitle)}</h2></div>
        <div class="row-meta creator-line">${avatarHtml(b.client)} from ${escapeHtml(b.client)} · ${timeAgo(b.createdAt)}</div>
        ${b.note ? `<div class="row-note">${escapeHtml(b.note)}</div>` : ""}
      </div>
      ${b.status === "Pending"
        ? `<div class="row-actions">
             <button class="btn-small accept" data-accept="${b.id}">Accept</button>
             <button class="btn-small decline" data-decline="${b.id}">Decline</button>
           </div>`
        : `<span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>`
      }
    </div>
  `).join("");

  empty.hidden = bookings.length !== 0;
  emptyTitle.textContent = "No requests yet";
  emptyText.textContent = "Once you publish a service, incoming requests will show up here.";

  list.querySelectorAll("[data-accept]").forEach((btn) => {
    btn.addEventListener("click", () => setBookingStatus(btn.dataset.accept, "Accepted"));
  });
  list.querySelectorAll("[data-decline]").forEach((btn) => {
    btn.addEventListener("click", () => setBookingStatus(btn.dataset.decline, "Declined"));
  });
}

function setBookingStatus(bookingId, status) {
  const bookings = loadBookings();
  const b = bookings.find((x) => x.id === bookingId);
  if (!b) return;
  b.status = status; // other Pending requests on the same service are untouched — see DP2 above
  saveBookings(bookings);
  showToast(`Request ${status.toLowerCase()}.`);
  renderAll();
}

/* =========================================================
   FEATURE 5 — My orders (as a client)
   ========================================================= */
function renderBookings() {
  const name = getCurrentUser();
  const list = document.getElementById("bookingsList");
  const empty = document.getElementById("bookingsEmpty");
  const emptyTitle = document.getElementById("bookingsEmptyTitle");
  const emptyText = document.getElementById("bookingsEmptyText");

  if (!name) {
    list.innerHTML = "";
    empty.hidden = false;
    emptyTitle.textContent = "Sign in to see your orders";
    emptyText.textContent = "Enter your display name in the top bar to see your orders.";
    return;
  }

  const mine = loadBookings()
    .filter((b) => b.client === name)
    .sort((a, b) => b.createdAt - a.createdAt);

  list.innerHTML = mine.map((b) => `
    <div class="list-row">
      <div class="row-main">
        <h2>${escapeHtml(b.gigTitle)}</h2>
        <div class="row-meta creator-line">${avatarHtml(b.creator)} with ${escapeHtml(b.creator)} · ${timeAgo(b.createdAt)}</div>
        ${b.note ? `<div class="row-note">${escapeHtml(b.note)}</div>` : ""}
      </div>
      <span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>
    </div>
  `).join("");

  empty.hidden = mine.length !== 0;
  emptyTitle.textContent = "No orders yet";
  emptyText.textContent = "You haven't requested anything yet. Head to Explore to find a service.";
}

// ---------- tiny time-ago formatter ----------
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------- render everything the current view needs ----------
function renderAll() {
  renderMarketplace();
  renderBookings();
  renderDashboard();
}

seedIfEmpty();
renderAll();
