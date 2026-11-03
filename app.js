// @ts-nocheck
/* ================================================
   FINTRACK — COMPLETE PERSONAL FINANCE SUITE
   17-Feature Full Stack Client-Side Architecture
   ================================================ */

// ================================================
// 0. CONSTANTS & CATEGORY CONFIG
// ================================================
const INCOME_CATEGORIES = [
  { id: 'salary',     label: 'Salary',     icon: 'fas fa-building-columns', color: '#10b981' },
  { id: 'freelance',  label: 'Freelance',  icon: 'fas fa-laptop-code',      color: '#6c63ff' },
  { id: 'business',   label: 'Business',   icon: 'fas fa-briefcase',        color: '#06b6d4' },
  { id: 'investment', label: 'Investment', icon: 'fas fa-chart-line',       color: '#f59e0b' },
  { id: 'gift',       label: 'Gift',       icon: 'fas fa-gift',             color: '#8b5cf6' },
  { id: 'other_in',   label: 'Other',      icon: 'fas fa-plus-circle',      color: '#94a3b8' },
];

const EXPENSE_CATEGORIES = [
  { id: 'housing',       label: 'Housing',       icon: 'fas fa-home',             color: '#6c63ff' },
  { id: 'food',          label: 'Food',          icon: 'fas fa-utensils',         color: '#06b6d4' },
  { id: 'transport',     label: 'Transport',     icon: 'fas fa-car',              color: '#f59e0b' },
  { id: 'shopping',      label: 'Shopping',      icon: 'fas fa-bag-shopping',     color: '#f43f5e' },
  { id: 'health',        label: 'Health',        icon: 'fas fa-heart-pulse',      color: '#10b981' },
  { id: 'utilities',     label: 'Utilities',     icon: 'fas fa-bolt',             color: '#f97316' },
  { id: 'entertainment', label: 'Entertainment', icon: 'fas fa-tv',               color: '#ec4899' },
  { id: 'education',     label: 'Education',     icon: 'fas fa-graduation-cap',   color: '#3b82f6' },
  { id: 'other_ex',      label: 'Other',         icon: 'fas fa-ellipsis',         color: '#94a3b8' },
];

const ALL_CATS = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CURRENCIES = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
};

function getCatInfo(catId) {
  return ALL_CATS.find(c => c.id === catId) || { label: catId || 'General', icon: 'fas fa-circle', color: '#94a3b8' };
}

// ================================================
// TOAST NOTIFICATIONS HELPER
// ================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ================================================
// 1. AUTHENTICATION & MULTI-USER STATE MANAGEMENT
// ================================================
let accounts       = loadRawData('ft_accounts', []);
let currentSession = localStorage.getItem('ft_current_session') || null;

function loadRawData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function saveRawData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function getUserKey(key) {
  const userEmail = currentSession || 'guest@fintrack.app';
  return `${key}_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

function loadUserData(key, fallback) {
  const userKey = getUserKey(key);
  const data = localStorage.getItem(userKey);
  if (data !== null) {
    try { return JSON.parse(data); } catch { return fallback; }
  }
  // Migration check for single-user legacy data
  const oldData = localStorage.getItem(key);
  if (oldData !== null) {
    try {
      const parsed = JSON.parse(oldData);
      saveUserData(key, parsed);
      return parsed;
    } catch { return fallback; }
  }
  return fallback;
}

function saveUserData(key, val) {
  localStorage.setItem(getUserKey(key), JSON.stringify(val));
}

function saveData(key, val) {
  saveUserData(key, val);
}

let transactions    = [];
let budgets         = {};
let goals           = [];
let debts           = [];
let bills           = [];
let userProfile     = { name: 'User', role: 'Personal Account', incomeTarget: 60000, pinEnabled: false, pin: '' };
let currentCurrency = 'INR';
let currentAccent   = 'purple';

function reloadCurrentUserData() {
  transactions    = loadUserData('ft_transactions', []);
  budgets         = loadUserData('ft_budgets', { housing: 15000, food: 10000, transport: 5000, shopping: 5000 });
  goals           = loadUserData('ft_goals', []);
  debts           = loadUserData('ft_debts', []);
  bills           = loadUserData('ft_bills', []);

  const currentUserObj = accounts.find(a => a.email.toLowerCase() === (currentSession || '').toLowerCase());
  const defaultName = currentUserObj ? currentUserObj.name : (currentSession === 'guest@fintrack.app' ? 'Guest User' : 'Asad Ullah');
  const defaultRole = currentSession === 'guest@fintrack.app' ? 'Guest Sandbox Account' : 'Personal Account';

  userProfile = loadUserData('ft_user', { name: defaultName, role: defaultRole, incomeTarget: 60000, pinEnabled: false, pin: '' });
  currentCurrency = loadUserData('ft_currency', 'INR');
  currentAccent   = loadUserData('ft_accent', 'purple');

  document.documentElement.setAttribute('data-accent', currentAccent);
  if (currencySelect) currencySelect.value = currentCurrency;
  const prefixEl = document.getElementById('formCurrencyPrefix');
  if (prefixEl) prefixEl.textContent = (CURRENCIES[currentCurrency] || CURRENCIES.INR).symbol;

  document.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('active', d.getAttribute('data-accent') === currentAccent);
  });

  updateUserProfileUI();
  populateBillCategories();
}

// ================================================
// 2. PWA SERVICE WORKER REGISTRATION
// ================================================
if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg error:', err));
  });
}

// ================================================
// 3. CURRENCY & FORMATTING ENGINE
// ================================================
const currencySelect = document.getElementById('currencySelect');

currencySelect.addEventListener('change', (e) => {
  currentCurrency = e.target.value;
  saveUserData('ft_currency', currentCurrency);
  const prefixEl = document.getElementById('formCurrencyPrefix');
  if (prefixEl) prefixEl.textContent = (CURRENCIES[currentCurrency] || CURRENCIES.INR).symbol;
  
  refreshDashboard();
  if (currentPage === 'transactions') renderTxnTable();
  if (currentPage === 'budget')       renderBudgetEditor();
  if (currentPage === 'savings')      renderSavingsGoals();
  if (currentPage === 'debts')        renderDebts();
  if (currentPage === 'bills')        renderBills();
  if (currentPage === 'calendar')     renderCalendar();
  if (currentPage === 'reports')      renderReports();
});

function fmt(n) {
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.INR;
  return curr.symbol + Number(n || 0).toLocaleString(curr.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.INR;
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString(curr.locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return dateStr;
}

// ================================================
// 4. ACCENT THEMES & COLOR PICKER
// ================================================
const html = document.documentElement;

const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorMenu      = document.getElementById('colorMenu');

colorPickerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  colorMenu.classList.toggle('open');
});

document.addEventListener('click', () => colorMenu.classList.remove('open'));

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    currentAccent = dot.getAttribute('data-accent');
    html.setAttribute('data-accent', currentAccent);
    saveUserData('ft_accent', currentAccent);
    updateChartThemes();
  });
});

// Theme Mode (Dark / Light)
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const savedTheme  = localStorage.getItem('ft_theme') || 'dark';

html.setAttribute('data-theme', savedTheme);
themeIcon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';

themeToggle.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('ft_theme', next);
  updateChartThemes();
  if (currentPage === 'reports') renderReports();
});

function getThemeColors() {
  const dark = html.getAttribute('data-theme') === 'dark';
  return {
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    text: dark ? '#94a3b8' : '#64748b',
    bg:   dark ? '#131626' : '#ffffff',
  };
}

// ================================================
// 5. SECURITY PIN LOCK SYSTEM
// ================================================
const pinScreen      = document.getElementById('pinScreen');
const pinError       = document.getElementById('pinError');
const pinDots        = document.querySelectorAll('#pinDots .dot');
const lockAppBtn     = document.getElementById('lockAppBtn');
let pinBuffer        = '';

function checkPinOnLaunch() {
  if (userProfile.pinEnabled && userProfile.pin) {
    pinScreen.style.display = 'flex';
    pinBuffer = '';
    updatePinDots();
  } else {
    pinScreen.style.display = 'none';
  }
}

lockAppBtn.addEventListener('click', () => {
  if (!userProfile.pinEnabled || !userProfile.pin) {
    showToast('Enable PIN lock in User Profile settings first', 'info');
    openProfileModal();
    return;
  }
  pinScreen.style.display = 'flex';
  pinBuffer = '';
  updatePinDots();
});

function updatePinDots() {
  pinDots.forEach((dot, index) => {
    if (index < pinBuffer.length) dot.classList.add('filled');
    else dot.classList.remove('filled');
  });
}

function handlePinDigit(digit) {
  if (pinBuffer.length < 4) {
    pinBuffer += digit;
    updatePinDots();
    if (pinBuffer.length === 4) verifyPin();
  }
}

function handlePinBackspace() {
  pinBuffer = pinBuffer.slice(0, -1);
  pinError.textContent = '';
  updatePinDots();
}

function handlePinClear() {
  pinBuffer = '';
  pinError.textContent = '';
  updatePinDots();
}

document.querySelectorAll('.key-btn[data-key]').forEach(btn => {
  btn.addEventListener('click', () => handlePinDigit(btn.getAttribute('data-key')));
});

document.getElementById('pinClear').addEventListener('click', handlePinClear);
document.getElementById('pinBackspace').addEventListener('click', handlePinBackspace);

// Physical keyboard listener for PIN pad
window.addEventListener('keydown', (e) => {
  if (pinScreen && pinScreen.style.display !== 'none') {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handlePinDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handlePinBackspace();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      e.preventDefault();
      handlePinClear();
    }
  }
});

function verifyPin() {
  if (pinBuffer === userProfile.pin) {
    pinError.textContent = '';
    pinScreen.style.display = 'none';
    pinBuffer = '';
  } else {
    pinError.textContent = 'Incorrect PIN. Try again.';
    pinBuffer = '';
    updatePinDots();
  }
}

// ================================================
// 6. USER PROFILE MANAGEMENT
// ================================================
function updateUserProfileUI() {
  const nameStr = (userProfile && typeof userProfile.name === 'string' && userProfile.name.trim()) 
    ? userProfile.name.trim() 
    : 'User';
  const roleStr = (userProfile && typeof userProfile.role === 'string' && userProfile.role.trim()) 
    ? userProfile.role.trim() 
    : 'Personal Account';

  const initials = nameStr
    .split(/\s+/)
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US';

  const avatarEl = document.getElementById('userAvatar');
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRole');

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = nameStr;
  if (roleEl)   roleEl.textContent   = roleStr;
}

const profileModalOverlay = document.getElementById('profileModalOverlay');
const userCardTrigger     = document.getElementById('userCardTrigger');
const profileModalClose   = document.getElementById('profileModalClose');
const profileForm         = document.getElementById('profileForm');

function openProfileModal() {
  document.getElementById('profName').value         = (userProfile && userProfile.name) || '';
  document.getElementById('profIncomeTarget').value = (userProfile && userProfile.incomeTarget) || '';
  document.getElementById('profPinEnable').checked  = (userProfile && userProfile.pinEnabled) || false;
  document.getElementById('profPin').value          = (userProfile && userProfile.pin) || '';
  document.getElementById('profPinInputWrap').style.display = (userProfile && userProfile.pinEnabled) ? 'block' : 'none';
  profileModalOverlay.classList.add('open');
}

userCardTrigger.addEventListener('click', openProfileModal);
profileModalClose.addEventListener('click', () => profileModalOverlay.classList.remove('open'));

document.getElementById('profPinEnable').addEventListener('change', (e) => {
  document.getElementById('profPinInputWrap').style.display = e.target.checked ? 'block' : 'none';
});

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  userProfile.name         = document.getElementById('profName').value.trim() || 'User';
  userProfile.incomeTarget = parseFloat(document.getElementById('profIncomeTarget').value) || 0;
  userProfile.pinEnabled   = document.getElementById('profPinEnable').checked;
  userProfile.pin          = document.getElementById('profPin').value.trim();

  saveData('ft_user', userProfile);
  updateUserProfileUI();
  profileModalOverlay.classList.remove('open');
  showToast('Profile & security preferences saved!', 'success');
  refreshDashboard();
});

// Demo Data & Reset Data Buttons in Settings
const profDemoBtn = document.getElementById('profDemoBtn');
if (profDemoBtn) {
  profDemoBtn.addEventListener('click', () => {
    loadDemoData();
    profileModalOverlay.classList.remove('open');
  });
}

const profResetBtn = document.getElementById('profResetBtn');
if (profResetBtn) {
  profResetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to erase all data for this account? This cannot be undone.')) {
      transactions = [];
      budgets = { housing: 15000, food: 10000, transport: 5000, shopping: 5000 };
      goals = [];
      debts = [];
      bills = [];
      saveData('ft_transactions', transactions);
      saveData('ft_budgets', budgets);
      saveData('ft_goals', goals);
      saveData('ft_debts', debts);
      saveData('ft_bills', bills);
      profileModalOverlay.classList.remove('open');
      showToast('All data has been reset.', 'info');
      refreshDashboard();
      if (currentPage === 'transactions') renderTxnTable();
      if (currentPage === 'budget')       renderBudgetEditor();
      if (currentPage === 'savings')      renderSavingsGoals();
      if (currentPage === 'debts')        renderDebts();
      if (currentPage === 'bills')        renderBills();
      if (currentPage === 'calendar')     renderCalendar();
      if (currentPage === 'reports')      renderReports();
    }
  });
}

// ================================================
// 7. SIDEBAR & PAGE NAVIGATION
// ================================================
const sidebar          = document.getElementById('sidebar');
const sidebarToggle    = document.getElementById('sidebarToggle');
const sidebarBackdrop  = document.getElementById('sidebarBackdrop');

sidebarToggle.addEventListener('click', () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
  } else {
    sidebar.classList.toggle('collapsed');
  }
  setTimeout(() => { Object.values(charts).forEach(c => c && c.resize && c.resize()); }, 320);
});

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    sidebarBackdrop.classList.remove('active');
  });
}

const PAGES = {
  dashboard:    document.getElementById('pageDashboard'),
  transactions: document.getElementById('pageTransactions'),
  budget:       document.getElementById('pageBudget'),
  savings:      document.getElementById('pageSavings'),
  debts:        document.getElementById('pageDebts'),
  bills:        document.getElementById('pageBills'),
  calendar:     document.getElementById('pageCalendar'),
  reports:      document.getElementById('pageReports'),
};

const PAGE_TITLES = {
  dashboard:    'Dashboard Overview',
  transactions: 'Transactions & Records',
  budget:       'Monthly Budget Limits',
  savings:      'Savings Goals Hub',
  debts:        'Debt & EMI Tracker',
  bills:        'Bills & Reminders',
  calendar:     'Financial Calendar',
  reports:      'Analytics & YoY Reports',
};

let currentPage = 'dashboard';

function navigateTo(page) {
  currentPage = page;
  Object.values(PAGES).forEach(p => { if (p) p.style.display = 'none'; });
  if (PAGES[page]) PAGES[page].style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || 'FinTrack';

  // Close mobile drawer on navigation
  if (sidebar.classList.contains('mobile-open')) {
    sidebar.classList.remove('mobile-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  if (page === 'dashboard')    refreshDashboard();
  if (page === 'transactions') renderTransactionsPage();
  if (page === 'budget')       renderBudgetEditor();
  if (page === 'savings')      renderSavingsGoals();
  if (page === 'debts')        renderDebts();
  if (page === 'bills')        renderBills();
  if (page === 'calendar')     renderCalendar();
  if (page === 'reports')      renderReports();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.getAttribute('data-page'));
  });
});

document.getElementById('seeAllBtn').addEventListener('click', () => navigateTo('transactions'));

// ================================================
// 8. DATE & CALCULATION UTILITIES
// ================================================
const now = new Date();
document.getElementById('currentDate').textContent = now.toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
document.getElementById('budgetMonth').textContent = now.toLocaleDateString('en-IN', {
  month: 'long', year: 'numeric'
});

function getMonthStr(date) {
  if (!date) return '';
  return String(date).slice(0, 7);
}

function thisMonthStr() {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function calcTotals(txns, monthStr) {
  const filtered = monthStr ? txns.filter(t => getMonthStr(t.date) === monthStr) : txns;
  let income = 0, expense = 0;
  filtered.forEach(t => {
    if (t.type === 'income') income += Number(t.amount);
    else expense += Number(t.amount);
  });
  return { income, expense, net: income - expense };
}

function getLastNMonthsData(n) {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = MONTHS[d.getMonth()];
    const { income, expense } = calcTotals(transactions, key);
    months.push({ label, income, expense });
  }
  return months;
}

function getCategoryBreakdown(monthStr) {
  const filtered = transactions.filter(t => t.type === 'expense' && getMonthStr(t.date) === monthStr);
  const map = {};
  filtered.forEach(t => {
    map[t.category] = (map[t.category] || 0) + Number(t.amount);
  });
  return Object.entries(map).map(([id, value]) => {
    const cat = getCatInfo(id);
    return { label: cat.label, value, color: cat.color };
  }).sort((a,b) => b.value - a.value);
}

function getRunningBalance(txns) {
  if (!txns || txns.length === 0) return [];
  // Sort chronologically
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  const dailyDeltas = {};
  sorted.forEach(t => {
    dailyDeltas[t.date] = (dailyDeltas[t.date] || 0) + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
  });

  let balance = 0;
  return Object.keys(dailyDeltas).sort().map(date => {
    balance += dailyDeltas[date];
    return { date, balance };
  });
}

// ================================================
// 9. CHARTS ENGINE SETUP
// ================================================
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: getThemeColors().text, font: { family: 'Inter', size: 12 }, boxWidth: 10, boxHeight: 10 }
    },
    tooltip: {
      backgroundColor: '#1e2235',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 12,
      cornerRadius: 10,
      callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) }
    }
  },
  scales: {
    x: { grid: { color: getThemeColors().grid }, ticks: { color: getThemeColors().text } },
    y: { grid: { color: getThemeColors().grid }, ticks: { color: getThemeColors().text, callback: v => fmt(v) } }
  }
};

const barCtx   = document.getElementById('barChart').getContext('2d');
const barChart = new Chart(barCtx, {
  type: 'bar',
  data: { labels: [], datasets: [
    { label: 'Income', data: [], backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 8 },
    { label: 'Expenses', data: [], backgroundColor: 'rgba(244,63,94,0.75)', borderRadius: 8 },
  ]},
  options: { ...CHART_DEFAULTS, barPercentage: 0.6 }
});

const donutCtx   = document.getElementById('donutChart').getContext('2d');
const donutChart = new Chart(donutCtx, {
  type: 'doughnut',
  data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }] },
  options: {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.parsed) } } }
  }
});

const lineCtx  = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(lineCtx, {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Balance', data: [], borderColor: '#6c63ff', borderWidth: 2, fill: true, tension: 0.4 }]},
  options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }
});

function makeSpark(id, data, color) {
  const ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: data.map((_,i)=>i), datasets: [{ data, borderColor: color, borderWidth: 1.5, fill: true, backgroundColor: color.replace('1)', '0.15)'), tension: 0.4, pointRadius: 0 }]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
  });
}

const sparkIncome  = makeSpark('sparkIncome',  [0,0,0,0,0,0], 'rgba(16,185,129,1)');
const sparkExpense = makeSpark('sparkExpense', [0,0,0,0,0,0], 'rgba(244,63,94,1)');
const sparkSavings = makeSpark('sparkSavings', [0,0,0,0,0,0], 'rgba(245,158,11,1)');
const sparkBalance = makeSpark('sparkBalance', [0,0,0,0,0,0], 'rgba(108,99,255,1)');

const charts = { barChart, lineChart };

// ================================================
// 10. AI SMART INSIGHTS GENERATOR
// ================================================
function renderSmartInsights() {
  const grid = document.getElementById('insightsGrid');
  grid.innerHTML = '';

  const cur = calcTotals(transactions, thisMonthStr());
  const breakdown = getCategoryBreakdown(thisMonthStr());

  const insights = [];

  if (cur.income > 0) {
    const saveRate = ((cur.net / cur.income) * 100).toFixed(0);
    if (saveRate >= 20) {
      insights.push({ type: 'good', icon: 'fas fa-circle-check', text: `<strong>Great Save Rate!</strong> You saved ${saveRate}% of income this month. Keep it up!` });
    } else {
      insights.push({ type: 'warn', icon: 'fas fa-triangle-exclamation', text: `<strong>Save Rate Alert:</strong> Saving ${saveRate}% this month. Aim for 20%+ to build wealth.` });
    }
  }

  if (breakdown.length > 0) {
    const topCat = breakdown[0];
    insights.push({ type: 'info', icon: 'fas fa-chart-pie', text: `<strong>Top Expense:</strong> Most spent on <strong>${topCat.label}</strong> (${fmt(topCat.value)}) this month.` });
  }

  const upcomingBills = bills.filter(b => !b.paid);
  if (upcomingBills.length > 0) {
    insights.push({ type: 'warn', icon: 'fas fa-bell', text: `<strong>${upcomingBills.length} Bill(s) Pending:</strong> Check your Bills section for upcoming due dates.` });
  } else {
    insights.push({ type: 'good', icon: 'fas fa-shield-halved', text: `<strong>All Clear!</strong> No pending bills due. Your credit health looks solid.` });
  }

  insights.forEach(ins => {
    const div = document.createElement('div');
    div.className = 'insight-item';
    div.innerHTML = `
      <div class="insight-icon ${ins.type}"><i class="${ins.icon}"></i></div>
      <div>${ins.text}</div>
    `;
    grid.appendChild(div);
  });
}

// ================================================
// 11. DASHBOARD REFRESH & RANGE FILTER
// ================================================
let filterMode = '6m';

const filterChips = [
  { id: 'filter6m', mode: '6m' },
  { id: 'filter3m', mode: '3m' },
  { id: 'filter1m', mode: '1m' },
];

filterChips.forEach(({ id, mode }) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => {
      filterMode = mode;
      filterChips.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) el.classList.toggle('active', c.mode === mode);
      });
      refreshDashboard();
    });
  }
});

function refreshDashboard() {
  const hasData = transactions.length > 0;
  document.getElementById('emptyState').style.display       = hasData ? 'none'  : 'flex';
  document.getElementById('dashboardContent').style.display = hasData ? 'block' : 'none';

  if (!hasData) return;

  renderSmartInsights();

  const cur  = calcTotals(transactions, thisMonthStr());
  const prev = calcTotals(transactions, getPrevMonthStr());

  document.getElementById('incomeValue').textContent  = fmt(cur.income);
  document.getElementById('expenseValue').textContent = fmt(cur.expense);
  document.getElementById('savingsValue').textContent = fmt(cur.net);

  const balance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  document.getElementById('balanceValue').textContent = fmt(balance);

  const incPct = prev.income > 0 ? ((cur.income - prev.income) / prev.income * 100).toFixed(1) : 0;
  const expPct = prev.expense > 0 ? ((cur.expense - prev.expense) / prev.expense * 100).toFixed(1) : 0;
  const saveRate = cur.income > 0 ? ((cur.net / cur.income) * 100).toFixed(0) : 0;

  document.getElementById('incomeChange').innerHTML  = `<i class="fas fa-caret-${incPct >= 0 ? 'up' : 'down'}"></i> ${incPct >= 0 ? '+' : ''}${incPct}% vs last month`;
  document.getElementById('expenseChange').innerHTML = `<i class="fas fa-caret-${expPct > 0 ? 'up' : 'down'}"></i> ${expPct > 0 ? '+' : ''}${expPct}% vs last month`;
  document.getElementById('savingsChange').innerHTML = `<i class="fas fa-caret-up"></i> ${saveRate}% save rate`;
  document.getElementById('balanceChange').innerHTML = `<i class="fas fa-caret-${balance >= 0 ? 'up' : 'down'}"></i> ${balance >= 0 ? 'Positive' : 'Negative'}`;

  // Sparklines
  const last6 = getLastNMonthsData(6);
  sparkIncome.data.datasets[0].data  = last6.map(m => m.income);
  sparkExpense.data.datasets[0].data = last6.map(m => m.expense);
  sparkSavings.data.datasets[0].data = last6.map(m => m.income - m.expense);
  sparkBalance.data.datasets[0].data = getRunningBalance(transactions).slice(-6).map(p => p.balance);
  [sparkIncome, sparkExpense, sparkSavings, sparkBalance].forEach(s => s.update());

  // Bar Chart with active filter
  const n = filterMode === '6m' ? 6 : filterMode === '3m' ? 3 : 1;
  const monthsData = getLastNMonthsData(n);
  barChart.data.labels           = monthsData.map(m => m.label);
  barChart.data.datasets[0].data = monthsData.map(m => m.income);
  barChart.data.datasets[1].data = monthsData.map(m => m.expense);
  barChart.update();

  // Donut Chart
  const breakdown = getCategoryBreakdown(thisMonthStr());
  const legendEl  = document.getElementById('donutLegend');
  legendEl.innerHTML = '';
  if (breakdown.length > 0) {
    donutChart.data.labels                      = breakdown.map(b => b.label);
    donutChart.data.datasets[0].data            = breakdown.map(b => b.value);
    donutChart.data.datasets[0].backgroundColor = breakdown.map(b => b.color);
    donutChart.update();
    breakdown.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<div class="legend-dot" style="background:${cat.color}"></div><span>${cat.label}: <strong>${fmt(cat.value)}</strong></span>`;
      legendEl.appendChild(item);
    });
  } else {
    donutChart.data.labels = ['No Expenses'];
    donutChart.data.datasets[0].data = [1];
    donutChart.data.datasets[0].backgroundColor = ['rgba(255,255,255,0.08)'];
    donutChart.update();
    legendEl.innerHTML = '<span style="color:var(--text-muted);font-size:12px">No expenses logged for this month</span>';
  }

  // Line Chart
  const balancePoints = getRunningBalance(transactions);
  lineChart.data.labels           = balancePoints.map(p => fmtDate(p.date));
  lineChart.data.datasets[0].data = balancePoints.map(p => p.balance);
  lineChart.update();

  renderRecentTransactions();
  renderBudgetBars();
  renderDashBillsWidget();
  checkNotifications();
}

function getPrevMonthStr() {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function renderRecentTransactions() {
  const listEl = document.getElementById('transactionsList');
  const noMsg  = document.getElementById('noTxnMsg');
  listEl.innerHTML = '';

  const recent = [...transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (recent.length === 0) { noMsg.style.display = 'flex'; return; }
  noMsg.style.display = 'none';

  recent.forEach(txn => {
    const cat = getCatInfo(txn.category);
    const div = document.createElement('div');
    div.className = 'txn-item';
    div.innerHTML = `
      <div class="txn-icon" style="background:${cat.color}22; color:${cat.color}"><i class="${cat.icon}"></i></div>
      <div class="txn-details">
        <div class="txn-name">${txn.description} ${txn.recurring ? '<span class="tag-badge" style="font-size:10px"><i class="fas fa-arrows-rotate"></i> Recurring</span>' : ''}</div>
        <div class="txn-date">${fmtDate(txn.date)} · ${cat.label}</div>
      </div>
      <div class="txn-amount ${txn.type === 'income' ? 'credit' : 'debit'}">
        ${txn.type === 'income' ? '+' : '-'}${fmt(txn.amount)}
      </div>
    `;
    listEl.appendChild(div);
  });
}

function renderBudgetBars() {
  const gridEl = document.getElementById('budgetGrid');
  gridEl.innerHTML = '';
  const thisMonth = thisMonthStr();
  const expenses  = transactions.filter(t => t.type === 'expense' && getMonthStr(t.date) === thisMonth);

  EXPENSE_CATEGORIES.forEach(cat => {
    const spent = expenses.filter(t => t.category === cat.id).reduce((sum, t) => sum + Number(t.amount), 0);
    const limit = budgets[cat.id] || 0;
    const pct   = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
    const over  = limit > 0 && spent > limit;

    const div = document.createElement('div');
    div.className = 'budget-item';
    div.innerHTML = `
      <div class="budget-item-header">
        <div class="budget-cat" style="color:${cat.color}"><i class="${cat.icon}"></i><span style="color:var(--text)">${cat.label}</span></div>
        <span class="budget-values">${fmt(spent)} / ${fmt(limit)}</span>
      </div>
      <div class="budget-bar-track"><div class="budget-bar-fill" style="background:${over ? '#f43f5e' : cat.color}; width:${pct}%"></div></div>
      <div class="budget-percent" style="color:${over ? '#f43f5e' : 'var(--text-muted)'}">${limit > 0 ? pct + '% used' : 'No limit set'} ${over ? '⚠️ Over budget!' : ''}</div>
    `;
    gridEl.appendChild(div);
  });
}

function renderDashBillsWidget() {
  const widget = document.getElementById('dashBillsWidget');
  const list   = document.getElementById('dashBillsList');
  const pending = bills.filter(b => !b.paid).slice(0,3);

  if (pending.length === 0) { widget.style.display = 'none'; return; }
  widget.style.display = 'block';
  list.innerHTML = '';

  pending.forEach(b => {
    const div = document.createElement('div');
    div.className = 'bill-item';
    div.style.padding = '10px 14px';
    div.innerHTML = `
      <div class="bill-info">
        <div class="bill-name" style="font-size:13px">${b.title}</div>
        <div class="bill-date">${fmtDate(b.dueDate)}</div>
      </div>
      <div style="font-weight:700">${fmt(b.amount)}</div>
    `;
    list.appendChild(div);
  });
}

// ================================================
// 12. TRANSACTIONS PAGE & SEARCH SYSTEM
// ================================================
const txnSearchInput     = document.getElementById('txnSearchInput');
const clearSearchBtn     = document.getElementById('clearSearchBtn');
const txnFilterType      = document.getElementById('txnFilterType');
const txnFilterCat       = document.getElementById('txnFilterCat');
const txnFilterTag       = document.getElementById('txnFilterTag');
const txnFilterStartDate = document.getElementById('txnFilterStartDate');
const txnFilterEndDate   = document.getElementById('txnFilterEndDate');
const resetFiltersBtn    = document.getElementById('resetFiltersBtn');

function renderTransactionsPage() {
  // Populate Categories
  if (txnFilterCat.options.length <= 1) {
    txnFilterCat.innerHTML = '<option value="all">All Categories</option>';
    ALL_CATS.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.label;
      txnFilterCat.appendChild(opt);
    });
  }

  // Populate Tags
  const allTags = [...new Set(transactions.map(t => t.tag).filter(Boolean))];
  txnFilterTag.innerHTML = '<option value="all">All Tags</option>';
  allTags.forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag; opt.textContent = tag;
    txnFilterTag.appendChild(opt);
  });

  renderTxnTable();
}

txnSearchInput.addEventListener('input', () => {
  clearSearchBtn.style.display = txnSearchInput.value ? 'block' : 'none';
  renderTxnTable();
});

clearSearchBtn.addEventListener('click', () => {
  txnSearchInput.value = '';
  clearSearchBtn.style.display = 'none';
  renderTxnTable();
});

[txnFilterType, txnFilterCat, txnFilterTag, txnFilterStartDate, txnFilterEndDate].forEach(el => {
  el.addEventListener('change', renderTxnTable);
});

resetFiltersBtn.addEventListener('click', () => {
  txnSearchInput.value = '';
  clearSearchBtn.style.display = 'none';
  txnFilterType.value = 'all';
  txnFilterCat.value = 'all';
  txnFilterTag.value = 'all';
  txnFilterStartDate.value = '';
  txnFilterEndDate.value = '';
  renderTxnTable();
});

function renderTxnTable() {
  const search  = txnSearchInput.value.toLowerCase().trim();
  const typeVal = txnFilterType.value;
  const catVal  = txnFilterCat.value;
  const tagVal  = txnFilterTag.value;
  const start   = txnFilterStartDate.value;
  const end     = txnFilterEndDate.value;

  let filtered = [...transactions];

  if (search) {
    filtered = filtered.filter(t =>
      (t.description && t.description.toLowerCase().includes(search)) ||
      (t.notes && t.notes.toLowerCase().includes(search)) ||
      (t.tag && t.tag.toLowerCase().includes(search))
    );
  }

  if (typeVal !== 'all') filtered = filtered.filter(t => t.type === typeVal);
  if (catVal  !== 'all') filtered = filtered.filter(t => t.category === catVal);
  if (tagVal  !== 'all') filtered = filtered.filter(t => t.tag === tagVal);
  if (start)             filtered = filtered.filter(t => t.date >= start);
  if (end)               filtered = filtered.filter(t => t.date <= end);

  filtered.sort((a,b) => b.date.localeCompare(a.date));

  const inc = filtered.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0);
  const exp = filtered.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
  document.getElementById('stripIncome').textContent  = fmt(inc);
  document.getElementById('stripExpense').textContent = fmt(exp);
  document.getElementById('stripNet').textContent     = fmt(inc - exp);

  const tbody   = document.getElementById('txnTableBody');
  const noTxnEl = document.getElementById('noTxnFull');
  const tableEl = document.getElementById('txnTable');

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tableEl.style.display = 'none';
    noTxnEl.style.display = 'flex';
    return;
  }
  tableEl.style.display = '';
  noTxnEl.style.display = 'none';

  filtered.forEach(txn => {
    const cat = getCatInfo(txn.category);
    const tr  = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtDate(txn.date)}</td>
      <td>
        <div style="font-weight:600">${txn.description} ${txn.recurring ? '<span class="tag-badge" style="font-size:10px"><i class="fas fa-arrows-rotate"></i> ' + (txn.recurringFreq || 'Recurring') + '</span>' : ''}</div>
        ${txn.notes ? `<div class="notes-text">${txn.notes}</div>` : ''}
      </td>
      <td><span class="txn-cat-badge"><i class="${cat.icon}" style="color:${cat.color}"></i> ${cat.label}</span></td>
      <td>${txn.tag ? `<span class="tag-badge">${txn.tag}</span>` : '-'}</td>
      <td><span class="txn-type-badge ${txn.type}">${txn.type === 'income' ? 'Income' : 'Expense'}</span></td>
      <td class="txn-amount-cell ${txn.type}">${txn.type === 'income' ? '+' : '-'}${fmt(txn.amount)}</td>
      <td>
        <div class="action-btns">
          <button class="action-icon-btn edit" data-id="${txn.id}" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="action-icon-btn delete" data-id="${txn.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => editTransaction(btn.getAttribute('data-id')));
  });

  tbody.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTransaction(btn.getAttribute('data-id')));
  });
}

// ================================================
// 13. ADD / EDIT TRANSACTION MODAL
// ================================================
const modalOverlay       = document.getElementById('modalOverlay');
const modalClose         = document.getElementById('modalClose');
const fabBtn             = document.getElementById('fabBtn');
const txnForm            = document.getElementById('txnForm');
const typeButtons        = document.querySelectorAll('.type-btn');
const catSelect          = document.getElementById('txnCategory');
const txnRecurringCheck  = document.getElementById('txnRecurringCheck');
const recurringFreqWrap  = document.getElementById('recurringFreqWrap');
const txnRecurringFreq   = document.getElementById('txnRecurringFreq');

let selectedType = 'income';

if (txnRecurringCheck) {
  txnRecurringCheck.addEventListener('change', (e) => {
    if (recurringFreqWrap) recurringFreqWrap.style.display = e.target.checked ? 'block' : 'none';
  });
}

function clearTxnErrors() {
  ['amountError', 'categoryError', 'descError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.remove('show');
    }
  });
}

['txnAmount', 'txnCategory', 'txnDesc'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', clearTxnErrors);
});

function openModal(editId = null) {
  txnForm.reset();
  clearTxnErrors();
  document.getElementById('editTxnId').value = editId || '';
  document.getElementById('modalTitle').textContent = editId ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('txnDate').valueAsDate = new Date();
  
  if (recurringFreqWrap) recurringFreqWrap.style.display = 'none';

  if (editId) {
    const t = transactions.find(item => item.id === editId);
    if (t) {
      selectedType = t.type;
      setTypeToggle(selectedType);
      populateCategoryDropdown(selectedType);
      document.getElementById('txnAmount').value   = t.amount;
      document.getElementById('txnCategory').value = t.category;
      document.getElementById('txnDesc').value     = t.description;
      document.getElementById('txnTag').value      = t.tag || '';
      document.getElementById('txnDate').value     = t.date;
      document.getElementById('txnNotes').value    = t.notes || '';
      if (txnRecurringCheck) {
        txnRecurringCheck.checked = !!t.recurring;
        if (recurringFreqWrap) recurringFreqWrap.style.display = t.recurring ? 'block' : 'none';
      }
      if (txnRecurringFreq && t.recurringFreq) {
        txnRecurringFreq.value = t.recurringFreq;
      }
    }
  } else {
    selectedType = 'income';
    setTypeToggle(selectedType);
    populateCategoryDropdown(selectedType);
  }

  modalOverlay.classList.add('open');
}

function setTypeToggle(type) {
  typeButtons.forEach(b => {
    if (b.getAttribute('data-type') === type) b.classList.add('active');
    else b.classList.remove('active');
  });
}

function closeModal() {
  modalOverlay.classList.remove('open');
  txnForm.reset();
  clearTxnErrors();
}

fabBtn.addEventListener('click', () => openModal());
document.getElementById('emptyAddBtn').addEventListener('click', () => openModal());
modalClose.addEventListener('click', closeModal);

typeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedType = btn.getAttribute('data-type');
    setTypeToggle(selectedType);
    populateCategoryDropdown(selectedType);
  });
});

function populateCategoryDropdown(type) {
  catSelect.innerHTML = '<option value="">-- Select Category --</option>';
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id; opt.textContent = cat.label;
    catSelect.appendChild(opt);
  });
}

txnForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const editId   = document.getElementById('editTxnId').value;
  const amount   = parseFloat(document.getElementById('txnAmount').value);
  const catId    = document.getElementById('txnCategory').value;
  const desc     = document.getElementById('txnDesc').value.trim();
  const date     = document.getElementById('txnDate').value;
  const tag      = document.getElementById('txnTag').value.trim();
  const notes    = document.getElementById('txnNotes').value.trim();
  const isRec    = txnRecurringCheck ? txnRecurringCheck.checked : false;
  const recFreq  = isRec && txnRecurringFreq ? txnRecurringFreq.value : null;

  let hasError = false;
  if (!amount || isNaN(amount) || amount <= 0) {
    const err = document.getElementById('amountError');
    err.textContent = 'Please enter a valid amount greater than 0.';
    err.classList.add('show');
    hasError = true;
  }
  if (!catId) {
    const err = document.getElementById('categoryError');
    err.textContent = 'Please choose a category.';
    err.classList.add('show');
    hasError = true;
  }
  if (!desc) {
    const err = document.getElementById('descError');
    err.textContent = 'Please enter a description.';
    err.classList.add('show');
    hasError = true;
  }

  if (hasError || !date) return;

  if (editId) {
    const idx = transactions.findIndex(t => t.id === editId);
    if (idx !== -1) {
      transactions[idx] = { 
        ...transactions[idx], 
        type: selectedType, 
        amount, 
        category: catId, 
        description: desc, 
        date, 
        tag, 
        notes,
        recurring: isRec,
        recurringFreq: recFreq
      };
      showToast('Transaction updated successfully!', 'success');
    }
  } else {
    transactions.push({
      id: Date.now().toString(),
      type: selectedType, 
      amount, 
      category: catId, 
      description: desc, 
      date, 
      tag, 
      notes,
      recurring: isRec,
      recurringFreq: recFreq
    });
    showToast('Transaction added!', 'success');
  }

  saveData('ft_transactions', transactions);
  closeModal();
  refreshDashboard();
  if (currentPage === 'transactions') renderTxnTable();
});

function editTransaction(id) {
  openModal(id);
}

function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveData('ft_transactions', transactions);
  showToast('Transaction deleted.', 'info');
  refreshDashboard();
  if (currentPage === 'transactions') renderTxnTable();
}

// ================================================
// 14. SAVINGS GOALS HUB
// ================================================
const goalModalOverlay = document.getElementById('goalModalOverlay');

function openGoalModal(goalId = null) {
  const form = document.getElementById('goalForm');
  form.reset();
  document.getElementById('editGoalId').value = goalId || '';
  document.getElementById('goalModalTitle').textContent = goalId ? 'Edit Savings Goal' : 'Add Savings Goal';

  if (goalId) {
    const g = goals.find(item => item.id === goalId);
    if (g) {
      document.getElementById('goalTitle').value      = g.title;
      document.getElementById('goalTarget').value     = g.target;
      document.getElementById('goalCurrent').value    = g.current || 0;
      document.getElementById('goalTargetDate').value = g.targetDate || '';
    }
  }
  goalModalOverlay.classList.add('open');
}

function renderSavingsGoals() {
  const grid = document.getElementById('goalsGrid');
  grid.innerHTML = '';

  if (goals.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fas fa-piggy-bank" style="font-size: 36px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p>No savings goals created yet. Click "+ New Savings Goal" to set one!</p>
      </div>
    `;
    return;
  }

  goals.forEach(goal => {
    const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.innerHTML = `
      <div class="goal-card-header">
        <div class="goal-title">${goal.title}</div>
        <div class="goal-date">${goal.targetDate ? fmtDate(goal.targetDate) : 'No Deadline'}</div>
      </div>
      <div class="goal-numbers">
        <span>Saved: ${fmt(goal.current)}</span>
        <span class="goal-pct">${pct}%</span>
      </div>
      <div class="goal-progress-wrap">
        <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div style="font-size:12px; color:var(--text-muted)">Target: ${fmt(goal.target)}</div>
      <div class="goal-actions">
        <button class="goal-deposit-btn" data-id="${goal.id}">+ Deposit / - Withdraw</button>
        <button class="goal-edit-btn" data-id="${goal.id}" title="Edit Goal"><i class="fas fa-pen"></i></button>
        <button class="goal-delete-btn" data-id="${goal.id}" title="Delete Goal"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.goal-deposit-btn').forEach(b => {
    b.addEventListener('click', () => openDepositModal(b.getAttribute('data-id')));
  });

  grid.querySelectorAll('.goal-edit-btn').forEach(b => {
    b.addEventListener('click', () => openGoalModal(b.getAttribute('data-id')));
  });

  grid.querySelectorAll('.goal-delete-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (!confirm('Delete this savings goal?')) return;
      goals = goals.filter(g => g.id !== b.getAttribute('data-id'));
      saveData('ft_goals', goals);
      showToast('Savings goal removed', 'info');
      renderSavingsGoals();
    });
  });
}

document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
document.getElementById('goalModalClose').addEventListener('click', () => goalModalOverlay.classList.remove('open'));

document.getElementById('goalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const editId     = document.getElementById('editGoalId').value;
  const title      = document.getElementById('goalTitle').value.trim();
  const target     = parseFloat(document.getElementById('goalTarget').value);
  const current    = parseFloat(document.getElementById('goalCurrent').value) || 0;
  const targetDate = document.getElementById('goalTargetDate').value;

  if (!title || !target) return;

  if (editId) {
    const idx = goals.findIndex(g => g.id === editId);
    if (idx !== -1) {
      goals[idx] = { ...goals[idx], title, target, current, targetDate };
      showToast('Savings goal updated!', 'success');
    }
  } else {
    goals.push({ id: Date.now().toString(), title, target, current, targetDate });
    showToast('New savings goal created!', 'success');
  }

  saveData('ft_goals', goals);
  goalModalOverlay.classList.remove('open');
  document.getElementById('goalForm').reset();
  renderSavingsGoals();
});

const depositModalOverlay = document.getElementById('depositModalOverlay');
function openDepositModal(id) {
  document.getElementById('depositGoalId').value = id;
  document.getElementById('depositAmount').value = '';
  depositModalOverlay.classList.add('open');
}
document.getElementById('depositModalClose').addEventListener('click', () => depositModalOverlay.classList.remove('open'));

document.getElementById('depositForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id     = document.getElementById('depositGoalId').value;
  const action = document.getElementById('depositAction').value;
  const amount = parseFloat(document.getElementById('depositAmount').value);

  const g = goals.find(item => item.id === id);
  if (g && amount > 0) {
    if (action === 'deposit') {
      g.current += amount;
      showToast(`Deposited ${fmt(amount)} into "${g.title}"!`, 'success');
    } else {
      g.current = Math.max(0, g.current - amount);
      showToast(`Withdrew ${fmt(amount)} from "${g.title}"!`, 'info');
    }
    saveData('ft_goals', goals);
    renderSavingsGoals();
  }
  depositModalOverlay.classList.remove('open');
});

// ================================================
// 15. DEBT & EMI TRACKER
// ================================================
const debtModalOverlay = document.getElementById('debtModalOverlay');

function openDebtModal(debtId = null) {
  const form = document.getElementById('debtForm');
  form.reset();
  document.getElementById('editDebtId').value = debtId || '';
  document.getElementById('debtModalTitle').textContent = debtId ? 'Edit Debt / Loan' : 'Add Debt / Loan';

  if (debtId) {
    const d = debts.find(item => item.id === debtId);
    if (d) {
      document.getElementById('debtTitle').value    = d.title;
      document.getElementById('debtTotal').value    = d.total;
      document.getElementById('debtPaid').value     = d.paid || 0;
      document.getElementById('debtInterest').value = d.interest || '';
    }
  }
  debtModalOverlay.classList.add('open');
}

function renderDebts() {
  const grid = document.getElementById('debtsGrid');
  grid.innerHTML = '';

  if (debts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fas fa-hand-holding-dollar" style="font-size: 36px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p>No active debts or loans logged. Click "+ Add New Debt/Loan" to track one.</p>
      </div>
    `;
    return;
  }

  debts.forEach(debt => {
    const rem = Math.max(0, debt.total - debt.paid);
    const pct = Math.min(Math.round((debt.paid / debt.total) * 100), 100);

    const card = document.createElement('div');
    card.className = 'debt-card';
    card.innerHTML = `
      <div class="debt-card-header">
        <div class="debt-title">${debt.title}</div>
        ${debt.interest ? `<span class="debt-rate">${debt.interest}% Interest</span>` : ''}
      </div>
      <div class="debt-rem">${fmt(rem)}</div>
      <div style="font-size:12px; color:var(--text-muted)">Total Loan: ${fmt(debt.total)} · Paid: ${fmt(debt.paid)}</div>
      <div class="goal-bar-bg" style="height:8px"><div class="goal-bar-fill" style="width:${pct}%; background:var(--expense)"></div></div>
      <div class="goal-actions">
        <button class="pay-debt-btn" data-id="${debt.id}">+ Log Payment</button>
        <button class="edit-debt-btn" data-id="${debt.id}" title="Edit Debt"><i class="fas fa-pen"></i></button>
        <button class="delete-debt-btn" data-id="${debt.id}" title="Delete Debt"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.pay-debt-btn').forEach(b => {
    b.addEventListener('click', () => {
      const amtStr = prompt('Enter payment amount:');
      const amt = parseFloat(amtStr);
      if (amt && !isNaN(amt) && amt > 0) {
        const d = debts.find(item => item.id === b.getAttribute('data-id'));
        if (d) {
          d.paid = Math.min(d.total, d.paid + amt);
          saveData('ft_debts', debts);
          showToast(`Logged payment of ${fmt(amt)} for "${d.title}"`, 'success');
          renderDebts();
        }
      }
    });
  });

  grid.querySelectorAll('.edit-debt-btn').forEach(b => {
    b.addEventListener('click', () => openDebtModal(b.getAttribute('data-id')));
  });

  grid.querySelectorAll('.delete-debt-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (!confirm('Delete this debt entry?')) return;
      debts = debts.filter(d => d.id !== b.getAttribute('data-id'));
      saveData('ft_debts', debts);
      showToast('Debt entry deleted', 'info');
      renderDebts();
    });
  });
}

document.getElementById('addDebtBtn').addEventListener('click', () => openDebtModal());
document.getElementById('debtModalClose').addEventListener('click', () => debtModalOverlay.classList.remove('open'));

document.getElementById('debtForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const editId   = document.getElementById('editDebtId').value;
  const title    = document.getElementById('debtTitle').value.trim();
  const total    = parseFloat(document.getElementById('debtTotal').value);
  const paid     = parseFloat(document.getElementById('debtPaid').value) || 0;
  const interest = parseFloat(document.getElementById('debtInterest').value) || 0;

  if (!title || !total) return;

  if (editId) {
    const idx = debts.findIndex(d => d.id === editId);
    if (idx !== -1) {
      debts[idx] = { ...debts[idx], title, total, paid, interest };
      showToast('Debt details updated!', 'success');
    }
  } else {
    debts.push({ id: Date.now().toString(), title, total, paid, interest });
    showToast('New debt record added!', 'success');
  }

  saveData('ft_debts', debts);
  debtModalOverlay.classList.remove('open');
  document.getElementById('debtForm').reset();
  renderDebts();
});

// ================================================
// 16. BILL REMINDERS & RECURRING PAYMENTS
// ================================================
const billModalOverlay = document.getElementById('billModalOverlay');
const billCatSelect    = document.getElementById('billCategory');

function populateBillCategories() {
  if (!billCatSelect) return;
  billCatSelect.innerHTML = '';
  EXPENSE_CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.label;
    billCatSelect.appendChild(opt);
  });
}

function openBillModal(billId = null) {
  const form = document.getElementById('billForm');
  form.reset();
  populateBillCategories();
  document.getElementById('editBillId').value = billId || '';
  document.getElementById('billModalTitle').textContent = billId ? 'Edit Bill Reminder' : 'Add Bill Reminder';

  if (billId) {
    const b = bills.find(item => item.id === billId);
    if (b) {
      document.getElementById('billTitle').value   = b.title;
      document.getElementById('billAmount').value  = b.amount;
      document.getElementById('billDueDate').value = b.dueDate;
      if (b.category) document.getElementById('billCategory').value = b.category;
    }
  }
  billModalOverlay.classList.add('open');
}

function renderBills() {
  const wrap = document.getElementById('billsListWrap');
  wrap.innerHTML = '';

  if (bills.length === 0) {
    wrap.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fas fa-file-invoice-dollar" style="font-size: 36px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p>No upcoming bills registered. Click "+ Add Bill Reminder" to stay ahead of dues.</p>
      </div>
    `;
    return;
  }

  bills.forEach(bill => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = !bill.paid && bill.dueDate < today;
    const cat = getCatInfo(bill.category || 'utilities');

    const item = document.createElement('div');
    item.className = 'bill-item';
    item.innerHTML = `
      <div class="bill-info">
        <div class="bill-icon" style="background:${cat.color}22; color:${cat.color}"><i class="${cat.icon}"></i></div>
        <div>
          <div class="bill-name">${bill.title}</div>
          <div class="bill-date">Due: ${fmtDate(bill.dueDate)} · <span style="color:var(--text-muted)">${cat.label}</span></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap">
        <div style="font-size:16px; font-weight:700">${fmt(bill.amount)}</div>
        <span class="bill-status ${bill.paid ? 'paid' : isOverdue ? 'overdue' : 'due-soon'}">${bill.paid ? 'Paid' : isOverdue ? 'Overdue' : 'Due Soon'}</span>
        ${!bill.paid ? `<button class="btn-sm pay-bill-btn" data-id="${bill.id}">Mark Paid</button>` : `<button class="btn-sm unpay-bill-btn" data-id="${bill.id}" style="background:transparent">Unmark</button>`}
        <button class="action-icon-btn edit-bill-btn" data-id="${bill.id}" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="action-icon-btn delete-bill-btn" data-id="${bill.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    wrap.appendChild(item);
  });

  wrap.querySelectorAll('.pay-bill-btn').forEach(b => {
    b.addEventListener('click', () => {
      const bill = bills.find(item => item.id === b.getAttribute('data-id'));
      if (bill) {
        bill.paid = true;
        saveData('ft_bills', bills);
        // Auto Log Expense Transaction with correct category
        transactions.push({
          id: Date.now().toString(),
          type: 'expense', 
          amount: bill.amount, 
          category: bill.category || 'utilities', 
          description: `Bill Paid: ${bill.title}`, 
          date: new Date().toISOString().split('T')[0],
          notes: `Auto-recorded from bill due on ${bill.dueDate}`
        });
        saveData('ft_transactions', transactions);
        showToast(`Bill "${bill.title}" marked as paid & logged in transactions!`, 'success');
        renderBills();
        refreshDashboard();
      }
    });
  });

  wrap.querySelectorAll('.unpay-bill-btn').forEach(b => {
    b.addEventListener('click', () => {
      const bill = bills.find(item => item.id === b.getAttribute('data-id'));
      if (bill) {
        bill.paid = false;
        saveData('ft_bills', bills);
        showToast(`Bill "${bill.title}" marked as unpaid`, 'info');
        renderBills();
        refreshDashboard();
      }
    });
  });

  wrap.querySelectorAll('.edit-bill-btn').forEach(b => {
    b.addEventListener('click', () => openBillModal(b.getAttribute('data-id')));
  });

  wrap.querySelectorAll('.delete-bill-btn').forEach(b => {
    b.addEventListener('click', () => {
      bills = bills.filter(item => item.id !== b.getAttribute('data-id'));
      saveData('ft_bills', bills);
      showToast('Bill reminder deleted', 'info');
      renderBills();
      refreshDashboard();
    });
  });
}

document.getElementById('addBillBtn').addEventListener('click', () => openBillModal());
document.getElementById('billModalClose').addEventListener('click', () => billModalOverlay.classList.remove('open'));

document.getElementById('billForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const editId   = document.getElementById('editBillId').value;
  const title    = document.getElementById('billTitle').value.trim();
  const amount   = parseFloat(document.getElementById('billAmount').value);
  const dueDate  = document.getElementById('billDueDate').value;
  const category = document.getElementById('billCategory').value || 'utilities';

  if (!title || !amount || !dueDate) return;

  if (editId) {
    const idx = bills.findIndex(b => b.id === editId);
    if (idx !== -1) {
      bills[idx] = { ...bills[idx], title, amount, dueDate, category };
      showToast('Bill reminder updated!', 'success');
    }
  } else {
    bills.push({ id: Date.now().toString(), title, amount, dueDate, category, paid: false });
    showToast('Bill reminder scheduled!', 'success');
  }

  saveData('ft_bills', bills);
  billModalOverlay.classList.remove('open');
  document.getElementById('billForm').reset();
  renderBills();
  refreshDashboard();
});

// ================================================
// 17. INTERACTIVE CALENDAR VIEW
// ================================================
let calYear  = now.getFullYear();
let calMonth = now.getMonth();

function renderCalendar() {
  document.getElementById('calMonthYear').textContent = `${MONTHS[calMonth]} ${calYear}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day empty';
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayTxns = transactions.filter(t => t.date === dateStr);
    const dayBills = bills.filter(b => b.dueDate === dateStr);

    const spent = dayTxns.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
    const inc   = dayTxns.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0);

    const cell = document.createElement('div');
    const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    cell.className = `cal-day ${isToday ? 'today' : ''}`;
    cell.innerHTML = `
      <div class="cal-day-num">${day}</div>
      <div>
        ${dayBills.length > 0 ? `<div style="font-size:10px; color:var(--savings); font-weight:700; text-align:right"><i class="fas fa-file-invoice"></i> ${dayBills.length} Bill</div>` : ''}
        ${inc > 0 ? `<div class="cal-day-income">+${fmt(inc)}</div>` : ''}
        ${spent > 0 ? `<div class="cal-day-spent">-${fmt(spent)}</div>` : ''}
      </div>
    `;

    cell.addEventListener('click', () => openDayDetailModal(dateStr, dayTxns, dayBills));
    grid.appendChild(cell);
  }
}

document.getElementById('calPrevBtn').addEventListener('click', () => {
  calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

document.getElementById('calNextBtn').addEventListener('click', () => {
  calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

document.getElementById('calTodayBtn').addEventListener('click', () => {
  calYear = now.getFullYear(); calMonth = now.getMonth();
  renderCalendar();
});

const dayDetailModalOverlay = document.getElementById('dayDetailModalOverlay');
document.getElementById('dayDetailModalClose').addEventListener('click', () => dayDetailModalOverlay.classList.remove('open'));

function openDayDetailModal(dateStr, dayTxns, dayBills = []) {
  document.getElementById('dayDetailTitle').textContent = `Activity for ${fmtDate(dateStr)}`;
  const content = document.getElementById('dayDetailContent');
  content.innerHTML = '';

  if (dayBills.length > 0) {
    const billSec = document.createElement('div');
    billSec.innerHTML = `<h4 style="font-size:13px; margin-bottom:8px; color:var(--savings);"><i class="fas fa-file-invoice-dollar"></i> Bills Due on this Day:</h4>`;
    dayBills.forEach(b => {
      const bItem = document.createElement('div');
      bItem.className = 'bill-item';
      bItem.style.marginBottom = '8px';
      bItem.style.padding = '8px 12px';
      bItem.innerHTML = `<div><strong>${b.title}</strong> (${fmt(b.amount)})</div><span class="bill-status ${b.paid ? 'paid' : 'due-soon'}">${b.paid ? 'Paid' : 'Pending'}</span>`;
      billSec.appendChild(bItem);
    });
    content.appendChild(billSec);
  }

  if (dayTxns.length === 0 && dayBills.length === 0) {
    content.innerHTML = '<p style="color:var(--text-muted)">No transactions or bills scheduled for this day.</p>';
  } else if (dayTxns.length > 0) {
    const txnSec = document.createElement('div');
    txnSec.innerHTML = `<h4 style="font-size:13px; margin: 12px 0 8px; color:var(--text);"><i class="fas fa-exchange-alt"></i> Transactions:</h4>`;
    dayTxns.forEach(t => {
      const cat = getCatInfo(t.category);
      const div = document.createElement('div');
      div.className = 'txn-item';
      div.innerHTML = `
        <div class="txn-icon" style="background:${cat.color}22; color:${cat.color}"><i class="${cat.icon}"></i></div>
        <div class="txn-details">
          <div class="txn-name">${t.description}</div>
          <div class="txn-date">${cat.label}</div>
        </div>
        <div class="txn-amount ${t.type === 'income' ? 'credit' : 'debit'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
      `;
      txnSec.appendChild(div);
    });
    content.appendChild(txnSec);
  }
  dayDetailModalOverlay.classList.add('open');
}

// ================================================
// 18. ANALYTICS & YOY REPORTS
// ================================================
let yoyChart, annualDonutChart;

function renderReports() {
  const yoyCtx = document.getElementById('yoyChart').getContext('2d');
  const annualCtx = document.getElementById('annualDonutChart').getContext('2d');

  const currentYr = now.getFullYear();
  const years = [currentYr - 2, currentYr - 1, currentYr];

  const yoyIncome  = years.map(y => transactions.filter(t => t.type === 'income' && new Date(t.date).getFullYear() === y).reduce((s,t) => s + Number(t.amount), 0));
  const yoyExpense = years.map(y => transactions.filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === y).reduce((s,t) => s + Number(t.amount), 0));

  const c = getThemeColors();

  if (yoyChart) yoyChart.destroy();
  yoyChart = new Chart(yoyCtx, {
    type: 'bar',
    data: {
      labels: years.map(String),
      datasets: [
        { label: 'Income', data: yoyIncome, backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 8 },
        { label: 'Expenses', data: yoyExpense, backgroundColor: 'rgba(244,63,94,0.85)', borderRadius: 8 }
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text } },
        y: { grid: { color: c.grid }, ticks: { color: c.text, callback: v => fmt(v) } }
      }
    }
  });

  // Annual spending breakdown calculated across the current full year
  const annualExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === currentYr);
  const annualMap = {};
  annualExpenses.forEach(t => {
    annualMap[t.category] = (annualMap[t.category] || 0) + Number(t.amount);
  });

  const annualBreakdown = Object.entries(annualMap).map(([id, value]) => {
    const cat = getCatInfo(id);
    return { label: cat.label, value, color: cat.color };
  }).sort((a,b) => b.value - a.value);

  if (annualDonutChart) annualDonutChart.destroy();
  annualDonutChart = new Chart(annualCtx, {
    type: 'doughnut',
    data: {
      labels: annualBreakdown.length > 0 ? annualBreakdown.map(b => b.label) : ['No Data'],
      datasets: [{
        data: annualBreakdown.length > 0 ? annualBreakdown.map(b => b.value) : [1],
        backgroundColor: annualBreakdown.length > 0 ? annualBreakdown.map(b => b.color) : ['rgba(255,255,255,0.08)'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { labels: { color: c.text, font: { family: 'Inter', size: 12 } } },
        tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.parsed) } }
      }
    }
  });
}

document.getElementById('printReportBtn').addEventListener('click', () => window.print());

// ================================================
// 19. CSV IMPORT & EXPORT
// ================================================
document.getElementById('exportBtn').addEventListener('click', () => {
  if (transactions.length === 0) {
    showToast('No transactions to export!', 'info');
    return;
  }
  const headers = ['Date', 'Type', 'Category', 'Description', 'Tag', 'Amount', 'Notes'];
  const rows = transactions.map(t => [
    t.date, 
    t.type, 
    t.category, 
    `"${(t.description||'').replace(/"/g,'""')}"`, 
    t.tag||'', 
    t.amount,
    `"${(t.notes||'').replace(/"/g,'""')}"`
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob); 
  a.download = `FinTrack_Export_${thisMonthStr()}.csv`; 
  a.click();
  showToast('Transactions exported as CSV', 'success');
});

const csvModalOverlay = document.getElementById('csvModalOverlay');
const csvFileInput    = document.getElementById('csvFileInput');
const csvDropzone     = document.getElementById('csvDropzone');
let importedRows      = [];

document.getElementById('importCsvBtn').addEventListener('click', () => {
  importedRows = [];
  document.getElementById('csvPreview').style.display = 'none';
  csvModalOverlay.classList.add('open');
});

document.getElementById('csvModalClose').addEventListener('click', () => csvModalOverlay.classList.remove('open'));

// Robust CSV Line Parser supporting quotes & commas
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && line[i+1] === char) {
        cur += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function handleCsvFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    importedRows = [];

    if (lines.length <= 1) {
      showToast('CSV file is empty or missing data rows.', 'error');
      return;
    }

    const firstRow = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const hasHeader = firstRow.some(h => ['date', 'amount', 'type', 'description'].includes(h));
    
    let dateIdx = 0, typeIdx = 1, catIdx = 2, descIdx = 3, tagIdx = 4, amtIdx = 5, notesIdx = 6;
    
    if (hasHeader) {
      dateIdx = firstRow.findIndex(h => h.includes('date'));
      typeIdx = firstRow.findIndex(h => h.includes('type'));
      catIdx  = firstRow.findIndex(h => h.includes('cat'));
      descIdx = firstRow.findIndex(h => h.includes('desc') || h.includes('title') || h.includes('name'));
      tagIdx  = firstRow.findIndex(h => h.includes('tag'));
      amtIdx  = firstRow.findIndex(h => h.includes('amount') || h.includes('value') || h.includes('price'));
      notesIdx= firstRow.findIndex(h => h.includes('note'));
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach(line => {
      const cols = parseCsvLine(line);
      if (cols.length >= 2) {
        const rawAmt = amtIdx !== -1 && cols[amtIdx] !== undefined ? cols[amtIdx] : cols[cols.length - 1];
        const parsedAmount = Math.abs(parseFloat(String(rawAmt).replace(/[^0-9.-]+/g, ''))) || 0;
        
        if (parsedAmount > 0) {
          const rawDate = (dateIdx !== -1 && cols[dateIdx]) ? cols[dateIdx] : new Date().toISOString().split('T')[0];
          const rawType = (typeIdx !== -1 && cols[typeIdx]) ? cols[typeIdx].toLowerCase() : (cols[1] || 'expense').toLowerCase();
          const isIncome = rawType.includes('inc') || rawType.includes('cr') || rawType.includes('credit');
          
          importedRows.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            date: rawDate.length >= 10 ? rawDate.slice(0, 10) : new Date().toISOString().split('T')[0],
            type: isIncome ? 'income' : 'expense',
            category: (catIdx !== -1 && cols[catIdx] ? cols[catIdx].toLowerCase() : 'other_ex'),
            description: (descIdx !== -1 && cols[descIdx] ? cols[descIdx] : 'Imported Entry'),
            tag: (tagIdx !== -1 && cols[tagIdx] ? cols[tagIdx] : ''),
            amount: parsedAmount,
            notes: (notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : 'Imported via CSV')
          });
        }
      }
    });

    document.getElementById('csvPreview').style.display = 'block';
    document.getElementById('csvFileInfo').textContent = `Parsed ${importedRows.length} valid transactions from "${file.name}"`;
    showToast(`Ready to import ${importedRows.length} transactions.`, 'info');
  };
  reader.readAsText(file);
}

csvFileInput.addEventListener('change', (e) => {
  handleCsvFile(e.target.files[0]);
});

// Drag & drop support
if (csvDropzone) {
  ['dragenter', 'dragover'].forEach(name => {
    csvDropzone.addEventListener(name, (e) => {
      e.preventDefault();
      csvDropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    csvDropzone.addEventListener(name, (e) => {
      e.preventDefault();
      csvDropzone.classList.remove('dragover');
    });
  });

  csvDropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (file) handleCsvFile(file);
  });
}

document.getElementById('processCsvBtn').addEventListener('click', () => {
  if (importedRows.length > 0) {
    transactions.push(...importedRows);
    saveData('ft_transactions', transactions);
    csvModalOverlay.classList.remove('open');
    refreshDashboard();
    if (currentPage === 'transactions') renderTxnTable();
    showToast(`Successfully imported ${importedRows.length} transactions!`, 'success');
  }
});

// ================================================
// 20. NOTIFICATIONS SYSTEM
// ================================================
function checkNotifications() {
  const list  = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  const notifs = [];

  bills.filter(b => !b.paid).forEach(b => {
    notifs.push({ type: 'warn', text: `Bill <strong>${b.title}</strong> (${fmt(b.amount)}) is due on ${fmtDate(b.dueDate)}.` });
  });

  if (notifs.length > 0) {
    badge.textContent = notifs.length; badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  list.innerHTML = '';
  if (notifs.length === 0) {
    list.innerHTML = '<p class="no-notif">No pending notifications</p>';
    return;
  }
  notifs.forEach(n => {
    const d = document.createElement('div');
    d.className = 'notif-item';
    d.innerHTML = `<div class="notif-icon notif-warn"><i class="fas fa-bell"></i></div><div>${n.text}</div>`;
    list.appendChild(d);
  });
}

document.getElementById('notifBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = document.getElementById('notifPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
  if (!document.getElementById('notifPanel').contains(e.target) && e.target !== document.getElementById('notifBtn')) {
    document.getElementById('notifPanel').style.display = 'none';
  }
});

document.getElementById('clearNotifs').addEventListener('click', () => {
  document.getElementById('notifBadge').style.display = 'none';
  document.getElementById('notifList').innerHTML = '<p class="no-notif">No new notifications</p>';
});

// Budget Editor Page
function renderBudgetEditor() {
  const grid = document.getElementById('budgetEditorGrid');
  grid.innerHTML = '';
  EXPENSE_CATEGORIES.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'budget-editor-item';
    item.innerHTML = `
      <div class="budget-editor-item-header">
        <div class="budget-editor-icon" style="background:${cat.color}22; color:${cat.color}"><i class="${cat.icon}"></i></div>
        ${cat.label}
      </div>
      <div class="budget-editor-input-wrap">
        <span class="budget-editor-prefix">${(CURRENCIES[currentCurrency] || CURRENCIES.INR).symbol}</span>
        <input class="budget-editor-input" type="number" min="0" step="100" data-cat="${cat.id}" value="${budgets[cat.id]||''}" />
      </div>
    `;
    grid.appendChild(item);
  });
}

document.getElementById('saveBudgetsBtn').addEventListener('click', () => {
  document.querySelectorAll('.budget-editor-input').forEach(inp => {
    const cat = inp.getAttribute('data-cat');
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val >= 0) budgets[cat] = val;
  });
  saveData('ft_budgets', budgets);
  const conf = document.getElementById('saveConfirmation');
  conf.style.display = 'flex';
  setTimeout(() => conf.style.display = 'none', 2500);
  showToast('Monthly budgets saved!', 'success');
});

function updateChartThemes() {
  const c = getThemeColors();
  [barChart, lineChart].forEach(chart => {
    if (!chart || !chart.options.scales) return;
    chart.options.scales.x.grid.color = c.grid;
    chart.options.scales.y.grid.color = c.grid;
    chart.options.scales.x.ticks.color = c.text;
    chart.options.scales.y.ticks.color = c.text;
    chart.update();
  });
}

// Universal Close on Modal Backdrop click & Escape Key
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => {
      modal.classList.remove('open');
    });
  }
});

// ================================================
// 21. AUTH UI & SESSION MANAGEMENT
// ================================================
const authScreen       = document.getElementById('authScreen');
const tabSignIn        = document.getElementById('tabSignIn');
const tabSignUp        = document.getElementById('tabSignUp');
const signInForm       = document.getElementById('signInForm');
const signUpForm       = document.getElementById('signUpForm');
const loginError       = document.getElementById('loginError');
const signUpError      = document.getElementById('signUpError');
const guestLoginBtn    = document.getElementById('guestLoginBtn');
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
const modalLogoutBtn   = document.getElementById('modalLogoutBtn');

// Tab Switcher
tabSignIn.addEventListener('click', () => {
  tabSignIn.classList.add('active');
  tabSignUp.classList.remove('active');
  signInForm.style.display = 'flex';
  signUpForm.style.display = 'none';
  loginError.textContent  = '';
  signUpError.textContent = '';
});

tabSignUp.addEventListener('click', () => {
  tabSignUp.classList.add('active');
  tabSignIn.classList.remove('active');
  signUpForm.style.display = 'flex';
  signInForm.style.display = 'none';
  loginError.textContent  = '';
  signUpError.textContent = '';
});

// Sign In Form Submit
signInForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPassword').value.trim();

  const account = accounts.find(a => a.email.toLowerCase() === email);
  if (!account) {
    loginError.textContent = 'Account not found. Please create an account.';
    return;
  }
  if (account.password !== pass) {
    loginError.textContent = 'Incorrect password. Try again.';
    return;
  }

  currentSession = account.email;
  localStorage.setItem('ft_current_session', currentSession);
  authScreen.style.display = 'none';
  reloadCurrentUserData();
  checkPinOnLaunch();
  refreshDashboard();
  showToast(`Welcome back, ${userProfile.name}!`, 'success');
});

// Sign Up Form Submit
signUpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  signUpError.textContent = '';
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('regPassword').value.trim();

  if (!name || !email || !pass) return;

  const existing = accounts.find(a => a.email.toLowerCase() === email);
  if (existing) {
    signUpError.textContent = 'An account with this email already exists!';
    return;
  }

  const newAccount = { name, email, password: pass, createdAt: new Date().toISOString() };
  accounts.push(newAccount);
  saveRawData('ft_accounts', accounts);

  currentSession = email;
  localStorage.setItem('ft_current_session', currentSession);
  authScreen.style.display = 'none';
  reloadCurrentUserData();
  checkPinOnLaunch();
  refreshDashboard();
  showToast(`Account created! Welcome to FinTrack, ${name}.`, 'success');
});

// Guest Mode Login
guestLoginBtn.addEventListener('click', () => {
  currentSession = 'guest@fintrack.app';
  localStorage.setItem('ft_current_session', currentSession);
  authScreen.style.display = 'none';
  reloadCurrentUserData();
  checkPinOnLaunch();
  refreshDashboard();
  showToast('Logged in as Guest (Sandbox Mode)', 'info');
});

// Sign Out Handler with state cleanup
function signOutUser() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('ft_current_session');
    currentSession = null;
    transactions = [];
    budgets = {};
    goals = [];
    debts = [];
    bills = [];
    profileModalOverlay.classList.remove('open');
    authScreen.style.display = 'flex';
    showToast('You have been logged out.', 'info');
  }
}

if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', signOutUser);
if (modalLogoutBtn)   modalLogoutBtn.addEventListener('click', signOutUser);

function checkAuthSession() {
  if (!currentSession) {
    authScreen.style.display = 'flex';
  } else {
    authScreen.style.display = 'none';
    reloadCurrentUserData();
    checkPinOnLaunch();
    refreshDashboard();
  }
}

// ================================================
// 22. DEMO / SAMPLE DATA GENERATOR
// ================================================
function loadDemoData() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();

  function makeDate(monthsAgo, day) {
    const target = new Date(y, m - monthsAgo, day);
    return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  transactions = [
    // Current Month
    { id: 'd1',  type: 'income',  category: 'salary',     description: 'Monthly Corporate Salary', amount: 85000, date: makeDate(0, 1),  tag: '#work', recurring: true, recurringFreq: 'monthly' },
    { id: 'd2',  type: 'income',  category: 'freelance',  description: 'UI/UX Mobile Redesign',    amount: 28000, date: makeDate(0, 12), tag: '#sidegig', notes: 'Design sprint payment' },
    { id: 'd3',  type: 'expense', category: 'housing',    description: 'Apartment Monthly Rent',   amount: 18000, date: makeDate(0, 2),  tag: '#fixed', recurring: true, recurringFreq: 'monthly' },
    { id: 'd4',  type: 'expense', category: 'food',       description: 'Supermarket Groceries',    amount: 4600,  date: makeDate(0, 5),  tag: '#home' },
    { id: 'd5',  type: 'expense', category: 'utilities',  description: 'Broadband Fiber Internet', amount: 1499,  date: makeDate(0, 8),  tag: '#bills' },
    { id: 'd6',  type: 'expense', category: 'transport',  description: 'Fuel & EV Charging',       amount: 3200,  date: makeDate(0, 10), tag: '#commute' },
    { id: 'd7',  type: 'expense', category: 'food',       description: 'Weekend Dining & Sushi',   amount: 2800,  date: makeDate(0, 15), tag: '#fun' },
    { id: 'd8',  type: 'expense', category: 'shopping',   description: 'Wireless Headphones',      amount: 4500,  date: makeDate(0, 18), tag: '#gear' },
    { id: 'd9',  type: 'expense', category: 'health',     description: 'Annual Health Checkup',    amount: 2200,  date: makeDate(0, 20), tag: '#wellness' },

    // Previous Month
    { id: 'd10', type: 'income',  category: 'salary',     description: 'Monthly Corporate Salary', amount: 85000, date: makeDate(1, 1),  tag: '#work', recurring: true },
    { id: 'd11', type: 'income',  category: 'investment', description: 'Quarterly Stock Dividend', amount: 6400,  date: makeDate(1, 14), tag: '#passive' },
    { id: 'd12', type: 'expense', category: 'housing',    description: 'Apartment Monthly Rent',   amount: 18000, date: makeDate(1, 2),  tag: '#fixed' },
    { id: 'd13', type: 'expense', category: 'food',       description: 'Grocery Provisions',       amount: 5100,  date: makeDate(1, 7) },
    { id: 'd14', type: 'expense', category: 'entertainment', description: 'Concert Passes',        amount: 3500,  date: makeDate(1, 18), tag: '#vacation' },

    // 2 Months Ago
    { id: 'd15', type: 'income',  category: 'salary',     description: 'Monthly Corporate Salary', amount: 85000, date: makeDate(2, 1),  tag: '#work' },
    { id: 'd16', type: 'expense', category: 'housing',    description: 'Apartment Monthly Rent',   amount: 18000, date: makeDate(2, 2),  tag: '#fixed' },
    { id: 'd17', type: 'expense', category: 'shopping',   description: 'Home Office Ergonomic Chair', amount: 9200, date: makeDate(2, 12), tag: '#wfh' },

    // 3 Months Ago
    { id: 'd18', type: 'income',  category: 'salary',     description: 'Monthly Corporate Salary', amount: 85000, date: makeDate(3, 1),  tag: '#work' },
    { id: 'd19', type: 'expense', category: 'housing',    description: 'Apartment Monthly Rent',   amount: 18000, date: makeDate(3, 2),  tag: '#fixed' },
    { id: 'd20', type: 'expense', category: 'transport',  description: 'Vehicle Maintenance Service', amount: 6200, date: makeDate(3, 16) },
  ];

  budgets = {
    housing: 20000,
    food: 12000,
    transport: 6000,
    shopping: 8000,
    utilities: 3000,
    entertainment: 5000,
    health: 4000
  };

  goals = [
    { id: 'g1', title: '6-Month Emergency Fund', target: 250000, current: 165000, targetDate: makeDate(-6, 30) },
    { id: 'g2', title: 'Tokyo Autumn Trip',       target: 120000, current: 84000,  targetDate: makeDate(-4, 15) },
    { id: 'g3', title: 'M3 MacBook Pro Upgrade',  target: 180000, current: 95000,  targetDate: makeDate(-2, 28) },
  ];

  debts = [
    { id: 'db1', title: 'Car Loan (EV)', total: 450000, paid: 280000, interest: 7.8 },
    { id: 'db2', title: 'Premium Credit Card Balance', total: 45000, paid: 32000, interest: 13.5 },
  ];

  const nextDue = new Date(y, m, 25).toISOString().split('T')[0];
  const laterDue = new Date(y, m + 1, 5).toISOString().split('T')[0];

  bills = [
    { id: 'b1', title: 'Electricity & Grid Power', amount: 2450, dueDate: nextDue,  category: 'utilities', paid: false },
    { id: 'b2', title: 'Fiber Broadband',           amount: 1499, dueDate: laterDue, category: 'utilities', paid: false },
    { id: 'b3', title: 'Cloud Storage & Workspace', amount: 890,  dueDate: makeDate(0, 10), category: 'utilities', paid: true }
  ];

  saveData('ft_transactions', transactions);
  saveData('ft_budgets', budgets);
  saveData('ft_goals', goals);
  saveData('ft_debts', debts);
  saveData('ft_bills', bills);

  refreshDashboard();
  if (currentPage === 'transactions') renderTxnTable();
  if (currentPage === 'budget')       renderBudgetEditor();
  if (currentPage === 'savings')      renderSavingsGoals();
  if (currentPage === 'debts')        renderDebts();
  if (currentPage === 'bills')        renderBills();
  if (currentPage === 'calendar')     renderCalendar();
  if (currentPage === 'reports')      renderReports();

  showToast('Realistic demo data loaded successfully!', 'success');
}

const emptyDemoBtn = document.getElementById('emptyDemoBtn');
if (emptyDemoBtn) emptyDemoBtn.addEventListener('click', loadDemoData);

// ================================================
// 23. INIT LAUNCH
// ================================================
checkAuthSession();

console.log('%c💰 FinTrack Ultimate Loaded with Complete Features & Enhancements!', 'color: #6c63ff; font-size: 16px; font-weight: bold;');
