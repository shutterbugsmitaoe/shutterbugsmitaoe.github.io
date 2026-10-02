/**
 * ==========================================================================
 * Shutterbugs MITAOE — Recruitment 2026 Backend
 * Google Apps Script Web App for Google Sheets Integration
 * ==========================================================================
 * 
 * SPREADSHEET CONFIGURATION:
 * 1. Target Spreadsheet Name: "Shutterbugs MITAOE — Recruitment 2026"
 * 2. Target Sheet (Tab) Name: "Applications"
 * 
 * If this script is created via (Extensions > Apps Script) directly inside the
 * Google Sheet, it will automatically connect via getActiveSpreadsheet().
 * 
 * If this script is standalone, replace SPREADSHEET_ID below with your actual ID.
 */

// OPTIONAL: If standalone script, put your spreadsheet ID here:
// e.g. const SPREADSHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
const SPREADSHEET_ID = ""; 

const SHEET_NAME = "Applications";

// Expected columns in exact order
const SHEET_HEADERS = [
  "Submission Timestamp",
  "Full Name",
  "PRN",
  "College Email",
  "Phone Number",
  "Year",
  "Branch",
  "Creative Interests",
  "Experience Level",
  "Equipment",
  "Editing Software",
  "Portfolio URL",
  "Motivation",
  "Expected Contribution",
  "Availability",
  "Application Status"
];

/**
 * Handle HTTP POST requests from the website recruitment form.
 */
function doPost(e) {
  try {
    let data;
    
    // Parse incoming payload (supports application/json, text/plain, or form-urlencoded)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback to URL-encoded parameters if JSON parsing fails
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return createJsonResponse({
        status: "error",
        message: "No form data received."
      }, 400);
    }

    // 1. Server-side validation of required fields
    const validationError = validateRequiredFields(data);
    if (validationError) {
      return createJsonResponse({
        status: "error",
        message: validationError
      }, 400);
    }

    // 2. Sanitize and extract fields
    const timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    const fullName = sanitizeInput(data.fullName);
    const prn = sanitizeInput(data.prn);
    const collegeEmail = sanitizeInput(data.collegeEmail);
    const phoneNumber = sanitizeInput(data.phoneNumber);
    const year = sanitizeInput(data.year);
    const branch = sanitizeInput(data.branchOther ? `${data.branch} (${data.branchOther})` : data.branch);
    
    // Handle array or comma-separated creative interests
    const creativeInterests = Array.isArray(data.creativeInterests) 
      ? sanitizeInput(data.creativeInterests.join(", "))
      : sanitizeInput(data.creativeInterests || "");
      
    const experienceLevel = sanitizeInput(data.experienceLevel);
    
    // Handle array or comma-separated equipment
    const equipment = Array.isArray(data.equipment)
      ? sanitizeInput(data.equipment.join(", "))
      : sanitizeInput(data.equipment || "");
      
    const editingSoftware = sanitizeInput(data.editingSoftware || "None specified");
    const portfolioUrl = sanitizeInput(data.portfolioUrl || "N/A");
    const motivation = sanitizeInput(data.motivation);
    const expectedContribution = sanitizeInput(data.expectedContribution || "N/A");
    const availability = sanitizeInput(data.availability);
    const applicationStatus = "Pending";

    // 3. Connect to Sheet
    const sheet = getOrInitializeSheet();

    // 4. Check for duplicate PRN submission (prevent accidental duplicates)
    if (isDuplicatePrn(sheet, prn)) {
      return createJsonResponse({
        status: "error",
        message: "An application with this PRN has already been submitted. Please contact the team if you need to update it."
      }, 409);
    }

    // 5. Append row
    const newRow = [
      timestamp,
      fullName,
      prn,
      collegeEmail,
      phoneNumber,
      year,
      branch,
      creativeInterests,
      experienceLevel,
      equipment,
      editingSoftware,
      portfolioUrl,
      motivation,
      expectedContribution,
      availability,
      applicationStatus
    ];

    sheet.appendRow(newRow);

    return createJsonResponse({
      status: "success",
      message: "Application submitted successfully!",
      timestamp: timestamp
    }, 200);

  } catch (error) {
    Logger.log("Error processing recruitment submission: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: "Server error while processing submission. Please try again."
    }, 500);
  }
}

/**
 * Handle HTTP GET requests (ping / healthcheck / JSONP)
 */
function doGet(e) {
  // Simple health check endpoint
  const response = {
    status: "online",
    service: "Shutterbugs MITAOE Recruitment Backend",
    timestamp: new Date().toISOString()
  };
  return createJsonResponse(response, 200);
}

/**
 * Validates all required application fields
 */
function validateRequiredFields(d) {
  if (!d.fullName || d.fullName.toString().trim() === "") return "Full Name is required.";
  if (!d.prn || d.prn.toString().trim() === "") return "PRN is required.";
  
  if (!d.collegeEmail || !isValidEmail(d.collegeEmail.toString().trim())) {
    return "A valid College Email address is required.";
  }
  
  if (!d.phoneNumber || !isValidPhone(d.phoneNumber.toString().trim())) {
    return "A valid 10-digit Indian phone number is required.";
  }
  
  if (!d.year || d.year.toString().trim() === "") return "Year of Study is required.";
  if (!d.branch || d.branch.toString().trim() === "") return "Branch is required.";
  
  if (!d.creativeInterests || (Array.isArray(d.creativeInterests) && d.creativeInterests.length === 0)) {
    return "Please select at least one creative interest.";
  }
  
  if (!d.experienceLevel || d.experienceLevel.toString().trim() === "") {
    return "Experience level is required.";
  }
  
  if (!d.motivation || d.motivation.toString().trim() === "") {
    return "Motivation ('Why do you want to join Shutterbugs?') is required.";
  }
  
  if (d.motivation.toString().trim().length > 600) {
    return "Motivation text exceeds character limit.";
  }
  
  if (!d.availability || d.availability.toString().trim() === "") {
    return "Availability is required.";
  }
  
  if (d.consent !== true && d.consent !== "true" && d.consent !== "on") {
    return "Consent confirmation is required.";
  }
  
  return null;
}

/**
 * Basic email format validation
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates Indian phone number format (optional +91)
 */
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const regex = /^(\+91)?[6-9]\d{9}$/;
  return regex.test(cleaned);
}

/**
 * Sanitizes input to prevent spreadsheet formula injection (=, +, -, @)
 */
function sanitizeInput(val) {
  if (val === undefined || val === null) return "";
  let str = val.toString().trim();
  // Strip formula triggers
  if (/^[=+@-]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

/**
 * Checks if a PRN was already submitted in the spreadsheet
 */
function isDuplicatePrn(sheet, prn) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  // PRN is Column 3 (C)
  const prnValues = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
  const searchPrn = prn.toString().trim().toLowerCase();
  
  for (let i = 0; i < prnValues.length; i++) {
    if (prnValues[i][0] && prnValues[i][0].toString().trim().toLowerCase() === searchPrn) {
      return true;
    }
  }
  return false;
}

/**
 * Gets or initializes the 'Applications' worksheet with standard headers and formatting
 */
function getOrInitializeSheet() {
  let spreadsheet;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!spreadsheet) {
    throw new Error("Could not access Google Spreadsheet. Set SPREADSHEET_ID or bind script to the sheet.");
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  // If new or empty sheet, set up header row
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#FED136");
    headerRange.setFontColor("#000000");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-fit column widths reasonably
    for (let c = 1; c <= SHEET_HEADERS.length; c++) {
      sheet.setColumnWidth(c, 160);
    }
    sheet.setColumnWidth(1, 170); // Timestamp
    sheet.setColumnWidth(8, 220); // Interests
    sheet.setColumnWidth(13, 260); // Motivation
  }

  return sheet;
}

/**
 * Helper to construct JSON response with CORS headers
 */
function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
