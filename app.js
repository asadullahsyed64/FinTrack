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
// 1. LOCAL STORAGE STATE MANAGEMENT
// ================================================
function loadData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function saveData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

let transactions = loadData('ft_transactions', []);
let budgets      = loadData('ft_budgets', { housing: 15000, food: 10000, transport: 5000, shopping: 5000 });
let goals        = loadData('ft_goals', []);
let debts        = loadData('ft_debts', []);
let bills        = loadData('ft_bills', []);
let userProfile  = loadData('ft_user', { name: 'Asad Ullah', role: 'Personal Account', incomeTarget: 60000, pinEnabled: false, pin: '' });
let currentCurrency = localStorage.getItem('ft_currency') || 'INR';
let currentAccent   = localStorage.getItem('ft_accent')   || 'purple';

// ================================================
// 2. PWA SERVICE WORKER REGISTRATION
// ================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg error:', err));
  });
}

// ================================================
// 3. CURRENCY & FORMATTING ENGINE
// ================================================
const currencySelect = document.getElementById('currencySelect');
currencySelect.value = currentCurrency;

currencySelect.addEventListener('change', (e) => {
  currentCurrency = e.target.value;
  localStorage.setItem('ft_currency', currentCurrency);
  document.getElementById('formCurrencyPrefix').textContent = CURRENCIES[currentCurrency].symbol;
  refreshDashboard();
  if (currentPage === 'transactions') renderTxnTable();
});

function fmt(n) {
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.INR;
  return curr.symbol + Number(n || 0).toLocaleString(curr.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ================================================
// 4. ACCENT THEMES & COLOR PICKER
// ================================================
const html = document.documentElement;
html.setAttribute('data-accent', currentAccent);

const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorMenu      = document.getElementById('colorMenu');

colorPickerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  colorMenu.classList.toggle('open');
});

document.addEventListener('click', () => colorMenu.classList.remove('open'));

document.querySelectorAll('.color-dot').forEach(dot => {
  if (dot.getAttribute('data-accent') === currentAccent) {
    dot.classList.add('active');
  }
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    currentAccent = dot.getAttribute('data-accent');
    html.setAttribute('data-accent', currentAccent);
    localStorage.setItem('ft_accent', currentAccent);
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
});

function getThemeColors() {
  const dark = html.getAttribute('data-theme') === 'dark';
  return {
    grid: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
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
    alert('Please enable PIN lock in User Profile settings first!');
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

document.querySelectorAll('.key-btn[data-key]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (pinBuffer.length < 4) {
      pinBuffer += btn.getAttribute('data-key');
      updatePinDots();
      if (pinBuffer.length === 4) verifyPin();
    }
  });
});

document.getElementById('pinClear').addEventListener('click', () => {
  pinBuffer = '';
  pinError.textContent = '';
  updatePinDots();
});

document.getElementById('pinBackspace').addEventListener('click', () => {
  pinBuffer = pinBuffer.slice(0, -1);
  pinError.textContent = '';
  updatePinDots();
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
  const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'AS';
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent   = userProfile.name || 'User';
  document.getElementById('userRole').textContent   = userProfile.role || 'Personal Account';
}

const profileModalOverlay = document.getElementById('profileModalOverlay');
const userCardTrigger     = document.getElementById('userCardTrigger');
const profileModalClose   = document.getElementById('profileModalClose');
const profileForm         = document.getElementById('profileForm');

function openProfileModal() {
  document.getElementById('profName').value         = userProfile.name || '';
  document.getElementById('profIncomeTarget').value = userProfile.incomeTarget || '';
  document.getElementById('profPinEnable').checked  = userProfile.pinEnabled || false;
  document.getElementById('profPin').value          = userProfile.pin || '';
  document.getElementById('profPinInputWrap').style.display = userProfile.pinEnabled ? 'block' : 'none';
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
  refreshDashboard();
});

updateUserProfileUI();

// ================================================
// 7. SIDEBAR & PAGE NAVIGATION
// ================================================
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  setTimeout(() => { Object.values(charts).forEach(c => c && c.resize && c.resize()); }, 320);
});

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
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
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
  const sorted = [...txns].sort((a,b) => new Date(a.date) - new Date(b.date));
  let balance = 0;
  return sorted.map(t => {
    balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    return { date: t.date, balance };
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
// 11. DASHBOARD REFRESH
// ================================================
let filterMode = '6m';

function refreshDashboard() {
  const hasData = transactions.length > 0;
  document.getElementById('emptyState').style.display       = hasData ? 'none'  : 'flex';
  document.getElementById('dashboardContent').style.display    = hasData ? 'block' : 'none';

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
  [sparkIncome, sparkExpense, sparkSavings].forEach(s => s.update());

  // Bar Chart
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

  const recent = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  if (recent.length === 0) { noMsg.style.display = 'flex'; return; }
  noMsg.style.display = 'none';

  recent.forEach(txn => {
    const cat = getCatInfo(txn.category);
    const div = document.createElement('div');
    div.className = 'txn-item';
    div.innerHTML = `
      <div class="txn-icon" style="background:${cat.color}22; color:${cat.color}"><i class="${cat.icon}"></i></div>
      <div class="txn-details">
        <div class="txn-name">${txn.description}</div>
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
// 12. TRANSACTIONS PAGE & EDIT SYSTEM
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

  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

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
        <div style="font-weight:600">${txn.description}</div>
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
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const fabBtn       = document.getElementById('fabBtn');
const txnForm      = document.getElementById('txnForm');
const typeButtons  = document.querySelectorAll('.type-btn');
const catSelect    = document.getElementById('txnCategory');
let selectedType   = 'income';

function openModal(editId = null) {
  txnForm.reset();
  document.getElementById('editTxnId').value = editId || '';
  document.getElementById('modalTitle').textContent = editId ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('txnDate').valueAsDate = new Date();

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
  const editId = document.getElementById('editTxnId').value;
  const amount = parseFloat(document.getElementById('txnAmount').value);
  const catId  = document.getElementById('txnCategory').value;
  const desc   = document.getElementById('txnDesc').value.trim();
  const date   = document.getElementById('txnDate').value;
  const tag    = document.getElementById('txnTag').value.trim();
  const notes  = document.getElementById('txnNotes').value.trim();

  if (!amount || !catId || !desc || !date) return;

  if (editId) {
    const idx = transactions.findIndex(t => t.id === editId);
    if (idx !== -1) {
      transactions[idx] = { ...transactions[idx], type: selectedType, amount, category: catId, description: desc, date, tag, notes };
    }
  } else {
    transactions.push({
      id: Date.now().toString(),
      type: selectedType, amount, category: catId, description: desc, date, tag, notes
    });
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
  refreshDashboard();
  if (currentPage === 'transactions') renderTxnTable();
}

// ================================================
// 14. SAVINGS GOALS HUB
// ================================================
function renderSavingsGoals() {
  const grid = document.getElementById('goalsGrid');
  grid.innerHTML = '';

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
        <button class="goal-delete-btn" data-id="${goal.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.goal-deposit-btn').forEach(b => {
    b.addEventListener('click', () => openDepositModal(b.getAttribute('data-id')));
  });

  grid.querySelectorAll('.goal-delete-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (!confirm('Delete this savings goal?')) return;
      goals = goals.filter(g => g.id !== b.getAttribute('data-id'));
      saveData('ft_goals', goals);
      renderSavingsGoals();
    });
  });
}

const goalModalOverlay = document.getElementById('goalModalOverlay');
document.getElementById('addGoalBtn').addEventListener('click', () => goalModalOverlay.classList.add('open'));
document.getElementById('goalModalClose').addEventListener('click', () => goalModalOverlay.classList.remove('open'));

document.getElementById('goalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('goalTitle').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value);
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
  const targetDate = document.getElementById('goalTargetDate').value;

  if (!title || !target) return;
  goals.push({ id: Date.now().toString(), title, target, current, targetDate });
  saveData('ft_goals', goals);
  goalModalOverlay.classList.remove('open');
  document.getElementById('goalForm').reset();
  renderSavingsGoals();
});

const depositModalOverlay = document.getElementById('depositModalOverlay');
function openDepositModal(id) {
  document.getElementById('depositGoalId').value = id;
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
    if (action === 'deposit') g.current += amount;
    else g.current = Math.max(0, g.current - amount);
    saveData('ft_goals', goals);
    renderSavingsGoals();
  }
  depositModalOverlay.classList.remove('open');
});

// ================================================
// 15. DEBT & EMI TRACKER
// ================================================
function renderDebts() {
  const grid = document.getElementById('debtsGrid');
  grid.innerHTML = '';

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
        <button class="delete-debt-btn" data-id="${debt.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.pay-debt-btn').forEach(b => {
    b.addEventListener('click', () => {
      const amt = prompt('Enter payment amount:');
      if (amt && !isNaN(amt)) {
        const d = debts.find(item => item.id === b.getAttribute('data-id'));
        if (d) {
          d.paid += parseFloat(amt);
          saveData('ft_debts', debts);
          renderDebts();
        }
      }
    });
  });

  grid.querySelectorAll('.delete-debt-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (!confirm('Delete this debt entry?')) return;
      debts = debts.filter(d => d.id !== b.getAttribute('data-id'));
      saveData('ft_debts', debts);
      renderDebts();
    });
  });
}

const debtModalOverlay = document.getElementById('debtModalOverlay');
document.getElementById('addDebtBtn').addEventListener('click', () => debtModalOverlay.classList.add('open'));
document.getElementById('debtModalClose').addEventListener('click', () => debtModalOverlay.classList.remove('open'));

document.getElementById('debtForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title    = document.getElementById('debtTitle').value.trim();
  const total    = parseFloat(document.getElementById('debtTotal').value);
  const paid     = parseFloat(document.getElementById('debtPaid').value) || 0;
  const interest = parseFloat(document.getElementById('debtInterest').value) || 0;

  if (!title || !total) return;
  debts.push({ id: Date.now().toString(), title, total, paid, interest });
  saveData('ft_debts', debts);
  debtModalOverlay.classList.remove('open');
  document.getElementById('debtForm').reset();
  renderDebts();
});

// ================================================
// 16. BILL REMINDERS & RECURRING PAYMENTS
// ================================================
function renderBills() {
  const wrap = document.getElementById('billsListWrap');
  wrap.innerHTML = '';

  bills.forEach(bill => {
    const isOverdue = !bill.paid && new Date(bill.dueDate) < new Date();
    const item = document.createElement('div');
    item.className = 'bill-item';
    item.innerHTML = `
      <div class="bill-info">
        <div class="bill-icon"><i class="fas fa-file-invoice-dollar"></i></div>
        <div>
          <div class="bill-name">${bill.title}</div>
          <div class="bill-date">Due: ${fmtDate(bill.dueDate)}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:16px">
        <div style="font-size:16px; font-weight:700">${fmt(bill.amount)}</div>
        <span class="bill-status ${bill.paid ? 'paid' : isOverdue ? 'overdue' : 'due-soon'}">${bill.paid ? 'Paid' : isOverdue ? 'Overdue' : 'Due Soon'}</span>
        ${!bill.paid ? `<button class="btn-sm pay-bill-btn" data-id="${bill.id}">Mark Paid</button>` : ''}
        <button class="action-icon-btn delete-bill-btn" data-id="${bill.id}"><i class="fas fa-trash-alt"></i></button>
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
        // Auto Log Expense Transaction
        transactions.push({
          id: Date.now().toString(),
          type: 'expense', amount: bill.amount, category: 'utilities', description: `Bill: ${bill.title}`, date: new Date().toISOString().split('T')[0]
        });
        saveData('ft_transactions', transactions);
        renderBills();
        refreshDashboard();
      }
    });
  });

  wrap.querySelectorAll('.delete-bill-btn').forEach(b => {
    b.addEventListener('click', () => {
      bills = bills.filter(item => item.id !== b.getAttribute('data-id'));
      saveData('ft_bills', bills);
      renderBills();
    });
  });
}

const billModalOverlay = document.getElementById('billModalOverlay');
document.getElementById('addBillBtn').addEventListener('click', () => billModalOverlay.classList.add('open'));
document.getElementById('billModalClose').addEventListener('click', () => billModalOverlay.classList.remove('open'));

document.getElementById('billForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title   = document.getElementById('billTitle').value.trim();
  const amount  = parseFloat(document.getElementById('billAmount').value);
  const dueDate = document.getElementById('billDueDate').value;

  if (!title || !amount || !dueDate) return;
  bills.push({ id: Date.now().toString(), title, amount, dueDate, paid: false });
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

    const spent = dayTxns.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
    const inc   = dayTxns.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0);

    const cell = document.createElement('div');
    const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    cell.className = `cal-day ${isToday ? 'today' : ''}`;
    cell.innerHTML = `
      <div class="cal-day-num">${day}</div>
      <div>
        ${inc > 0 ? `<div class="cal-day-income">+${fmt(inc)}</div>` : ''}
        ${spent > 0 ? `<div class="cal-day-spent">-${fmt(spent)}</div>` : ''}
      </div>
    `;

    cell.addEventListener('click', () => openDayDetailModal(dateStr, dayTxns));
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

function openDayDetailModal(dateStr, dayTxns) {
  document.getElementById('dayDetailTitle').textContent = `Activity for ${fmtDate(dateStr)}`;
  const content = document.getElementById('dayDetailContent');
  content.innerHTML = '';

  if (dayTxns.length === 0) {
    content.innerHTML = '<p style="color:var(--text-muted)">No transactions recorded for this day.</p>';
  } else {
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
      content.appendChild(div);
    });
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

  if (yoyChart) yoyChart.destroy();
  yoyChart = new Chart(yoyCtx, {
    type: 'bar',
    data: {
      labels: years.map(String),
      datasets: [
        { label: 'Income', data: yoyIncome, backgroundColor: 'rgba(16,185,129,0.85)' },
        { label: 'Expenses', data: yoyExpense, backgroundColor: 'rgba(244,63,94,0.85)' }
      ]
    },
    options: CHART_DEFAULTS
  });

  const annualBreakdown = getCategoryBreakdown(thisMonthStr());
  if (annualDonutChart) annualDonutChart.destroy();
  annualDonutChart = new Chart(annualCtx, {
    type: 'doughnut',
    data: {
      labels: annualBreakdown.map(b => b.label),
      datasets: [{ data: annualBreakdown.map(b => b.value), backgroundColor: annualBreakdown.map(b => b.color) }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%' }
  });
}

document.getElementById('printReportBtn').addEventListener('click', () => window.print());

// ================================================
// 19. CSV IMPORT & EXPORT
// ================================================
document.getElementById('exportBtn').addEventListener('click', () => {
  if (transactions.length === 0) return alert('No transactions to export!');
  const headers = ['Date', 'Type', 'Category', 'Description', 'Tag', 'Amount'];
  const rows = transactions.map(t => [t.date, t.type, t.category, `"${(t.description||'').replace(/"/g,'""')}"`, t.tag||'', t.amount].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `FinTrack_${thisMonthStr()}.csv`; a.click();
});

const csvModalOverlay = document.getElementById('csvModalOverlay');
const csvFileInput    = document.getElementById('csvFileInput');
let importedRows      = [];

document.getElementById('importCsvBtn').addEventListener('click', () => csvModalOverlay.classList.add('open'));
document.getElementById('csvModalClose').addEventListener('click', () => csvModalOverlay.classList.remove('open'));

csvFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const text = evt.target.result;
    const lines = text.split('\n').filter(Boolean);
    importedRows = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(',');
      if (cols.length >= 4) {
        importedRows.push({
          id: Date.now().toString() + Math.random(),
          date: cols[0].trim() || new Date().toISOString().split('T')[0],
          type: (cols[1]||'expense').toLowerCase().includes('inc') ? 'income' : 'expense',
          category: cols[2].trim().toLowerCase() || 'other_ex',
          description: (cols[3]||'Imported').replace(/"/g,'').trim(),
          amount: parseFloat(cols[5] || cols[4]) || 100
        });
      }
    });
    document.getElementById('csvPreview').style.display = 'block';
    document.getElementById('csvFileInfo').textContent = `Loaded ${importedRows.length} valid transactions from ${file.name}`;
  };
  reader.readAsText(file);
});

document.getElementById('processCsvBtn').addEventListener('click', () => {
  if (importedRows.length > 0) {
    transactions.push(...importedRows);
    saveData('ft_transactions', transactions);
    csvModalOverlay.classList.remove('open');
    refreshDashboard();
    alert(`Successfully imported ${importedRows.length} transactions!`);
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

// Budget Editor Page Save
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
        <span class="budget-editor-prefix">${CURRENCIES[currentCurrency].symbol}</span>
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

// ================================================
// 21. INIT LAUNCH
// ================================================
checkPinOnLaunch();
refreshDashboard();

console.log('%c💰 FinTrack Ultimate Loaded!', 'color: #6c63ff; font-size: 18px; font-weight: bold;');
