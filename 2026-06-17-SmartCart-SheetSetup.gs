/**
 * SmartCart — One-time Google Sheet schema setup
 * Locked schema ref: Studio/Projects/SmartCart/PROJECT.md (2026-06-17)
 *
 * HOW TO RUN:
 * 1. Create a new blank Google Sheet (this becomes the SmartCart workbook).
 * 2. Extensions > Apps Script. Delete any boilerplate code, paste this file in.
 * 3. Save. Select "setupSmartCartSheet" from the function dropdown. Click Run.
 * 4. Authorize on first run (your own sheet, your own script — normal prompt).
 * 5. Check the sheet: 7 tabs, headers frozen/bold, Categories + Preferences
 *    pre-filled, dropdown validation on Category/Source/Status/Y-N columns.
 *
 * Safe to re-run: resets headers/validation, never touches existing data rows,
 * never deletes columns. Only deletes the default "Sheet1" if it's still
 * present and empty.
 */

function setupSmartCartSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const TAB_ORDER = ['Categories', 'Purchases', 'GroceryList', 'Preferences',
    'Reports', 'PriceHistory', 'Nutrition'];

  const TAB_HEADERS = {
    'Categories': ['Category', 'FSRI_Category'],
    'Purchases': ['Date', 'Store', 'Item (Raw)', 'Item (Canonical)', 'Brand',
      'Package Size', 'Qty', 'Price Paid', 'Regular Price', 'Unit Price',
      'Category', 'Subcategory', 'FSRI_Category', 'Source', 'Receipt ID', 'Notes'],
    'GroceryList': ['Item (Canonical)', 'Category', 'Subcategory', 'Default Unit',
      'Preferred Store(s)', 'Last Purchased', 'Last Price', 'Last Unit Price',
      'Freezable (Y/N)', 'Active (Y/N)'],
    'Preferences': ['Setting', 'Value'],
    'Reports': ['Date Sent', 'Items Flagged', 'Best Deals Summary', 'Status'],
    'PriceHistory': ['Item (Canonical)', 'Store', 'Date', 'Price', 'Unit Price', 'Source'],
    'Nutrition': ['Item (Canonical)', 'Calories/100g', 'Protein/100g', 'Fat/100g', 'Carbs/100g']
  };

  // Category taxonomy cross-referenced to FSRI's 9 commodity categories.
  // Personal Care and Health & Wellness are SmartCart-only (FSRI doesn't track them).
  const CATEGORY_DATA = [
    ['Proteins', 'Proteins'],
    ['Grains & Cereals', 'Grains & cereals'],
    ['Dairy', 'Dairy'],
    ['Produce', 'Fresh produce'],
    ['Pantry & Condiments', 'Pantry staples'],
    ['Spices & Seasonings', 'Pantry staples'],
    ['Sugar & Sweeteners', 'Sugar & sweeteners'],
    ['Coffee, Tea & Cocoa', 'Coffee, tea, cocoa'],
    ['Edible Oils', 'Edible oils'],
    ['Household', 'Household non-food'],
    ['Personal Care', ''],
    ['Health & Wellness', '']
  ];

  const PREFERENCE_DEFAULTS = [
    ['Email', ''],
    ['Tracked Stores', 'Safeway, Save-On-Foods, Real Canadian Superstore, Walmart, Costco, Independent Grocer, Co-op'],
    ['Dietary Notes', ''],
    ['Report Day', 'Thursday']
  ];

  // 1. Create/reset each tab with frozen, bold headers.
  TAB_ORDER.forEach(function (name) {
    const sheet = getOrCreateSheet(ss, name);
    const headers = TAB_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  // 2. Seed Categories data (only if the tab is still empty below the header).
  const catSheet = ss.getSheetByName('Categories');
  if (catSheet.getLastRow() < 2) {
    catSheet.getRange(2, 1, CATEGORY_DATA.length, 2).setValues(CATEGORY_DATA);
  }

  // 3. Seed Preferences defaults (only if still empty below the header).
  const prefSheet = ss.getSheetByName('Preferences');
  if (prefSheet.getLastRow() < 2) {
    prefSheet.getRange(2, 1, PREFERENCE_DEFAULTS.length, 2).setValues(PREFERENCE_DEFAULTS);
  }

  // 4. Dropdown validation, sourced from the Categories tab + fixed lists.
  const lastCatRow = Math.max(catSheet.getLastRow(), 2);
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(catSheet.getRange('A2:A' + lastCatRow), true)
    .setAllowInvalid(false)
    .build();
  const sourceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Receipt Photo', 'Email', 'Manual'], true)
    .setAllowInvalid(false)
    .build();
  const yesNoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Y', 'N'], true)
    .setAllowInvalid(false)
    .build();
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Sent', 'Failed'], true)
    .setAllowInvalid(false)
    .build();

  const validations = [
    { tab: 'Purchases', column: 'Category', rule: categoryRule, rows: 2000 },
    { tab: 'Purchases', column: 'Source', rule: sourceRule, rows: 2000 },
    { tab: 'GroceryList', column: 'Category', rule: categoryRule, rows: 1000 },
    { tab: 'GroceryList', column: 'Freezable (Y/N)', rule: yesNoRule, rows: 1000 },
    { tab: 'GroceryList', column: 'Active (Y/N)', rule: yesNoRule, rows: 1000 },
    { tab: 'Reports', column: 'Status', rule: statusRule, rows: 500 }
  ];

  validations.forEach(function (v) {
    applyValidation(ss.getSheetByName(v.tab), v.column, TAB_HEADERS[v.tab], v.rule, v.rows);
  });

  // 5. Remove the default blank "Sheet1" if it's still sitting there, untouched.
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // 6. Reorder tabs to match the canonical order.
  TAB_ORDER.forEach(function (name, i) {
    ss.setActiveSheet(ss.getSheetByName(name));
    ss.moveActiveSheet(i + 1);
  });

  SpreadsheetApp.getActiveSpreadsheet().toast('SmartCart schema setup complete — 7 tabs ready.');
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function applyValidation(sheet, columnHeader, headers, rule, numRows) {
  const colIndex = headers.indexOf(columnHeader) + 1; // 1-based
  if (colIndex === 0) return;
  sheet.getRange(2, colIndex, numRows, 1).setDataValidation(rule);
}
