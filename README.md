# Overlap

Compare one or two ICS work calendars on a week or month grid. With two calendars loaded, see when both are free, when only one is busy, and when both are busy.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

**Important:** Calendar URLs (for example Quinyx `webcal://` links) only work when the app runs with a server — `npm run dev`, `npm run preview`, or `npm run build && npm start`. Opening `index.html` directly from disk will not load URLs (no proxy).

## Loading calendars

### Calendar 1 (required for a view)

- **URL** — Paste an ICS/webcal link and click **Load**. Works when the dev/production server is running (see [Privacy](#privacy)).
- **File** — Download the `.ics` from your calendar app and use the file picker, then **Load**. Stays entirely in the browser.

### Calendar 2 (optional, for comparison)

Same options as calendar 1. When both are loaded, the grid uses comparison colors.

### Quinyx webcal

Quinyx gives links like `webcal://app.quinyx.com/webcal/?id=...` — paste them as-is. The app converts `webcal://` to `https://` and fetches via `/api/ics` on the same server (avoids CORS).

If URL loading still fails, upload the downloaded `.ics` file instead.

### Language

Use the **UK / Sweden flag buttons** (top left) to switch between English and Swedish.

### How it works

Click **How it works** for a guide and a note that **loaded schedule data is not saved** — processing stays in your browser; URL fetches may use the local proxy described below.

### Mutual free days

When two calendars are loaded, days where **both are free for the entire day** (06:00–22:00) are highlighted in bright green.

## Week and month views

Use the **Week** / **Month** toggle above the calendar.

- **Timezone:** `Europe/Stockholm` (display default; event times follow each feed).
- **Hours shown:** 06:00–22:00, in 15-minute slots (same in both views).
- **Week view:** Full hourly grid for one week (Mon–Sun).
- **Month view:** Calendar month with a mini timeline per day (padding days from adjacent months are dimmed).
- **Navigation:** Previous / Today / Next — moves by week or month depending on the active view.

## Comparison legend (two calendars)

| Color | Meaning |
|-------|---------|
| Green | Both free |
| Blue | Calendar 1 free, Calendar 2 busy |
| Amber | Calendar 2 free, Calendar 1 busy |
| Red-gray | Both busy |

Single-calendar mode shows free (dark green) vs busy (purple).

## Privacy

- **File upload:** Parsed in your browser; not uploaded to a backend.
- **URL load:** Your browser requests `/api/ics?url=...` on the **same origin** as the app (Vite dev server or `npm start`). That proxy fetches the calendar and returns it; it does not store feeds. See [SECURITY.md](SECURITY.md) before exposing the proxy on the public internet.
- **Persistence:** Loaded calendars are cleared on refresh. Only language preference is stored in `localStorage`.

## Limitations

- Recurring events are expanded for roughly three months in the past and two years ahead (typical work-shift feeds).
- All-day and multi-day events are shown as busy for the overlapping slots in the 06:00–22:00 window.

## Build for production

```bash
npm run build
npm run start
```

Or `npm run preview` for a quick preview. Static files are in `dist/`. Use `npm start` for production-like serving with the calendar URL proxy.

## License

[MIT](LICENSE)
