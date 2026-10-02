# Shutterbugs MITAOE — Recruitment 2026 Google Sheets Setup

This guide provides instructions to connect the native recruitment application form on the Shutterbugs MITAOE website to Google Sheets using Google Apps Script.

---

## 1. Create the Google Spreadsheet

1. Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Name the spreadsheet:
   ```
   Shutterbugs MITAOE — Recruitment 2026
   ```
3. Rename the first sheet tab from `Sheet1` to:
   ```
   Applications
   ```
*(The script will automatically set up all 16 formatted column headers when the first submission arrives, or you can paste the headers manually as listed below).*

---

## 2. Column Structure in the `Applications` Sheet

The sheet stores applications across 16 columns in the exact order below:

| Col # | Column Header | Description |
|:-----:|:--------------|:------------|
| **A** | `Submission Timestamp` | Date and time (Asia/Kolkata) |
| **B** | `Full Name` | Student's full name |
| **C** | `PRN` | Permanent Registration Number |
| **D** | `College Email` | Student's institutional email |
| **E** | `Phone Number` | WhatsApp / Contact number |
| **F** | `Year` | FY / SY / TY / Final Year |
| **G** | `Branch` | Department (Computer, IT, ENTC, etc.) |
| **H** | `Creative Interests` | Selected areas (Photography, Cinematography, etc.) |
| **I** | `Experience Level` | Beginner, Experienced, etc. |
| **J** | `Equipment` | Smartphone, DSLR, Mirrorless, etc. |
| **K** | `Editing Software` | Software tools used |
| **L** | `Portfolio URL` | Instagram profile or portfolio link |
| **M** | `Motivation` | Why they want to join Shutterbugs |
| **N** | `Expected Contribution` | Skills they'd like to learn or bring |
| **O** | `Availability` | Availability for events and activities |
| **P** | `Application Status` | Defaults to **Pending** |

---

## 3. Add Google Apps Script Code

1. In your Google Sheet, click **Extensions** in the top menu bar $\rightarrow$ **Apps Script**.
2. Delete any boilerplate code inside `Code.gs`.
3. Open [`recruitment-backend.gs`](file:///c:/Shutterbugs%20MITAOE%20Website/recruitment-backend.gs) in this project, copy all its code, and paste it into `Code.gs`.
4. Click the **Save** (💾) icon or press `Ctrl + S`.
5. Rename the Apps Script project to `Shutterbugs Recruitment Backend 2026`.

---

## 4. Deploy as a Web App

1. In the upper-right corner of the Apps Script editor, click **Deploy** $\rightarrow$ **New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and select **Web app**.
3. Fill in the deployment details:
   - **Description:** `Shutterbugs Recruitment Production Web App`
   - **Execute as:** `Me (your email address)`
   - **Who has access:** `Anyone` *(Crucial: allows students to submit without Google login, while keeping sheet edit permissions private to the club)*
4. Click **Deploy**.
5. If prompted, click **Authorize access**, choose your Google account, click **Advanced** $\rightarrow$ **Go to Shutterbugs Recruitment Backend (unsafe)**, and click **Allow**.
6. Google will generate a **Web App URL** looking like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
7. Copy this URL.

---

## 5. Configure the Web App URL in Website Code

Open [`js/recruitment.js`](file:///c:/Shutterbugs%20MITAOE%20Website/js/recruitment.js) and update the configuration at the top:

```javascript
window.SHUTTERBUGS_CONFIG = {
  // Paste your deployed Google Apps Script Web App URL below:
  googleAppsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
};
```

That's it! Submissions from the website will now be automatically validated, sanitized, and stored as new rows in your private Google Sheet.
