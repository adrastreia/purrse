
/* =========================================
   PURRSE — JAVASCRIPT
   Handles transactions, summaries, storage,
   category options, and color themes.
   ========================================= */

// 1. CONNECT TO HTML ELEMENTS

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");

const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const formMessage = document.getElementById("formMessage");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");

const themeButton = document.getElementById("themeButton");


// 2. STORAGE KEYS

const STORAGE_KEY = "purrse-transactions-v1";
const THEME_KEY = "purrse-theme-v1";


// 3. TRANSACTION CATEGORIES

const categories = {
  income: [
    "Salary",
    "Allowance",
    "Tutoring",
    "Freelance",
    "Gift",
    "Refund",
    "Other income"
  ],

  expense: [
    "Food & Drinks",
    "Transportation",
    "Bills & Utilities",
    "Shopping",
    "Health & Personal Care",
    "Education",
    "Debt Payments",
    "Savings",
    "Other"
  ]
};


// 4. AVAILABLE COLOR THEMES

const themes = ["pink", "blue", "lavender", "matcha", "peach"];


// 5. FORMAT MONEY IN PHILIPPINE PESOS

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatMoney(amount) {
  return pesoFormatter.format(amount);
}


// 6. GET TODAY'S DATE

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// 7. LOAD SAVED TRANSACTIONS

function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData.filter((item) =>
      item &&
      typeof item.id === "string" &&
      (item.type === "income" || item.type === "expense") &&
      typeof item.amount === "number" &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      item.amount <= 1000000000 &&
      typeof item.category === "string" &&
      categories[item.type].includes(item.category) &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      typeof item.note === "string"
    );
  } catch (error) {
    console.error("Could not load Purrse data:", error);
    return [];
  }
}

let transactions = loadTransactions();


// 8. SAVE TRANSACTIONS TO THE BROWSER

function saveTransactions() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );

    return true;
  } catch (error) {
    console.error("Could not save Purrse data:", error);

    if (formMessage) {
      formMessage.textContent =
        "Unable to save. Check your browser storage settings.";
      formMessage.style.color = "var(--expense)";
    }

    return false;
  }
}


// 9. UPDATE CATEGORIES WHEN TYPE CHANGES

function updateCategories() {
  const selectedType = typeInput.value;
  const availableCategories = categories[selectedType] || [];

  categoryInput.replaceChildren();

  availableCategories.forEach((category) => {
    const option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    categoryInput.appendChild(option);
  });
}

// FIX: Refresh the category dropdown whenever
// the user switches between Income and Expense.
typeInput.addEventListener("change", () => {
  updateCategories();
  formMessage.textContent = "";
});


// 10. CALCULATE THE FINANCIAL SUMMARY

function updateSummary() {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else {
      totalExpenses += transaction.amount;
    }
  });

  const balance = totalIncome - totalExpenses;

  balanceDisplay.textContent = formatMoney(balance);
  incomeDisplay.textContent = formatMoney(totalIncome);
  expensesDisplay.textContent = formatMoney(totalExpenses);
}


// 11. FORMAT DATES FOR DISPLAY

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}


// 12. DISPLAY TRANSACTION HISTORY

function renderTransactions() {
  transactionList.replaceChildren();

  if (transactions.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const heart = document.createElement("div");
    heart.className = "empty-heart";
    heart.textContent = "♡";

    const heading = document.createElement("p");
    heading.textContent = "Your money journal is waiting.";

    const message = document.createElement("p");
    message.textContent =
      "Add your first income or expense to get started.";

    emptyState.append(heart, heading, message);
    transactionList.appendChild(emptyState);

    return;
  }

  // Show the newest transaction dates first.
  const sortedTransactions = [...transactions].sort((a, b) => {
    return b.date.localeCompare(a.date) ||
      (b.createdAt || 0) - (a.createdAt || 0);
  });

  sortedTransactions.forEach((transaction) => {
    const item = document.createElement("article");
    item.className = "transaction-item";

    // Income or expense symbol.
    const symbol = document.createElement("div");
    symbol.className = "transaction-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent =
      transaction.type === "income" ? "↗" : "↘";

    // Transaction details.
    const details = document.createElement("div");
    details.className = "transaction-details";

    const title = document.createElement("h3");
    title.textContent = transaction.note.trim()
      ? transaction.note
      : transaction.category;

    const description = document.createElement("p");
    description.textContent =
      `${transaction.category} · ${formatDate(transaction.date)}`;

    details.append(title, description);

    // Amount and delete button.
    const rightSide = document.createElement("div");
    rightSide.className = "transaction-right";

    const amount = document.createElement("span");
    amount.className =
      "transaction-amount " +
      (transaction.type === "income"
        ? "income-text"
        : "expense-text");

    const sign = transaction.type === "income" ? "+" : "−";
    amount.textContent = `${sign}${formatMoney(transaction.amount)}`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete transaction: ${title.textContent}`
    );

    deleteButton.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    rightSide.append(amount, deleteButton);
    item.append(symbol, details, rightSide);

    transactionList.appendChild(item);
  });
}


// 13. ADD A TRANSACTION

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = typeInput.value;
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  const note = noteInput.value.trim();

  // Validate the transaction type and category.
  if (
    !categories[type] ||
    !categories[type].includes(category)
  ) {
    formMessage.textContent = "Please choose a valid category.";
    formMessage.style.color = "var(--expense)";
    return;
  }

  // Validate the amount.
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1000000000
  ) {
    formMessage.textContent =
      "Enter an amount greater than ₱0 and no more than ₱1 billion.";
    formMessage.style.color = "var(--expense)";
    return;
  }

  // Validate the date.
  const dateParts = date.split("-").map(Number);

  const checkDate = new Date(
    dateParts[0],
    dateParts[1] - 1,
    dateParts[2]
  );

  const validDate =
    dateParts.length === 3 &&
    dateParts[0] >= 1000 &&
    checkDate.getFullYear() === dateParts[0] &&
    checkDate.getMonth() === dateParts[1] - 1 &&
    checkDate.getDate() === dateParts[2];

  if (!validDate) {
    formMessage.textContent = "Please enter a valid date.";
    formMessage.style.color = "var(--expense)";
    return;
  }

  // Round to two decimal places.
  const roundedAmount =
    Math.round((amount + Number.EPSILON) * 100) / 100;

  // Generate a unique transaction ID.
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const newTransaction = {
    id,
    type,
    amount: roundedAmount,
    category,
    date,
    note,
    createdAt: Date.now()
  };

  transactions.push(newTransaction);

  // Undo the change if saving fails.
  if (!saveTransactions()) {
    transactions.pop();
    return;
  }

  // Refresh the dashboard and history.
  updateSummary();
  renderTransactions();

  // Reset the form for the next entry.
  transactionForm.reset();

  typeInput.value = "expense";
  updateCategories();
  dateInput.value = getToday();

  formMessage.textContent = "Transaction added successfully! ♡";
  formMessage.style.color = "var(--income)";
});


// 14. DELETE A TRANSACTION

function deleteTransaction(id) {
  const transactionToDelete = transactions.find(
    (transaction) => transaction.id === id
  );

  if (!transactionToDelete) {
    return;
  }

  const confirmed = window.confirm(
    "Delete this transaction? This cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  const previousTransactions = transactions;

  transactions = transactions.filter(
    (transaction) => transaction.id !== id
  );

  // Restore the previous data if saving fails.
  if (!saveTransactions()) {
    transactions = previousTransactions;
    return;
  }

  updateSummary();
  renderTransactions();

  formMessage.textContent = "Transaction deleted.";
  formMessage.style.color = "var(--income)";
}


// 15. APPLY A COLOR THEME

function applyTheme(theme) {
  const selectedTheme = themes.includes(theme) ? theme : "pink";

  document.body.classList.remove(
    "blue",
    "lavender",
    "matcha",
    "peach"
  );

  // Pink is the default theme.
  if (selectedTheme !== "pink") {
    document.body.classList.add(selectedTheme);
  }

  themeButton.textContent =
    `Theme: ${selectedTheme.charAt(0).toUpperCase()}${selectedTheme.slice(1)}`;

  try {
    localStorage.setItem(THEME_KEY, selectedTheme);
  } catch (error) {
    console.error("Could not save theme preference:", error);
  }
}


// 16. SWITCH BETWEEN THEMES

themeButton.addEventListener("click", () => {
  let currentTheme = "pink";

  try {
    currentTheme = localStorage.getItem(THEME_KEY) || "pink";
  } catch (error) {
    console.error("Could not read theme preference:", error);
  }

  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;

  applyTheme(themes[nextIndex]);
});


// 17. INITIALIZE THE APP

// Load the correct categories for the default type.
updateCategories();

// Set the default date.
dateInput.value = getToday();

// Restore the saved theme.
try {
  applyTheme(localStorage.getItem(THEME_KEY) || "pink");
} catch (error) {
  applyTheme("pink");
}

// Display saved transactions and totals.
updateSummary();
renderTransactions();


// Register Purrse's service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => {
        console.log("Purrse service worker registered!");
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
