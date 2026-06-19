# Travel Offer PDF Generator

A small, **fully client-side** web app for designing editable travel / airline offer
posters and exporting them as **high-quality A4 PDFs** — right from the browser.
No backend, no build step, no sign-up.

Use the included sample (a UAE *visa-change* offer) as a starting point, edit every
text field, route, time and price, upload your own banner + logo, pick a theme color,
and click **Download PDF**.

> ⚠️ The reference design is used for **layout inspiration only**. No copyrighted
> airline logos are bundled — you upload your own logo/banner and type your own
> airline / travel-agency text.

---

## ✨ Features

- **Editable top section** — upload a banner image and a logo, edit the main title
  (e.g. `AIR ARABIA`), subtitle (e.g. `VISA CHANGE AVAILABLE`), an optional
  description, and a footer/contact line.
- **Editable offer rows** — add / edit / delete as many rows as you like. Each row has:
  date, from airport, departure time, to airport, arrival time, return-from,
  return departure time, return-to, return arrival time, price, currency, and notes.
- **Clean poster design** — white background, red accent (customizable), rounded
  cards, a calendar block on the left, route + time details in the middle, and a
  price block on the right.
- **Live preview** — the poster updates instantly as you type.
- **Theme color picker** — change the main accent color of the whole poster.
- **A4 PDF export** — exports **only the poster** (not the form), in A4 portrait,
  at 2× resolution for crisp output. The file is saved as `travel-offer.pdf`.
- **Auto-save** — your work is stored in `localStorage`, so a refresh won't lose it.
- **Reset button** — restores the original sample data.
- **Mobile-friendly** — the editor stacks above the preview on small screens.
- **Multilingual text** — all poster text fields are free-form, so you can type
  **Sinhala or English** (or any language). The UI labels stay in simple English.

---

## 📁 Project structure

```
.
├── index.html      # Markup: editor form + poster preview
├── style.css       # All styling, including the poster layout (A4 proportions)
├── script.js       # App logic: state, live preview, CRUD, localStorage, PDF export
└── README.md
```

The PDF libraries ([html2canvas](https://html2canvas.hertzen.com/) and
[jsPDF](https://github.com/parallax/jsPDF)) are loaded from a CDN in `index.html`,
so an internet connection is needed the first time you generate a PDF.

---

## 🚀 Run locally

Because it is pure static HTML/CSS/JS, you can open `index.html` directly in a
browser. For best results (and so image uploads behave consistently), serve it
over a tiny local web server:

```bash
# Option 1 — Python 3
python3 -m http.server 8000

# Option 2 — Node.js
npx serve .

# then open http://localhost:8000
```

---

## 🌐 Deploy to GitHub Pages

This app works from a **GitHub Pages subfolder path** (e.g.
`https://<user>.github.io/<repo>/`) out of the box, because every asset is
referenced with a **relative path** (`style.css`, `script.js`).

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select the branch (e.g. `main`) and the **`/ (root)`** folder, then **Save**.
5. Wait a minute, then visit `https://<your-username>.github.io/<repo-name>/`.

No build configuration is required. (This project intentionally uses plain
HTML/CSS/JS instead of Vite so there is nothing to compile.)

> If you ever migrate this to **Vite/React**, remember to set
> `base: '/<repo-name>/'` in `vite.config.js` so asset paths resolve correctly
> under the GitHub Pages subfolder, and deploy the `dist/` output.

---

## 🎨 How to customize the poster

| What you want to change | Where |
| --- | --- |
| Banner / logo images | Use the **upload** fields in the editor |
| Title, subtitle, description, footer | Editor text fields (type any language) |
| Accent / theme color | The **Main theme color** picker |
| Offer rows (routes, times, prices) | The **Flight / Offer Rows** section |
| Default sample data | `defaultState()` in `script.js` |
| Fonts, spacing, card styles | `style.css` (poster styles are under the `.poster` selectors) |
| Poster size / proportions | `.poster` width/height in `style.css` (currently 794×1123px = A4 @96dpi) |

### Tips
- **Images:** wide banners (roughly 1200×450 or similar) look best. Logos with a
  transparent background sit nicely in the white logo badge.
- **Reset:** the **Reset** button clears your saved data and restores the sample.
- **Export quality:** PDF export renders at 2× scale. If you need even sharper
  output, increase the `scale` value in the `html2canvas(...)` call in `script.js`.

---

## 🔒 Privacy

Everything runs in your browser. Your text and uploaded images are stored only in
your browser's `localStorage` and are never sent to any server.

---

## License

You are free to use and adapt this project for your own travel/offer posters.
Do not upload or distribute copyrighted logos you do not have rights to use.
