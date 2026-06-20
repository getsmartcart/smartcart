/**
 * SmartCart — Runtime backend (Web App)
 * Locked schema ref: Studio/Projects/SmartCart/PROJECT.md (2026-06-17)
 *
 * Lives in the same Apps Script project as 2026-06-17-SmartCart-SheetSetup.gs
 * ("SmartCart Setup"), as a second file. Add it via Files > + > Script,
 * name it "Backend", paste this in.
 *
 * Mirrors the Golf project's webhook pattern (apps-script.gs) for consistency:
 * doGet for reads, doPost + secret token for writes, json_() / sanitize_()
 * helpers, plain-text POST body (no custom headers) to avoid CORS preflight.
 *
 * SETUP (one-time, after pasting):
 * 1. Project Settings > Script Properties > add WEBHOOK_SECRET = <random string>.
 * 2. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone.
 * 3. Copy the Web app URL into the PWA as SHEETS_URL (same pattern as Golf's
 *    index.html: fetch(SHEETS_URL, {method:"POST", body: JSON.stringify({...payload, secret: WEBHOOK_SECRET})})).
 * 4. Every code change requires a NEW deployment version (Deploy > Manage
 *    deployments > edit > New version) — saving alone does not update the
 *    live Web app URL's behaviour.
 */

// ── GET — reads for PWA autocomplete / dropdowns ───────────────────────────

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  const ss = SpreadsheetApp.getActive();

  try {
    if (action === 'groceryList') {
      return json_({ ok: true, items: getGroceryListItems_(ss) });
    }
    if (action === 'categories') {
      return json_({ ok: true, categories: getCategories_(ss) });
    }
    return json_({ ok: true, message: 'SmartCart webhook live. Actions: groceryList, categories (GET); addReceipt, scanReceipt, scanPackageLabel, updateReceipt (POST).' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ── POST — receipt / manual purchase writes ─────────────────────────────────

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (secret && p.secret !== secret) {
      return json_({ ok: false, error: 'Unauthorised.' });
    }
    if (p.action === 'addReceipt') {
      return handleAddReceipt_(p);
    }
    if (p.action === 'scanReceipt') {
      return handleScanReceipt_(p);
    }
    if (p.action === 'scanPackageLabel') {
      return handleScanPackageLabel_(p);
    }
    if (p.action === 'updateReceipt') {
      return handleUpdateReceipt_(p);
    }
    return json_({ ok: false, error: 'Unknown action: ' + p.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ── Receipt handling ─────────────────────────────────────────────────────────

/**
 * Expected payload:
 * {
 *   action: 'addReceipt',
 *   secret: '...',
 *   store: 'Save-On-Foods',
 *   date: '2026-06-17',          // yyyy-mm-dd
 *   receiptId: 'uuid-or-blank',
 *   source: 'Receipt Photo' | 'Email' | 'Manual',
 *   items: [
 *     {
 *       itemRaw, itemCanonical, brand, packageSize, qty,
 *       pricePaid, regularPrice, unitPrice,
 *       category, subcategory, fsriCategory, notes,
 *       defaultUnit, freezable   // 'Y'/'N', only used if item is new to GroceryList
 *     }, ...
 *   ]
 * }
 */
function handleAddReceipt_(p) {
  const ss = SpreadsheetApp.getActive();
  const store = sanitize_(p.store || '');
  const date = sanitize_(p.date || formatDate_(new Date()));
  const receiptId = sanitize_(p.receiptId || Utilities.getUuid());
  const source = sanitize_(p.source || 'Manual');
  const items = Array.isArray(p.items) ? p.items : [];

  if (items.length === 0) {
    return json_({ ok: false, error: 'No items in payload.' });
  }

  const purchasesSh = ss.getSheetByName('Purchases');
  const priceHistSh = ss.getSheetByName('PriceHistory');

  const purchaseRows = [];
  const priceHistRows = [];

  items.forEach(function (item) {
    const itemCanonical = sanitize_(item.itemCanonical || item.itemRaw || '');
    const pricePaid = parseFloat(item.pricePaid) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;

    purchaseRows.push([
      date,
      store,
      sanitize_(item.itemRaw || ''),
      itemCanonical,
      sanitize_(item.brand || ''),
      sanitize_(item.packageSize || ''),
      parseFloat(item.qty) || 1,
      pricePaid,
      parseFloat(item.regularPrice) || pricePaid,
      unitPrice,
      sanitize_(item.category || ''),
      sanitize_(item.subcategory || ''),
      sanitize_(item.fsriCategory || ''),
      source,
      receiptId,
      sanitize_(item.notes || '')
    ]);

    priceHistRows.push([
      itemCanonical, store, date, pricePaid, parseFloat(item.regularPrice) || pricePaid, unitPrice, source
    ]);

    upsertGroceryListItem_(ss, {
      itemCanonical: itemCanonical,
      category: sanitize_(item.category || ''),
      subcategory: sanitize_(item.subcategory || ''),
      defaultUnit: sanitize_(item.defaultUnit || ''),
      store: store,
      date: date,
      price: pricePaid,
      unitPrice: unitPrice,
      freezable: item.freezable === 'Y' || item.freezable === 'N' ? item.freezable : null
    });
  });

  if (purchaseRows.length > 0) {
    purchasesSh.getRange(purchasesSh.getLastRow() + 1, 1, purchaseRows.length, purchaseRows[0].length)
      .setValues(purchaseRows);
  }
  if (priceHistRows.length > 0) {
    priceHistSh.getRange(priceHistSh.getLastRow() + 1, 1, priceHistRows.length, priceHistRows[0].length)
      .setValues(priceHistRows);
  }

  return json_({ ok: true, receiptId: receiptId, itemsAdded: purchaseRows.length });
}

/**
 * Patches an already-saved Purchases row, matched by Receipt ID + Item (Raw).
 * Used by the PWA's post-save "complete missing data" flow (package-label
 * scan) so a row doesn't need a separate full edit pass.
 *
 * Expected payload:
 * {
 *   action: 'updateReceipt',
 *   secret: '...',
 *   receiptId: '...',        // must match an existing Purchases row
 *   itemRaw: '...',          // must match that row's Item (Raw), case-insensitive
 *   packageSize: '...',      // optional — overwrites Package Size column
 *   notesAppend: '...'       // optional — appended to existing Notes (" | "-joined)
 * }
 * Returns: { ok: true, updated: true|false }
 */
function handleUpdateReceipt_(p) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Purchases');
  const receiptId = sanitize_(p.receiptId || '');
  const itemRaw = sanitize_(p.itemRaw || '');

  if (!receiptId || !itemRaw) {
    return json_({ ok: false, error: 'receiptId and itemRaw are required.' });
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return json_({ ok: true, updated: false });
  }

  // Columns: Date(1) Store(2) Item Raw(3) Item Canonical(4) Brand(5)
  // Package Size(6) Qty(7) Price Paid(8) Regular Price(9) Unit Price(10)
  // Category(11) Subcategory(12) FSRI_Category(13) Source(14) Receipt ID(15) Notes(16)
  const data = sh.getRange(2, 1, lastRow - 1, 16).getValues();
  let matchRow = -1;
  const itemKey = itemRaw.trim().toLowerCase();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][14]).trim() === receiptId &&
        String(data[i][2]).trim().toLowerCase() === itemKey) {
      matchRow = i + 2; // 1-based, +1 for header
      break;
    }
  }

  if (matchRow === -1) {
    return json_({ ok: true, updated: false, error: 'No matching row for that receiptId/itemRaw.' });
  }

  if (p.packageSize) {
    sh.getRange(matchRow, 6).setValue(sanitize_(p.packageSize));
  }
  if (p.notesAppend) {
    const existingNotes = String(sh.getRange(matchRow, 16).getValue() || '');
    const merged = existingNotes ? existingNotes + ' | ' + sanitize_(p.notesAppend) : sanitize_(p.notesAppend);
    sh.getRange(matchRow, 16).setValue(merged);
  }

  return json_({ ok: true, updated: true });
}

// ── GroceryList upsert ───────────────────────────────────────────────────────
// NOTE: writes are hardcoded to columns 1-10 on purpose. Column 11
// ("Product URL(s)", added 2026-06-20) is manually/skill-maintained and must
// stay untouched by receipt-driven upserts — do not widen these ranges to 11
// without separating that field out first.

function upsertGroceryListItem_(ss, item) {
  const sh = ss.getSheetByName('GroceryList');
  const lastRow = sh.getLastRow();
  const key = item.itemCanonical.trim().toLowerCase();

  let matchRow = -1;
  if (lastRow >= 2) {
    const names = sh.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < names.length; i++) {
      if (String(names[i][0]).trim().toLowerCase() === key) {
        matchRow = i + 2; // 1-based, +1 for header
        break;
      }
    }
  }

  if (matchRow === -1) {
    // New item — append.
    sh.getRange(sh.getLastRow() + 1, 1, 1, 10).setValues([[
      item.itemCanonical,
      item.category,
      item.subcategory,
      item.defaultUnit,
      item.store,
      item.date,
      item.price,
      item.unitPrice,
      item.freezable || 'N',
      'Y'
    ]]);
    return;
  }

  // Existing item — update category (in case reclassified), default unit
  // (only if provided), preferred stores (append/dedupe), last purchase fields.
  const row = sh.getRange(matchRow, 1, 1, 10).getValues()[0];
  const existingStores = String(row[4] || '').split(',').map(s => s.trim()).filter(Boolean);
  if (item.store && existingStores.indexOf(item.store) === -1) {
    existingStores.push(item.store);
  }

  sh.getRange(matchRow, 2).setValue(item.category || row[1]);
  sh.getRange(matchRow, 3).setValue(item.subcategory || row[2]);
  if (item.defaultUnit) sh.getRange(matchRow, 4).setValue(item.defaultUnit);
  sh.getRange(matchRow, 5).setValue(existingStores.join(', '));
  sh.getRange(matchRow, 6).setValue(item.date);
  sh.getRange(matchRow, 7).setValue(item.price);
  sh.getRange(matchRow, 8).setValue(item.unitPrice);
  if (item.freezable) sh.getRange(matchRow, 9).setValue(item.freezable);
}

// ── Reads for PWA ────────────────────────────────────────────────────────────

function getGroceryListItems_(ss) {
  const sh = ss.getSheetByName('GroceryList');
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const rows = sh.getRange(2, 1, lastRow - 1, 10).getValues();
  return rows
    .filter(r => r[0]) // skip blank rows
    .map(r => ({
      item: r[0], category: r[1], subcategory: r[2], defaultUnit: r[3],
      preferredStores: r[4], lastPurchased: formatDate_(r[5]), lastPrice: r[6],
      lastUnitPrice: r[7], freezable: r[8], active: r[9]
    }));
}

function getCategories_(ss) {
  const sh = ss.getSheetByName('Categories');
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  return sh.getRange(2, 1, lastRow - 1, 2).getValues()
    .filter(r => r[0])
    .map(r => ({ category: r[0], fsriCategory: r[1] }));
}

// ── Shared helpers (mirrors Golf's apps-script.gs conventions) ─────────────

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitize_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@|%`]/.test(v) ? "'" + v : v;
}

function formatDate_(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toLocaleDateString('en-CA');
  return String(d);
}

// Receipt Vision parsing (Claude API)
/**
 * Expected payload:
 * {
 *   action: 'scanReceipt',
 *   secret: '...',
 *   imageBase64: '...',
 *   mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
 * }
 * Returns: { ok: true, store, date, items: [{ itemRaw, qty, pricePaid, category }] }
 * Requires ANTHROPIC_API_KEY script property. Does not write to the Sheet -
 * the PWA confirm screen calls addReceipt separately once Paul approves.
 */
function handleScanReceipt_(p) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json_({ ok: false, error: 'ANTHROPIC_API_KEY not set in Script Properties.' });
  }
  if (!p.imageBase64) {
    return json_({ ok: false, error: 'No image provided.' });
  }

  const ss = SpreadsheetApp.getActive();
  const categories = getCategories_(ss).map(function (c) { return c.category; });

  const prompt = 'You are extracting structured data from a photo of a grocery store receipt. ' +
    'Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape: ' +
    '{"store": string, "date": "YYYY-MM-DD or empty string if not legible", "items": [{"itemRaw": string, "qty": number, "pricePaid": number, "category": string}]}. ' +
    'For pricePaid use the actual price paid for that line item (after any in-line discount shown on the receipt), not the regular price. ' +
    'Skip subtotal, tax, total, and loyalty or points lines, only include actual purchased items. ' +
    'category must be exactly one of: ' + categories.join(', ') + '. Pick the closest match if unsure.';

  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: p.mediaType || 'image/jpeg', data: p.imageBase64 } },
        { type: 'text', text: prompt }
      ]
    }]
  };

  const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const status = resp.getResponseCode();
  const raw = resp.getContentText();
  if (status !== 200) {
    return json_({ ok: false, error: 'Claude API error (' + status + '): ' + raw });
  }

  let parsed;
  try {
    const data = JSON.parse(raw);
    let txt = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    txt = txt.trim();
    const fence = String.fromCharCode(96, 96, 96);
    if (txt.indexOf(fence) === 0) {
      txt = txt.slice(fence.length);
      if (txt.slice(0, 4).toLowerCase() === 'json') txt = txt.slice(4);
      const lastFence = txt.lastIndexOf(fence);
      if (lastFence !== -1) txt = txt.slice(0, lastFence);
      txt = txt.trim();
    }
    parsed = JSON.parse(txt);
  } catch (err) {
    return json_({ ok: false, error: 'Could not parse Claude response: ' + String(err) });
  }

  return json_({
    ok: true,
    store: parsed.store || '',
    date: parsed.date || '',
    items: Array.isArray(parsed.items) ? parsed.items : []
  });
}

// Package label Vision parsing (Claude API)
/**
 * Expected payload:
 * {
 *   action: 'scanPackageLabel',
 *   secret: '...',
 *   imageBase64: '...',
 *   mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
 * }
 * Returns: { ok: true, packageSize: '454 g', pricePerKg: 8.82 }
 * Requires ANTHROPIC_API_KEY script property. Does not write to the Sheet —
 * the PWA's post-save completion flow merges the result into the already-
 * saved Purchases row via a separate updateReceipt call.
 *
 * Minimal schema (net weight + price/kg only) — best-before date and PLU
 * code were considered but deferred; see PROJECT.md Roadmap item 4.
 */
function handleScanPackageLabel_(p) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json_({ ok: false, error: 'ANTHROPIC_API_KEY not set in Script Properties.' });
  }
  if (!p.imageBase64) {
    return json_({ ok: false, error: 'No image provided.' });
  }

  const prompt = 'You are extracting structured data from a photo of a grocery package label ' +
    '(the small printed sticker showing weight and price, common on meat, produce, and deli items). ' +
    'Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape: ' +
    '{"packageSize": string, "pricePerKg": number}. ' +
    'packageSize is the net weight as printed, including units, e.g. "0.454 kg" or "454 g". ' +
    'pricePerKg is the price-per-kilogram shown on the label as a plain number with no currency symbol ' +
    '(if the label shows price-per-100g instead, multiply by 10 to get price-per-kg). ' +
    'If a field is not legible or not present, use an empty string for packageSize or 0 for pricePerKg.';

  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: p.mediaType || 'image/jpeg', data: p.imageBase64 } },
        { type: 'text', text: prompt }
      ]
    }]
  };

  const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const status = resp.getResponseCode();
  const raw = resp.getContentText();
  if (status !== 200) {
    return json_({ ok: false, error: 'Claude API error (' + status + '): ' + raw });
  }

  let parsed;
  try {
    const data = JSON.parse(raw);
    let txt = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    txt = txt.trim();
    const fence = String.fromCharCode(96, 96, 96);
    if (txt.indexOf(fence) === 0) {
      txt = txt.slice(fence.length);
      if (txt.slice(0, 4).toLowerCase() === 'json') txt = txt.slice(4);
      const lastFence = txt.lastIndexOf(fence);
      if (lastFence !== -1) txt = txt.slice(0, lastFence);
      txt = txt.trim();
    }
    parsed = JSON.parse(txt);
  } catch (err) {
    return json_({ ok: false, error: 'Could not parse Claude response: ' + String(err) });
  }

  return json_({
    ok: true,
    packageSize: parsed.packageSize || '',
    pricePerKg: parsed.pricePerKg || 0
  });
}
