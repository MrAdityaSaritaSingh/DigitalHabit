/**
 * DIGITAL TOTEM BACKEND v3.2 (Fixed Scoping & Habits Storage)
 */

const MEMBERS_SHEET = "_Members";

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const members = {};

  // 1. Load Metadata (Settings & Habits) from _Members Sheet
  const memSheet = ss.getSheetByName(MEMBERS_SHEET);
  if (memSheet) {
    const data = memSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { // Skip header
      const row = data[i];
      const uid = String(row[0]);
      if (!uid) continue;

      let settings = {};
      try { settings = JSON.parse(row[2]); } catch (e) { }
      
      let storedHabitNames = [];
      try { storedHabitNames = JSON.parse(row[4]); } catch (e) { }
      
      const habits = storedHabitNames.map((text, idx) => ({ id: `${idx}`, text }));

      members[uid] = {
        id: uid,
        name: row[1],
        settings: settings,
        habits: habits.length ? habits : [], 
        history: {},
        visitFund: 0
      };
    }
  }

  // 2. Load History from User Sheets
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName === MEMBERS_SHEET) return; 

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const range = sheet.getDataRange().getValues();
    const headers = range[0]; 
    
    // Parse Habits from Sheet Checks (Fallback)
    let sheetHabits = [];
    for (let i = 1; i <= 5; i++) {
       const text = headers[i] ? headers[i].replace("Habit: ", "") : `Habit ${i}`;
       sheetHabits.push({ id: `${i-1}`, text: text });
    }

    const history = {};
    let visitFund = 0;
    let userId = "";

    // Parse Rows
    for (let r = 1; r < range.length; r++) {
      const row = range[r];
      const rawDate = row[0];
      let dateKey = "";
      if (rawDate instanceof Date) dateKey = rawDate.toISOString().split('T')[0];
      else dateKey = String(rawDate).split('T')[0];

      const dailyStatus = [];
      for (let c = 1; c <= 5; c++) {
         const val = row[c];
         let isDone = (val === 1 || val === "1" || val === true || val === "TRUE" || val === "Yes");
         dailyStatus.push(isDone);
      }
      history[dateKey] = dailyStatus;

      visitFund = Number(row[6]) || 0;
      if (row[7]) userId = String(row[7]);
    }

    if (userId) {
      if (!members[userId]) {
        members[userId] = { id: userId, name: sheetName, settings: {}, history: {}, visitFund: 0, habits: [] };
      }
      // If we didn't get habits from _Members, use the ones from the sheet headers
      if (!members[userId].habits || members[userId].habits.length === 0) {
          members[userId].habits = sheetHabits;
      }
      members[userId].history = history;
      members[userId].visitFund = visitFund;
    }
  });

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: members
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); 
  
  try {
    const parsing = JSON.parse(e.postData.contents);
    const { userName, userId, date, habitNames, habits, visitFund, settings } = parsing;

    if (!userName || !userId) throw new Error("Missing Identity");

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- HANDLE ACTIONS ---
    const action = parsing.action || 'UPDATE';

    if (action === 'DELETE') {
       // 1. Delete from _Members
       let memSheet = ss.getSheetByName(MEMBERS_SHEET);
       if (memSheet) {
          const data = memSheet.getDataRange().getValues();
          for (let i = 1; i < data.length; i++) {
             if (String(data[i][0]) === String(userId)) {
                 memSheet.deleteRow(i + 1);
                 break;
             }
          }
       }
       // 2. Delete User Sheet
       const userSheet = ss.getSheetByName(userName);
       if (userSheet) ss.deleteSheet(userSheet);
       
       return response({ status: 'success', action: 'deleted' });
    }

    // --- A. UPDATE DAILY LOG (User Sheet) ---
    // (Default Action)
    let sheet = ss.getSheetByName(userName);
    if (!sheet) {
       sheet = ss.insertSheet(userName);
       const headerRow = ["Date"];
       const names = habitNames || ["H1", "H2", "H3", "H4", "H5"];
       names.forEach(n => headerRow.push(`Habit: ${n}`));
       headerRow.push("Visit Fund", "ID");
       sheet.appendRow(headerRow);
       sheet.setFrozenRows(1);
    } else {
       // RENAME HABITS CHECK
       if (habitNames && habitNames.length === 5) {
           const headerRange = sheet.getRange(1, 1, 1, 8); 
           const currentHeaders = headerRange.getValues()[0];
           const expected = ["Date", ...habitNames.map(n => `Habit: ${n}`), "Visit Fund", "ID"];
           let changed = false;
           for(let i=1; i<=5; i++) {
               if (currentHeaders[i] !== expected[i]) { changed = true; break; }
           }
           if (changed) headerRange.setValues([expected]);
       }
    }

    // Update/Append Row
    const storedData = sheet.getDataRange().getValues();
    let targetRow = -1;
    const targetDateStr = new Date(date).toISOString().split('T')[0];

    for (let i = 1; i < storedData.length; i++) {
      let d = storedData[i][0];
      if (d instanceof Date) d = d.toISOString().split('T')[0];
      else d = String(d).split('T')[0];
      if (d === targetDateStr) { targetRow = i + 1; break; }
    }

    const rowData = [new Date(date), ...habits, visitFund, userId];
    if (targetRow > 0) sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    else sheet.appendRow(rowData);

    // --- B. UPDATE SETTINGS (_Members Sheet) ---
    // Update _Members with new Settings AND Habit Names
    let memSheet = ss.getSheetByName(MEMBERS_SHEET);
    if (!memSheet) {
        memSheet = ss.insertSheet(MEMBERS_SHEET);
        memSheet.appendRow(["UserID", "Name", "SettingsJSON", "LastUpdated", "HabitsJSON"]);
        memSheet.setFrozenRows(1);
    }

    const memData = memSheet.getDataRange().getValues();
    let memRow = -1;
    for (let i = 1; i < memData.length; i++) {
        if (String(memData[i][0]) === String(userId)) { memRow = i + 1; break; }
    }

    const settingsStr = settings ? JSON.stringify(settings) : "{}";
    const habitsStr = habitNames ? JSON.stringify(habitNames) : "[]";
    const timestamp = new Date();

    if (memRow > 0) {
        // Update existing user
        memSheet.getRange(memRow, 2).setValue(userName);
        if (settings) memSheet.getRange(memRow, 3).setValue(settingsStr);
        memSheet.getRange(memRow, 4).setValue(timestamp);
        if (habitNames) memSheet.getRange(memRow, 5).setValue(habitsStr);
    } else {
        // Create new user entry
        memSheet.appendRow([userId, userName, settingsStr, timestamp, habitsStr]);
    }

    return response({ status: 'success' });

  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
