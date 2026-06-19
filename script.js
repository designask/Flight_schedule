/* ============================================================
   Travel Offer PDF Generator
   Vanilla JS — live preview, CRUD rows, localStorage, PDF export
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "travel-offer-generator:v1";

  /* ---------- Default sample data (visa-change offer) ---------- */
  function defaultState() {
    return {
      banner: "",          // data URL string
      logo: "",            // data URL string
      title: "FLYDUBAI",
      subtitle: "VISA CHANGE AVAILABLE",
      description: "Affordable round-trip fares for your UAE visa change. Limited seats — book early to lock in the price.",
      footer: "www.yourtravelagency.com",
      themeColor: "#e11d2a",
      rows: [
        {
          date: "2025-07-15", from: "CMB", depTime: "09:30", to: "SHJ", arrTime: "13:05",
          rFrom: "SHJ", rDepTime: "18:40", rTo: "CMB", rArrTime: "01:20",
          price: "49,900", currency: "LKR", notes: "Includes 30kg baggage + visa assistance"
        },
        {
          date: "2025-07-22", from: "CMB", depTime: "11:15", to: "SHJ", arrTime: "14:50",
          rFrom: "SHJ", rDepTime: "20:10", rTo: "CMB", rArrTime: "02:55",
          price: "52,500", currency: "LKR", notes: "Same-day visa change pickup available"
        }
      ]
    };
  }

  /* ---------- State ---------- */
  var state = loadState();

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      // merge with defaults so new fields don't break old saves
      var base = defaultState();
      base.banner = parsed.banner || "";
      base.logo = parsed.logo || "";
      base.title = parsed.title != null ? parsed.title : base.title;
      base.subtitle = parsed.subtitle != null ? parsed.subtitle : base.subtitle;
      base.description = parsed.description != null ? parsed.description : base.description;
      base.footer = parsed.footer != null ? parsed.footer : base.footer;
      base.themeColor = parsed.themeColor || base.themeColor;
      if (Array.isArray(parsed.rows)) base.rows = parsed.rows;
      return base;
    } catch (e) {
      console.warn("Failed to load saved data, using defaults.", e);
      return defaultState();
    }
  }

  var saveTimer = null;
  function saveState() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Could not save to localStorage (image too large?).", e);
      }
    }, 200);
  }

  /* ---------- DOM refs ---------- */
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    bannerInput: $("bannerInput"),
    bannerClear: $("bannerClear"),
    logoInput: $("logoInput"),
    logoClear: $("logoClear"),
    title: $("title"),
    subtitle: $("subtitle"),
    description: $("description"),
    footer: $("footer"),
    themeColor: $("themeColor"),
    rowsEditor: $("rowsEditor"),
    addRowBtn: $("addRowBtn"),
    resetBtn: $("resetBtn"),
    downloadBtn: $("downloadBtn"),
    // poster
    posterBanner: $("posterBanner"),
    posterBannerImg: $("posterBannerImg"),
    posterLogo: $("posterLogo"),
    posterLogoImg: $("posterLogoImg"),
    posterTitle: $("posterTitle"),
    posterSubtitle: $("posterSubtitle"),
    posterDesc: $("posterDesc"),
    posterRows: $("posterRows"),
    posterFooter: $("posterFooter"),
    rowTemplate: $("rowEditorTemplate")
  };

  /* ---------- Helpers ---------- */
  function escapeText(str) {
    return (str == null ? "" : String(str));
  }

  function readFileAsDataURL(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.onerror = function () { cb(""); };
    reader.readAsDataURL(file);
  }

  /* ============================================================
     RENDER: editor inputs <- state
     ============================================================ */
  // Does the current title match one of the dropdown's options?
  function titleIsPreset(value) {
    var opts = els.title.options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === value) return true;
    }
    return false;
  }

  // Sync the title dropdown to match state.title
  function syncTitleControl() {
    if (!titleIsPreset(state.title) && els.title.options.length) {
      // fall back to the first available option
      state.title = els.title.options[0].value;
    }
    els.title.value = state.title;
  }

  function renderEditorFields() {
    syncTitleControl();
    els.subtitle.value = state.subtitle;
    els.description.value = state.description;
    els.footer.value = state.footer;
    els.themeColor.value = state.themeColor;
  }

  function renderRowEditors() {
    els.rowsEditor.innerHTML = "";
    state.rows.forEach(function (row, index) {
      var node = els.rowTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".row-card__label").textContent = "Offer Row " + (index + 1);

      // populate fields
      node.querySelectorAll("[data-field]").forEach(function (input) {
        var key = input.getAttribute("data-field");
        input.value = row[key] != null ? row[key] : "";
        input.addEventListener("input", function () {
          state.rows[index][key] = input.value;
          renderPoster();
          saveState();
        });
      });

      // delete
      node.querySelector('[data-action="delete"]').addEventListener("click", function () {
        state.rows.splice(index, 1);
        renderRowEditors();
        renderPoster();
        saveState();
      });

      els.rowsEditor.appendChild(node);
    });
  }

  /* ============================================================
     RENDER: poster preview <- state
     ============================================================ */
  function renderTheme() {
    document.documentElement.style.setProperty("--accent", state.themeColor);
    document.documentElement.style.setProperty("--accent-soft", hexToSoft(state.themeColor));
  }

  // build a light tint of the accent for soft backgrounds
  function hexToSoft(hex) {
    var c = parseHex(hex);
    if (!c) return "#fdecec";
    // mix with white ~ 90%
    var mix = function (v) { return Math.round(v + (255 - v) * 0.90); };
    return "rgb(" + mix(c.r) + "," + mix(c.g) + "," + mix(c.b) + ")";
  }
  function parseHex(hex) {
    if (typeof hex !== "string") return null;
    var m = hex.replace("#", "");
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    if (m.length !== 6) return null;
    return {
      r: parseInt(m.slice(0, 2), 16),
      g: parseInt(m.slice(2, 4), 16),
      b: parseInt(m.slice(4, 6), 16)
    };
  }

  function renderPoster() {
    // banner
    if (state.banner) {
      els.posterBannerImg.src = state.banner;
      els.posterBanner.classList.add("has-img");
    } else {
      els.posterBannerImg.removeAttribute("src");
      els.posterBanner.classList.remove("has-img");
    }
    // logo
    if (state.logo) {
      els.posterLogoImg.src = state.logo;
      els.posterLogo.classList.add("has-img");
    } else {
      els.posterLogoImg.removeAttribute("src");
      els.posterLogo.classList.remove("has-img");
    }

    els.posterTitle.textContent = escapeText(state.title);
    els.posterSubtitle.textContent = escapeText(state.subtitle);
    els.posterDesc.textContent = escapeText(state.description);
    els.posterFooter.textContent = escapeText(state.footer);

    renderPosterRows();
  }

  function legBlock(tagLabel, fromCode, fromTime, toCode, toTime) {
    var leg = document.createElement("div");
    leg.className = "leg";

    var tag = document.createElement("div");
    tag.className = "leg__tag";
    tag.textContent = tagLabel;
    leg.appendChild(tag);

    var line = document.createElement("div");
    line.className = "leg__line";

    var p1 = document.createElement("div");
    p1.className = "leg__point";
    p1.innerHTML = '<div class="leg__code"></div><div class="leg__time"></div>';
    p1.querySelector(".leg__code").textContent = escapeText(fromCode) || "—";
    p1.querySelector(".leg__time").textContent = escapeText(fromTime);

    var path = document.createElement("div");
    path.className = "leg__path";
    path.innerHTML = '<span class="dash"></span><span class="plane">✈</span><span class="dash"></span>';

    var p2 = document.createElement("div");
    p2.className = "leg__point";
    p2.innerHTML = '<div class="leg__code"></div><div class="leg__time"></div>';
    p2.querySelector(".leg__code").textContent = escapeText(toCode) || "—";
    p2.querySelector(".leg__time").textContent = escapeText(toTime);

    line.appendChild(p1);
    line.appendChild(path);
    line.appendChild(p2);
    leg.appendChild(line);
    return leg;
  }

  function renderPosterRows() {
    els.posterRows.innerHTML = "";
    state.rows.forEach(function (row) {
      var offer = document.createElement("div");
      offer.className = "offer";

      // calendar
      var cal = document.createElement("div");
      cal.className = "offer__cal";
      cal.innerHTML =
        '<div class="offer__cal-icon">' +
          '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" ' +
            'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
            '<rect x="3" y="4.5" width="18" height="16.5" rx="2.6"></rect>' +
            '<line x1="3" y1="9.5" x2="21" y2="9.5"></line>' +
            '<line x1="7.8" y1="2.5" x2="7.8" y2="6.3"></line>' +
            '<line x1="16.2" y1="2.5" x2="16.2" y2="6.3"></line>' +
            '<circle cx="8" cy="13.5" r="1.1" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="12" cy="13.5" r="1.1" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="16" cy="13.5" r="1.1" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="8" cy="17.3" r="1.1" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="12" cy="17.3" r="1.1" fill="currentColor" stroke="none"></circle>' +
          '</svg>' +
        '</div>' +
        '<div class="offer__cal-date"></div>';
      cal.querySelector(".offer__cal-date").textContent = escapeText(row.date) || "—";

      // routes
      var routes = document.createElement("div");
      routes.className = "offer__routes";
      routes.appendChild(legBlock("Departure", row.from, row.depTime, row.to, row.arrTime));
      routes.appendChild(legBlock("Return", row.rFrom, row.rDepTime, row.rTo, row.rArrTime));

      // price
      var price = document.createElement("div");
      price.className = "offer__price";
      price.innerHTML =
        '<div class="offer__price-label">From</div>' +
        '<div class="offer__price-amount"></div>' +
        '<div class="offer__price-cur"></div>';
      price.querySelector(".offer__price-amount").textContent = escapeText(row.price) || "—";
      price.querySelector(".offer__price-cur").textContent = escapeText(row.currency);

      offer.appendChild(cal);
      offer.appendChild(routes);
      offer.appendChild(price);

      // notes (full width, below)
      if (row.notes && String(row.notes).trim() !== "") {
        var notes = document.createElement("div");
        notes.className = "offer__notes";
        notes.textContent = "ℹ " + escapeText(row.notes);
        offer.appendChild(notes);
      }

      els.posterRows.appendChild(offer);
    });
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function bindEvents() {
    // text fields
    // title dropdown
    els.title.addEventListener("change", function () {
      state.title = els.title.value;
      renderPoster();
      saveState();
    });
    els.subtitle.addEventListener("input", function () { state.subtitle = els.subtitle.value; renderPoster(); saveState(); });
    els.description.addEventListener("input", function () { state.description = els.description.value; renderPoster(); saveState(); });
    els.footer.addEventListener("input", function () { state.footer = els.footer.value; renderPoster(); saveState(); });

    // theme color
    els.themeColor.addEventListener("input", function () {
      state.themeColor = els.themeColor.value;
      renderTheme();
      saveState();
    });

    // banner upload
    els.bannerInput.addEventListener("change", function () {
      var file = els.bannerInput.files && els.bannerInput.files[0];
      if (!file) return;
      readFileAsDataURL(file, function (url) {
        state.banner = url;
        renderPoster();
        saveState();
      });
    });
    els.bannerClear.addEventListener("click", function () {
      state.banner = "";
      els.bannerInput.value = "";
      renderPoster();
      saveState();
    });

    // logo upload
    els.logoInput.addEventListener("change", function () {
      var file = els.logoInput.files && els.logoInput.files[0];
      if (!file) return;
      readFileAsDataURL(file, function (url) {
        state.logo = url;
        renderPoster();
        saveState();
      });
    });
    els.logoClear.addEventListener("click", function () {
      state.logo = "";
      els.logoInput.value = "";
      renderPoster();
      saveState();
    });

    // add row
    els.addRowBtn.addEventListener("click", function () {
      state.rows.push({
        date: "", from: "", depTime: "", to: "", arrTime: "",
        rFrom: "", rDepTime: "", rTo: "", rArrTime: "",
        price: "", currency: "LKR", notes: ""
      });
      renderRowEditors();
      renderPoster();
      saveState();
      // scroll to the new card
      var cards = els.rowsEditor.querySelectorAll(".row-card");
      if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // reset
    els.resetBtn.addEventListener("click", function () {
      if (!confirm("Reset all data back to the sample offer? This will erase your current changes.")) return;
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      renderAll();
      saveState();
    });

    // download pdf
    els.downloadBtn.addEventListener("click", exportPDF);
  }

  /* ============================================================
     PDF EXPORT — A4 portrait, poster only
     ============================================================ */
  function exportPDF() {
    var poster = $("poster");
    if (!poster) return;

    if (typeof window.html2canvas !== "function" ||
        !window.jspdf || typeof window.jspdf.jsPDF !== "function") {
      alert("PDF libraries are still loading or blocked. Please check your internet connection and try again.");
      return;
    }

    var btn = els.downloadBtn;
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Generating…";

    // Render at higher scale for crisp output
    window.html2canvas(poster, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: poster.scrollWidth,
      windowHeight: poster.scrollHeight
    }).then(function (canvas) {
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      var pageW = pdf.internal.pageSize.getWidth();   // 210mm
      var pageH = pdf.internal.pageSize.getHeight();  // 297mm

      var imgW = pageW;
      var imgH = (canvas.height * imgW) / canvas.width;

      var imgData = canvas.toDataURL("image/jpeg", 0.95);

      if (imgH <= pageH) {
        // fits on a single page — center vertically
        var yOffset = (pageH - imgH) / 2;
        pdf.addImage(imgData, "JPEG", 0, yOffset > 0 ? yOffset : 0, imgW, imgH);
      } else {
        // taller than one page — slice across multiple pages
        var position = 0;
        var remaining = imgH;
        while (remaining > 0) {
          pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
          remaining -= pageH;
          if (remaining > 0) {
            pdf.addPage();
            position -= pageH;
          }
        }
      }

      pdf.save("travel-offer.pdf");
    }).catch(function (err) {
      console.error(err);
      alert("Sorry, the PDF could not be generated. See the console for details.");
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = originalText;
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function renderAll() {
    renderTheme();
    renderEditorFields();
    renderRowEditors();
    renderPoster();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderAll();
    bindEvents();
  });
})();
