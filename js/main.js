document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "umoja_chama_members_v1";

  // Seed initial sample Chama members if localStorage is empty
  const defaultMembers = [
    { memberNo: "CHM-001", name: "Mary Njeri", phone: "0712345678", savings: 24000 },
    { memberNo: "CHM-002", name: "David Ochieng", phone: "0723456789", savings: 18000 },
    { memberNo: "CHM-003", name: "Faith Chebet", phone: "0734567890", savings: 30000 },
    { memberNo: "CHM-004", name: "Samuel Mutua", phone: "0701234567", savings: 12000 },
  ];

  function getMembers() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMembers));
      return [...defaultMembers];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...defaultMembers];
    }
  }

  function saveMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }

  function formatKES(amount) {
    return "KES " + Number(amount || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 });
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 1. Dynamic footer year & responsive nav toggle
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // 2. Home Page Live Snapshot (index.html)
  const homeMemberCount = document.getElementById("homeMemberCount");
  if (homeMemberCount) {
    const members = getMembers();
    const totalSavings = members.reduce((sum, m) => sum + Number(m.savings), 0);
    homeMemberCount.textContent = members.length;
    document.getElementById("homeTotalSavings").textContent = formatKES(totalSavings);
    document.getElementById("homeLoanCapacity").textContent = formatKES(totalSavings * 0.8);
  }

  // 3. Member Record Keeping Page (members.html)
  const memberForm = document.getElementById("memberForm");
  const memberTableBody = document.getElementById("memberTableBody");
  if (memberForm && memberTableBody) {
    const memberNoInput = document.getElementById("memberNo");
    const memberNameInput = document.getElementById("memberName");
    const memberPhoneInput = document.getElementById("memberPhone");
    const savingsInput = document.getElementById("savingsAmount");
    const searchInput = document.getElementById("memberSearch");
    const resetBtn = document.getElementById("memberResetBtn");

    function setError(input, errId, msg) {
      const el = document.getElementById(errId);
      if (el) el.textContent = msg;
      if (input) input.classList.toggle("input-error", Boolean(msg));
    }

    function renderLedger(filterText = "") {
      const members = getMembers();
      const query = filterText.trim().toLowerCase();
      const filtered = members.filter(
        (m) =>
          m.name.toLowerCase().includes(query) || m.memberNo.toLowerCase().includes(query)
      );

      memberTableBody.innerHTML = "";
      if (filtered.length === 0) {
        memberTableBody.innerHTML = `<tr><td colspan="6">No matching member records found.</td></tr>`;
      } else {
        filtered.forEach((m) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><strong>${escapeHTML(m.memberNo)}</strong></td>
            <td>${escapeHTML(m.name)}</td>
            <td>${escapeHTML(m.phone)}</td>
            <td>${formatKES(m.savings)}</td>
            <td>${formatKES(m.savings * 3)}</td>
            <td><button type="button" class="btn-delete" data-id="${escapeHTML(m.memberNo)}">Remove</button></td>
          `;
          memberTableBody.appendChild(tr);
        });
      }

      const totalSavings = members.reduce((sum, m) => sum + Number(m.savings), 0);
      document.getElementById("asideMemberCount").textContent = members.length;
      document.getElementById("asideTotalSavings").textContent = formatKES(totalSavings);
      document.getElementById("asideBorrowPower").textContent = formatKES(totalSavings * 3);
    }

    memberTableBody.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-delete")) {
        const idToRemove = e.target.getAttribute("data-id");
        const updated = getMembers().filter((m) => m.memberNo !== idToRemove);
        saveMembers(updated);
        renderLedger(searchInput ? searchInput.value : "");
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => renderLedger(searchInput.value));
    }

    memberForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      const noVal = memberNoInput.value.trim().toUpperCase();
      const nameVal = memberNameInput.value.trim();
      const phoneVal = memberPhoneInput.value.trim().replace(/\s+/g, "");
      const savingsVal = Number(savingsInput.value);

      if (noVal.length < 3) {
        setError(memberNoInput, "memberNoError", "Enter a valid member ID (e.g., CHM-005).");
        valid = false;
      } else {
        setError(memberNoInput, "memberNoError", "");
      }

      if (nameVal.length < 3) {
        setError(memberNameInput, "memberNameError", "Enter the member's full name.");
        valid = false;
      } else {
        setError(memberNameInput, "memberNameError", "");
      }

      if (!/^(?:\+254|0)[17]\d{8}$/.test(phoneVal)) {
        setError(memberPhoneInput, "memberPhoneError", "Enter a valid Kenyan phone number.");
        valid = false;
      } else {
        setError(memberPhoneInput, "memberPhoneError", "");
      }

      if (!savingsVal || savingsVal < 500) {
        setError(savingsInput, "savingsAmountError", "Minimum contribution is KES 500.");
        valid = false;
      } else {
        setError(savingsInput, "savingsAmountError", "");
      }

      if (!valid) return;

      const members = getMembers();
      const existingIndex = members.findIndex((m) => m.memberNo === noVal);
      if (existingIndex >= 0) {
        // Top up existing member's savings
        members[existingIndex].name = nameVal;
        members[existingIndex].phone = phoneVal;
        members[existingIndex].savings += savingsVal;
      } else {
        members.push({ memberNo: noVal, name: nameVal, phone: phoneVal, savings: savingsVal });
      }

      saveMembers(members);
      memberForm.reset();
      renderLedger();
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        setError(memberNoInput, "memberNoError", "");
        setError(memberNameInput, "memberNameError", "");
        setError(memberPhoneInput, "memberPhoneError", "");
        setError(savingsInput, "savingsAmountError", "");
      });
    }

    renderLedger();
  }

  // 4. Chama Loan Calculator & Application Form (loans.html)
  const loanForm = document.getElementById("loanForm");
  if (loanForm) {
    const applicantSelect = document.getElementById("applicantSelect");
    const eligibilityInput = document.getElementById("memberEligibility");
    const savingsHint = document.getElementById("memberSavingsHint");
    const loanAmountInput = document.getElementById("loanAmount");
    const monthsSelect = document.getElementById("repaymentMonths");
    const interestSelect = document.getElementById("interestType");
    const guarantorInput = document.getElementById("guarantorName");
    const purposeInput = document.getElementById("loanPurpose");
    const agreeInput = document.getElementById("loanAgree");
    const summaryBox = document.getElementById("loanSummaryBox");
    const loanResetBtn = document.getElementById("loanResetBtn");

    const members = getMembers();
    members.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.memberNo;
      opt.textContent = `${m.memberNo} — ${m.name} (Savings: ${formatKES(m.savings)})`;
      applicantSelect.appendChild(opt);
    });

    function getSelectedMember() {
      return getMembers().find((m) => m.memberNo === applicantSelect.value) || null;
    }

    function calculateLoan() {
      const principal = Math.max(0, Number(loanAmountInput.value) || 0);
      const months = Number(monthsSelect.value) || 6;
      const type = interestSelect.value;

      let totalInterest = 0;
      if (principal > 0) {
        if (type === "flat") {
          totalInterest = principal * 0.1; // 10% flat rate
        } else {
          // 1.5% monthly reducing balance approximation
          totalInterest = principal * 0.015 * ((months + 1) / 2);
        }
      }

      const totalRepayable = principal + totalInterest;
      const monthlyInstallment = months > 0 ? totalRepayable / months : 0;

      document.getElementById("calcPrincipal").textContent = formatKES(principal);
      document.getElementById("calcInterest").textContent = formatKES(totalInterest);
      document.getElementById("calcTotal").textContent = formatKES(totalRepayable);
      document.getElementById("calcMonthly").textContent = formatKES(monthlyInstallment);

      return { principal, months, totalInterest, totalRepayable, monthlyInstallment };
    }

    function setLoanError(inputEl, errId, msg) {
      const errEl = document.getElementById(errId);
      if (errEl) errEl.textContent = msg;
      if (inputEl && inputEl.type !== "checkbox") {
        inputEl.classList.toggle("input-error", Boolean(msg));
      }
    }

    applicantSelect.addEventListener("change", () => {
      const member = getSelectedMember();
      if (member) {
        const maxLoan = member.savings * 3;
        eligibilityInput.value = formatKES(maxLoan);
        savingsHint.textContent = `Current savings: ${formatKES(member.savings)} (3x limit applies).`;
      } else {
        eligibilityInput.value = "KES 0";
        savingsHint.textContent = "Select a member to view savings.";
      }
      calculateLoan();
    });

    [loanAmountInput, monthsSelect, interestSelect].forEach((el) => {
      el.addEventListener("input", calculateLoan);
      el.addEventListener("change", calculateLoan);
    });

    loanForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let isValid = true;
      const member = getSelectedMember();
      const { principal, months, totalRepayable, monthlyInstallment } = calculateLoan();

      if (!member) {
        setLoanError(applicantSelect, "applicantError", "Please select a registered Chama member.");
        isValid = false;
      } else {
        setLoanError(applicantSelect, "applicantError", "");
      }

      const maxAllowed = member ? member.savings * 3 : 0;
      if (!principal || principal < 1000) {
        setLoanError(loanAmountInput, "loanAmountError", "Enter a loan amount of at least KES 1,000.");
        isValid = false;
      } else if (member && principal > maxAllowed) {
        setLoanError(
          loanAmountInput,
          "loanAmountError",
          `Amount exceeds member's 3x limit (${formatKES(maxAllowed)}).`
        );
        isValid = false;
      } else {
        setLoanError(loanAmountInput, "loanAmountError", "");
      }

      if (guarantorInput.value.trim().length < 3) {
        setLoanError(guarantorInput, "guarantorError", "Enter a valid co-member guarantor name.");
        isValid = false;
      } else {
        setLoanError(guarantorInput, "guarantorError", "");
      }

      if (purposeInput.value.trim().length < 10) {
        setLoanError(purposeInput, "purposeError", "Provide at least 10 characters explaining loan purpose.");
        isValid = false;
      } else {
        setLoanError(purposeInput, "purposeError", "");
      }

      if (!agreeInput.checked) {
        setLoanError(agreeInput, "agreeError", "You must accept the Chama lending bylaws.");
        isValid = false;
      } else {
        setLoanError(agreeInput, "agreeError", "");
      }

      if (!isValid) {
        summaryBox.classList.add("hidden");
        return;
      }

      const ticketNo = "LN-" + Math.floor(1000 + Math.random() * 9000);
      summaryBox.innerHTML = `
        <h2>Loan Application Logged (${ticketNo})</h2>
        <p>Applicant: <strong>${escapeHTML(member.name)} (${escapeHTML(member.memberNo)})</strong></p>
        <ul>
          <li><strong>Approved Principal:</strong> ${formatKES(principal)} (Within ${formatKES(maxAllowed)} limit)</li>
          <li><strong>Repayment Plan:</strong> ${months} months @ ${formatKES(monthlyInstallment)} / month</li>
          <li><strong>Total Repayable:</strong> ${formatKES(totalRepayable)}</li>
          <li><strong>Guarantor:</strong> ${escapeHTML(guarantorInput.value.trim())}</li>
          <li><strong>Purpose:</strong> ${escapeHTML(purposeInput.value.trim())}</li>
        </ul>
      `;
      summaryBox.classList.remove("hidden");
      summaryBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    if (loanResetBtn) {
      loanResetBtn.addEventListener("click", () => {
        eligibilityInput.value = "KES 0";
        savingsHint.textContent = "Select a member to view savings.";
        setLoanError(applicantSelect, "applicantError", "");
        setLoanError(loanAmountInput, "loanAmountError", "");
        setLoanError(guarantorInput, "guarantorError", "");
        setLoanError(purposeInput, "purposeError", "");
        setLoanError(agreeInput, "agreeError", "");
        summaryBox.classList.add("hidden");
        setTimeout(calculateLoan, 0);
      });
    }
  }
});