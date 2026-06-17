import { google } from "googleapis";

/**
 * Extracts the Sheet ID from a full Google Sheets URL.
 * e.g. https://docs.google.com/spreadsheets/d/ABC123/edit#gid=0 -> ABC123
 */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google service account credentials are not configured on the server."
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

/**
 * Reads the first sheet/tab and returns rows as an array of arrays.
 * Expects a header row. Used to import a roster (Name, Email, Enrollment No, Program).
 */
export async function readSheetRows(sheetId: string, range = "A:Z") {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values ?? [];
}

/**
 * Writes attendance data to a named tab. Creates the tab if it doesn't exist.
 * `rows` should include the header row as the first array.
 */
export async function writeAttendanceSheet(
  sheetId: string,
  tabName: string,
  rows: (string | number)[][]
) {
  const sheets = getSheetsClient();

  // Ensure the tab exists; create it if not.
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existingTab = meta.data.sheets?.find(
    (s) => s.properties?.title === tabName
  );

  if (!existingTab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
  }

  // Clear existing content in that tab, then write fresh data.
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `${tabName}`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}
