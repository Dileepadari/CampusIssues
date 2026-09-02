# not_for_you.md

A personal working log. Not documentation, and nothing here is needed to use or contribute to CampusIssues. Everything a newcomer actually needs is in [README.md](./README.md) and [DEVDOC.md](./DEVDOC.md).

---

## Local notes

### `src/lib/db.ts`

- IndexedDB rather than localStorage because attachments are stored inline as data URLs and would blow past the roughly 5 MB localStorage budget on the third photo.
- The whole dataset is one JSON document read once at boot and held in memory. That is what lets `api.ts` do synchronous reads inside otherwise async functions without threading a transaction through every call.
- Writes are debounced by 50ms because a single mutation usually touches three collections (the complaint, the activity entry, the notification) and there is no reason to serialise the document three times.
- A blocked or unavailable IndexedDB logs a warning and falls back to an in-memory database. The app then works for the session and forgets everything on reload, which is better than a blank screen. Safari in private mode is the case this exists for.

### `src/lib/crypto.ts`

- 120,000 PBKDF2 iterations. Enough to be slow on a laptop, not so slow that signing in feels broken. There is no server budget to reason about, so the number is chosen by feel rather than by a cost target.
- `constantTimeEqual` is hygiene rather than defence: there is no remote attacker to time. It is there so the code reads correctly if the storage layer is ever swapped for a real backend, which is the same reason the hashing lives here rather than inline.
- The tracking alphabet drops `O`, `0`, `I` and `1`. These codes get read aloud and written on paper.

### `src/lib/api.ts`

- `tick()` inserts an 80ms delay in front of every call. Without it every query resolves before React paints, the loading states never render, and a skeleton that is never exercised is a skeleton that is broken the day a real backend arrives.
- Every mutation re-derives the caller from the session rather than trusting an argument, even though nothing could realistically lie to it in a browser-only app. That is deliberate: the file is written as if it were a server so the port is mechanical.
- `REOPEN_WINDOW_DAYS` is 14. Long enough that someone who was away for a fortnight can still say "this is not fixed", short enough that a complaint does not stay reopenable forever.

### Seed data

- Complaint ages are spread deliberately rather than randomly, so the SLA breach count and the trend chart both have something to show on a fresh install. Random ages produced runs where every complaint was inside SLA and the analytics page looked broken.
- Demo addresses are `@campus.edu` rather than `example.com`. Considered and kept: this is a campus complaints system, the domain is part of what makes the demo legible, no mail is ever sent, and nothing leaves the browser. The rule the project set for itself is no *personal* addresses, and there are none.

### Theming

- `campusissues.theme` in localStorage, read before paint so there is no flash of the wrong theme.

## Open threads

- **No tests.** The biggest gap. `api.ts` is 1,187 lines of workflow and authorization rules that are pure functions over a plain object, which is close to ideal for testing, and none of it is covered. The SLA arithmetic and the status transition rules are where a silent wrong answer would hurt most.
- `/complaint/:id` redirects to `/complaints`, dropping the id, while `/new-complaint` redirects to `/complaints/new` correctly. Both are deliberate legacy aliases, but the first one loses information: an old bookmark to a specific complaint lands on the list instead of that complaint. `<Navigate to={`/complaints/${id}`} replace />` would keep it.
- Attachments as inline data URLs will not survive a move to a real backend unchanged; they need an upload endpoint and a URL.
