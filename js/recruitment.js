/**
 * ==========================================================================
 * Shutterbugs MITAOE — Recruitment Form Handling & Google Sheets Integration
 * ==========================================================================
 */

// Configuration - Update this URL with your deployed Google Apps Script Web App URL
window.SHUTTERBUGS_CONFIG = {
  // Example: "https://script.google.com/macros/s/AKfycb.../exec"
  googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycbzXwzY_9EdVsPYYSpQ0DRuOXwKyx5_SDyQ08HbB4lfsw1Ep4IZh9mmK43h0VpqIkvuM/exec"
};

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("recruitmentForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitApplicationBtn");
    const submitBtnSpinner = document.getElementById("submitBtnSpinner");
    const submitBtnText = document.getElementById("submitBtnText");
    const successAlert = document.getElementById("submissionSuccessAlert");
    const errorAlert = document.getElementById("submissionErrorAlert");
    const errorMessageText = document.getElementById("errorMessageText");
    const branchSelect = document.getElementById("branch");
    const branchOtherGroup = document.getElementById("branchOtherGroup");
    const branchOtherInput = document.getElementById("branchOther");

    // Motivation character counters
    setupCharCounter("motivation", "motivationCharCount", 500);
    setupCharCounter("expectedContribution", "contributionCharCount", 500);

    // Dynamic "Other" Branch field handling
    if (branchSelect && branchOtherGroup) {
      branchSelect.addEventListener("change", function () {
        if (this.value === "Other") {
          branchOtherGroup.style.display = "block";
          if (branchOtherInput) branchOtherInput.focus();
        } else {
          branchOtherGroup.style.display = "none";
          if (branchOtherInput) branchOtherInput.value = "";
        }
      });
    }

    // Clear field errors on input
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        clearFieldError(this);
      });
      input.addEventListener("change", function () {
        clearFieldError(this);
      });
    });

    // Form submission handler
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Reset alert states
      if (errorAlert) errorAlert.style.display = "none";
      if (successAlert) successAlert.style.display = "none";

      // 1. Client-Side Validation
      const isValid = validateRecruitmentForm();
      if (!isValid) {
        const firstError = form.querySelector(".is-invalid, .has-error input, .has-error");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          if (typeof firstError.focus === "function") firstError.focus();
        }
        return;
      }

      // 2. Gather form data
      const formData = gatherFormData();

      // 3. Disable submit button & show loading indicator
      setSubmittingState(true);

      const scriptUrl = (window.SHUTTERBUGS_CONFIG && window.SHUTTERBUGS_CONFIG.googleAppsScriptUrl)
        ? window.SHUTTERBUGS_CONFIG.googleAppsScriptUrl.trim()
        : "";

      try {
        if (!scriptUrl) {
          // If no Apps Script URL is configured yet, simulate successful submission for testing
          console.warn(
            "[Shutterbugs Recruitment] No Google Apps Script URL set in window.SHUTTERBUGS_CONFIG.googleAppsScriptUrl. Simulating submission payload:",
            formData
          );

          // Simulated network delay (800ms)
          await new Promise(resolve => setTimeout(resolve, 800));

          showSuccessState();
          return;
        }

        // Send submission to Google Apps Script Web App
        // Using 'text/plain;charset=utf-8' prevents CORS preflight OPTIONS request on Google Apps Script
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result && result.status === "success") {
          showSuccessState();
        } else {
          const errorMsg = (result && result.message) ? result.message : "Unable to submit application. Please check details and retry.";
          showErrorState(errorMsg);
        }

      } catch (err) {
        console.error("[Shutterbugs Recruitment] Submission Error:", err);
        showErrorState("Network or server connection error. Your entered details have been saved, please try submitting again.");
      } finally {
        setSubmittingState(false);
      }
    });

    /**
     * Helper: Sets up live character counter for a textarea
     */
    function setupCharCounter(inputId, counterId, maxLen) {
      const field = document.getElementById(inputId);
      const counter = document.getElementById(counterId);
      if (!field || !counter) return;

      const updateCount = function () {
        const len = field.value.length;
        counter.textContent = `${len} / ${maxLen}`;
        if (len > maxLen) {
          counter.classList.add("text-danger");
        } else {
          counter.classList.remove("text-danger");
        }
      };

      field.addEventListener("input", updateCount);
      updateCount();
    }

    /**
     * Helper: Validates all recruitment form fields
     */
    function validateRecruitmentForm() {
      let valid = true;

      // Full Name
      const fullName = document.getElementById("fullName");
      if (!fullName.value.trim()) {
        markFieldError(fullName, "Please enter your full name.");
        valid = false;
      } else {
        clearFieldError(fullName);
      }

      // PRN (Permanent Registration Number - alphanumeric)
      const prn = document.getElementById("prn");
      const prnRegex = /^[A-Za-z0-9\-_]{4,20}$/;
      if (!prn.value.trim()) {
        markFieldError(prn, "Please enter your PRN.");
        valid = false;
      } else if (!prnRegex.test(prn.value.trim())) {
        markFieldError(prn, "Please enter a valid PRN number (alphanumeric).");
        valid = false;
      } else {
        clearFieldError(prn);
      }

      // College Email Address
      const email = document.getElementById("collegeEmail");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim()) {
        markFieldError(email, "Please enter your college email address.");
        valid = false;
      } else if (!emailRegex.test(email.value.trim())) {
        markFieldError(email, "Please enter a valid email address (e.g., student@mitaoe.ac.in).");
        valid = false;
      } else {
        clearFieldError(email);
      }

      // Phone Number (10 digits Indian mobile, optional +91)
      const phone = document.getElementById("phoneNumber");
      const cleanedPhone = phone.value.replace(/[\s\-\(\)]/g, "");
      const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
      if (!phone.value.trim()) {
        markFieldError(phone, "Please enter your mobile phone number.");
        valid = false;
      } else if (!phoneRegex.test(cleanedPhone)) {
        markFieldError(phone, "Please enter a valid 10-digit Indian phone number.");
        valid = false;
      } else {
        clearFieldError(phone);
      }

      // Year of Study
      const year = document.getElementById("year");
      if (!year.value) {
        markFieldError(year, "Please select your year of study.");
        valid = false;
      } else {
        clearFieldError(year);
      }

      // Branch
      const branch = document.getElementById("branch");
      if (!branch.value) {
        markFieldError(branch, "Please select your branch.");
        valid = false;
      } else if (branch.value === "Other") {
        if (!branchOtherInput.value.trim()) {
          markFieldError(branchOtherInput, "Please specify your branch.");
          valid = false;
        } else {
          clearFieldError(branchOtherInput);
        }
        clearFieldError(branch);
      } else {
        clearFieldError(branch);
      }

      // Creative Interests (checkboxes - at least one required)
      const interestsChecked = form.querySelectorAll("input[name='creativeInterests']:checked");
      const interestsGroup = document.getElementById("interestsGroup");
      if (interestsChecked.length === 0) {
        markGroupError(interestsGroup, "Please select at least one area of interest.");
        valid = false;
      } else {
        clearGroupError(interestsGroup);
      }

      // Experience Level (radios - required)
      const expChecked = form.querySelector("input[name='experienceLevel']:checked");
      const expGroup = document.getElementById("experienceGroup");
      if (!expChecked) {
        markGroupError(expGroup, "Please select your previous experience level.");
        valid = false;
      } else {
        clearGroupError(expGroup);
      }

      // Portfolio / Instagram URL (optional, but validate format if provided)
      const portfolio = document.getElementById("portfolioUrl");
      if (portfolio && portfolio.value.trim()) {
        const urlVal = portfolio.value.trim();
        // Allow URLs with or without http(s)://
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        if (!urlRegex.test(urlVal) && !urlVal.includes("instagram.com/")) {
          markFieldError(portfolio, "Please enter a valid URL or Instagram profile link.");
          valid = false;
        } else {
          clearFieldError(portfolio);
        }
      } else if (portfolio) {
        clearFieldError(portfolio);
      }

      // Motivation (required, max 500 chars)
      const motivation = document.getElementById("motivation");
      if (!motivation.value.trim()) {
        markFieldError(motivation, "Please share why you want to join Shutterbugs.");
        valid = false;
      } else if (motivation.value.length > 500) {
        markFieldError(motivation, "Motivation must be 500 characters or fewer.");
        valid = false;
      } else {
        clearFieldError(motivation);
      }

      // Expected Contribution (optional, max 500 chars)
      const contribution = document.getElementById("expectedContribution");
      if (contribution && contribution.value.length > 500) {
        markFieldError(contribution, "Must be 500 characters or fewer.");
        valid = false;
      } else if (contribution) {
        clearFieldError(contribution);
      }

      // Availability (radios - required)
      const availChecked = form.querySelector("input[name='availability']:checked");
      const availGroup = document.getElementById("availabilityGroup");
      if (!availChecked) {
        markGroupError(availGroup, "Please select your availability.");
        valid = false;
      } else {
        clearGroupError(availGroup);
      }

      // Consent (required checkbox)
      const consent = document.getElementById("consent");
      const consentGroup = document.getElementById("consentGroup");
      if (!consent.checked) {
        markGroupError(consentGroup, "You must confirm and agree before submitting.");
        valid = false;
      } else {
        clearGroupError(consentGroup);
      }

      return valid;
    }

    /**
     * Helper: Marks a field invalid and displays error text
     */
    function markFieldError(el, msg) {
      if (!el) return;
      el.classList.add("is-invalid");
      const parent = el.closest(".form-group");
      if (parent) {
        let errEl = parent.querySelector(".field-error-message");
        if (!errEl) {
          errEl = document.createElement("div");
          errEl.className = "field-error-message";
          parent.appendChild(errEl);
        }
        errEl.textContent = msg;
        errEl.style.display = "block";
      }
    }

    /**
     * Helper: Clears validation error on a field
     */
    function clearFieldError(el) {
      if (!el) return;
      el.classList.remove("is-invalid");
      const parent = el.closest(".form-group");
      if (parent) {
        const errEl = parent.querySelector(".field-error-message");
        if (errEl) errEl.style.display = "none";
      }
    }

    /**
     * Helper: Marks a checkbox/radio group invalid
     */
    function markGroupError(group, msg) {
      if (!group) return;
      group.classList.add("has-error");
      let errEl = group.querySelector(".field-error-message");
      if (!errEl) {
        errEl = document.createElement("div");
        errEl.className = "field-error-message";
        group.appendChild(errEl);
      }
      errEl.textContent = msg;
      errEl.style.display = "block";
    }

    /**
     * Helper: Clears validation error on a group
     */
    function clearGroupError(group) {
      if (!group) return;
      group.classList.remove("has-error");
      const errEl = group.querySelector(".field-error-message");
      if (errEl) errEl.style.display = "none";
    }

    /**
     * Helper: Gathers form data into payload object
     */
    function gatherFormData() {
      const interests = Array.from(
        form.querySelectorAll("input[name='creativeInterests']:checked")
      ).map(cb => cb.value);

      const equipment = Array.from(
        form.querySelectorAll("input[name='equipment']:checked")
      ).map(cb => cb.value);

      const expEl = form.querySelector("input[name='experienceLevel']:checked");
      const availEl = form.querySelector("input[name='availability']:checked");

      return {
        fullName: document.getElementById("fullName").value.trim(),
        prn: document.getElementById("prn").value.trim(),
        collegeEmail: document.getElementById("collegeEmail").value.trim(),
        phoneNumber: document.getElementById("phoneNumber").value.trim(),
        year: document.getElementById("year").value,
        branch: document.getElementById("branch").value,
        branchOther: branchOtherInput ? branchOtherInput.value.trim() : "",
        creativeInterests: interests,
        experienceLevel: expEl ? expEl.value : "",
        equipment: equipment,
        editingSoftware: document.getElementById("editingSoftware").value.trim(),
        portfolioUrl: document.getElementById("portfolioUrl").value.trim(),
        motivation: document.getElementById("motivation").value.trim(),
        expectedContribution: document.getElementById("expectedContribution").value.trim(),
        availability: availEl ? availEl.value : "",
        consent: document.getElementById("consent").checked
      };
    }

    /**
     * Helper: Controls submit button loading and disabled states
     */
    function setSubmittingState(isSubmitting) {
      if (isSubmitting) {
        submitBtn.disabled = true;
        if (submitBtnSpinner) submitBtnSpinner.style.display = "inline-block";
        if (submitBtnText) submitBtnText.textContent = "SUBMITTING...";
      } else {
        submitBtn.disabled = false;
        if (submitBtnSpinner) submitBtnSpinner.style.display = "none";
        if (submitBtnText) submitBtnText.textContent = "SUBMIT APPLICATION";
      }
    }

    /**
     * Helper: Displays the confirmed application success state
     */
    function showSuccessState() {
      // Hide form fields to prevent duplicate submission
      const formFieldsContainer = document.getElementById("recruitmentFormFields");
      if (formFieldsContainer) {
        formFieldsContainer.style.display = "none";
      }

      if (successAlert) {
        successAlert.style.display = "block";
        successAlert.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    /**
     * Helper: Displays friendly error message preserving form input
     */
    function showErrorState(msg) {
      if (errorAlert) {
        if (errorMessageText) {
          errorMessageText.textContent = msg;
        }
        errorAlert.style.display = "block";
        errorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        alert(msg);
      }
    }
  });
})();
