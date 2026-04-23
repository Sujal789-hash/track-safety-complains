// ===== SAFETRACK APP =====
// The API key is configured server-side in .env.local — never in client code.

// ===== NAVIGATION =====
let chatHistory = [];

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'analytics') renderAnalytics();
    closeSidebar();
  });
});

// Mobile sidebar
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});
overlay.addEventListener('click', closeSidebar);
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// Enter key for chat
document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

// ===== CHAT =====
function quickSend(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendMessage(text, 'user');
  chatHistory.push({ role: 'user', content: text });

  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;

  const typingEl = appendTyping();

  try {
    const reply = await callClaude(text);
    typingEl.remove();
    appendMessage(reply, 'bot');
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    typingEl.remove();
    appendMessage('Sorry, I had trouble connecting. Please ensure the server is running and GROK_API_KEY is set in .env.local.', 'bot');
  }

  sendBtn.disabled = false;
  input.focus();
}

function appendMessage(text, role) {
  const msgs = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'bot' ? 'ST' : 'YOU';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  // Safely render newlines as <br> without exposing innerHTML to raw input
  text.split('\n').forEach((line, i) => {
    if (i > 0) bubble.appendChild(document.createElement('br'));
    bubble.appendChild(document.createTextNode(line));
  });

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return wrap;
}

function appendTyping() {
  const msgs = document.getElementById('chat-messages');
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.innerHTML = `<div class="msg-avatar">ST</div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return wrap;
}

async function callClaude(userMsg) {
  const systemPrompt = `You are SafeTrack, a professional safety complaints assistant for the general public.

Current complaints database (${COMPLAINTS.length} total):
${JSON.stringify(COMPLAINTS, null, 2)}

Statistics:
- Open: ${COMPLAINTS.filter(c => c.status === 'Open').length}
- In Progress: ${COMPLAINTS.filter(c => c.status === 'In Progress').length}
- Resolved: ${COMPLAINTS.filter(c => c.status === 'Resolved').length}
- High severity: ${COMPLAINTS.filter(c => c.sev === 'High').length}

Your capabilities:
1. FILE complaints — guide the user to collect: description, category (Fire/Chemical/Infrastructure/Equipment/Security/Other), severity (High/Medium/Low), location. Assign next ID: ${getNextId()}.
2. STATUS checks — filter by open/resolved/in progress, category, or severity and list clearly.
3. SUMMARIES — total counts, resolution rates, most common issues, trends.
4. SAFETY advice — answer questions about safety procedures.

Be concise, professional, and helpful. Format lists clearly using line breaks. Keep responses under 220 words. When listing complaints, show ID, description, severity, and status. If someone wants to file a complaint, collect all required info then confirm it with a summary.`;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: chatHistory,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API error');
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response received.';
}

// ===== HELPER: pill classes =====
function catPill(cat) {
  const map = { Fire: 'pill-fire', Chemical: 'pill-chemical', Infrastructure: 'pill-infra', Equipment: 'pill-equipment', Security: 'pill-security' };
  return `<span class="pill ${map[cat] || 'pill-other'}">${cat}</span>`;
}
function sevPill(sev) {
  const map = { High: 'pill-high', Medium: 'pill-medium', Low: 'pill-low' };
  return `<span class="pill ${map[sev] || ''}">${sev}</span>`;
}
function stPill(st) {
  const map = { Open: 'pill-open', 'In Progress': 'pill-progress', Resolved: 'pill-resolved' };
  return `<span class="pill ${map[st] || ''}">${st}</span>`;
}

// ===== DASHBOARD =====
let activeFilter = 'all';

function renderDashboard() {
  const open = COMPLAINTS.filter(c => c.status === 'Open').length;
  const inprog = COMPLAINTS.filter(c => c.status === 'In Progress').length;
  const resolved = COMPLAINTS.filter(c => c.status === 'Resolved').length;
  const high = COMPLAINTS.filter(c => c.sev === 'High').length;
  const rate = Math.round((resolved / COMPLAINTS.length) * 100);

  const filtered = activeFilter === 'all' ? COMPLAINTS :
    COMPLAINTS.filter(c => c.status.toLowerCase().replaceAll(' ', '') === activeFilter ||
      c.sev.toLowerCase() === activeFilter);

  document.getElementById('dashboard-body').innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Complaints</div>
        <div class="metric-val">${COMPLAINTS.length}</div>
        <div class="metric-sub">All time</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Open</div>
        <div class="metric-val" style="color:var(--red)">${open}</div>
        <div class="metric-sub">Awaiting action</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">In Progress</div>
        <div class="metric-val" style="color:var(--amber)">${inprog}</div>
        <div class="metric-sub">Being handled</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Resolved</div>
        <div class="metric-val" style="color:var(--green)">${resolved}</div>
        <div class="metric-sub">${rate}% resolution rate</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-card-header">
        <span class="table-card-title">All Complaints</span>
        <div class="filter-row">
          <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">All</button>
          <button class="filter-btn ${activeFilter === 'open' ? 'active' : ''}" onclick="setFilter('open')">Open</button>
          <button class="filter-btn ${activeFilter === 'inprogress' ? 'active' : ''}" onclick="setFilter('inprogress')">In Progress</button>
          <button class="filter-btn ${activeFilter === 'resolved' ? 'active' : ''}" onclick="setFilter('resolved')">Resolved</button>
          <button class="filter-btn ${activeFilter === 'high' ? 'active' : ''}" onclick="setFilter('high')">High</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="complaints-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Location</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(c => `
              <tr>
                <td style="color:var(--text3);font-size:12px">${c.id}</td>
                <td style="max-width:260px">${c.desc}</td>
                <td>${catPill(c.cat)}</td>
                <td>${sevPill(c.sev)}</td>
                <td>${stPill(c.status)}</td>
                <td style="color:var(--text2)">${c.loc}</td>
                <td style="color:var(--text3);font-size:12px">${c.date}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function setFilter(f) {
  activeFilter = f;
  renderDashboard();
}

// ===== ANALYTICS =====
function renderAnalytics() {
  const cats = {};
  const sevs = { High: 0, Medium: 0, Low: 0 };
  const statuses = { Open: 0, 'In Progress': 0, Resolved: 0 };
  COMPLAINTS.forEach(c => {
    cats[c.cat] = (cats[c.cat] || 0) + 1;
    sevs[c.sev]++;
    statuses[c.status]++;
  });

  const catColors = { Fire: '#f87171', Chemical: '#fbbf24', Infrastructure: '#60a5fa', Equipment: '#f472b6', Security: '#34d399', Other: '#a78bfa' };
  const maxCat = Math.max(...Object.values(cats));

  const highOpen = COMPLAINTS.filter(c => c.sev === 'High' && c.status === 'Open');

  // Simple SVG donut
  const total = COMPLAINTS.length;
  const seg = (val, start, color) => {
    const r = 40, cx = 54, cy = 54;
    const a1 = (start / total) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((start + val) / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = val / total > 0.5 ? 1 : 0;
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${color}" opacity="0.85"/>`;
  };
  let start = 0;
  const donutPaths = [
    seg(statuses['Open'], start, '#f87171'), (start += statuses['Open']),
    seg(statuses['In Progress'], start, '#fbbf24'), (start += statuses['In Progress']),
    seg(statuses['Resolved'], start, '#34d399'),
  ].filter(p => typeof p === 'string').join('');

  document.getElementById('analytics-body').innerHTML = `
    <div class="analytics-grid">
      <div class="chart-card">
        <div class="chart-title">Complaints by category</div>
        ${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
          <div class="bar-row">
            <span class="bar-label">${k}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v / maxCat * 100)}%;background:${catColors[k] || '#a78bfa'}"></div></div>
            <span class="bar-num">${v}</span>
          </div>`).join('')}
      </div>

      <div class="chart-card">
        <div class="chart-title">Status overview</div>
        <div class="donut-wrap">
          <svg width="108" height="108" viewBox="0 0 108 108" style="flex-shrink:0">
            <circle cx="54" cy="54" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="18"/>
            ${donutPaths}
            <circle cx="54" cy="54" r="26" fill="#13141c"/>
            <text x="54" y="50" text-anchor="middle" fill="#e8e6f0" font-size="16" font-weight="700" font-family="Syne">${total}</text>
            <text x="54" y="63" text-anchor="middle" fill="#5c5b6b" font-size="9" font-family="DM Sans">total</text>
          </svg>
          <div class="donut-legend">
            <div class="legend-item"><div class="legend-dot" style="background:#f87171"></div>Open (${statuses['Open']})</div>
            <div class="legend-item"><div class="legend-dot" style="background:#fbbf24"></div>In Progress (${statuses['In Progress']})</div>
            <div class="legend-item"><div class="legend-dot" style="background:#34d399"></div>Resolved (${statuses['Resolved']})</div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">Severity breakdown</div>
        ${[['High', '#f87171'], ['Medium', '#fbbf24'], ['Low', '#34d399']].map(([s, c]) => `
          <div class="bar-row">
            <span class="bar-label">${s}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round(sevs[s] / total * 100)}%;background:${c}"></div></div>
            <span class="bar-num">${sevs[s]}</span>
          </div>`).join('')}
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <div style="font-size:12px;color:var(--text2)">Resolution rate</div>
          <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:700;color:var(--green);margin-top:4px">${Math.round(statuses['Resolved'] / total * 100)}%</div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">Monthly trend (Apr 2026)</div>
        ${buildMiniTrend()}
      </div>
    </div>

    <div class="chart-card" style="margin-bottom:20px">
      <div class="chart-title" style="color:var(--red)">⚠ High-severity open complaints — requires immediate attention</div>
      <div class="priority-list">
        ${highOpen.length === 0 ? '<p style="color:var(--text3);font-size:13px">No high-severity open complaints.</p>' :
      highOpen.map(c => `
          <div class="priority-item">
            <span class="c-id">${c.id}</span>
            <span class="c-desc">${c.desc}</span>
            <span class="c-loc">${c.loc}</span>
            ${catPill(c.cat)}
            ${stPill(c.status)}
          </div>`).join('')}
      </div>
    </div>
  `;
}

function buildMiniTrend() {
  const byDate = {};
  COMPLAINTS.forEach(c => { byDate[c.date] = (byDate[c.date] || 0) + 1; });
  const sorted = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
  const max = Math.max(...sorted.map(e => e[1]));
  const w = 280, h = 80;
  if (sorted.length < 2) return '<p style="color:var(--text3);font-size:13px">Not enough data for trend.</p>';

  const pts = sorted.map((e, i) => {
    const x = 10 + (i / (sorted.length - 1)) * (w - 20);
    const y = h - 10 - ((e[1] / max) * (h - 20));
    return `${x},${y}`;
  }).join(' ');

  return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block;margin-top:8px">
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    ${sorted.map((e, i) => {
    const x = 10 + (i / (sorted.length - 1)) * (w - 20);
    const y = h - 10 - ((e[1] / max) * (h - 20));
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--accent)"/>
        <text x="${x}" y="${h}" text-anchor="middle" fill="#5c5b6b" font-size="9" font-family="DM Sans">${e[0].slice(5)}</text>`;
  }).join('')}
  </svg>`;
}

// ===== FILE COMPLAINT FORM =====
function submitComplaint() {
  const desc = document.getElementById('f-desc').value.trim();
  const cat = document.getElementById('f-cat').value;
  const sev = document.getElementById('f-sev').value;
  const loc = document.getElementById('f-loc').value.trim();
  const name = document.getElementById('f-name').value.trim();
  const notes = document.getElementById('f-notes').value.trim();

  const msg = document.getElementById('form-msg');
  msg.className = '';
  msg.style.display = 'none';

  if (!desc || !cat || !sev || !loc) {
    msg.textContent = 'Please fill in all required fields (description, category, severity, location).';
    msg.className = 'error';
    msg.style.display = '';
    return;
  }

  const submitBtn = document.querySelector('.btn-submit');
  submitBtn.disabled = true;

  const full = notes ? `${desc}. ${notes}` : desc;
  const complaint = addComplaint({ desc: full, cat, sev, loc, reporter: name || 'Anonymous' });

  msg.textContent = `Complaint ${complaint.id} submitted successfully! It has been logged as ${sev} severity and is now Open.`;
  msg.className = 'success';
  msg.style.display = '';

  // Clear the form fields only, leave the success message visible
  ['f-desc', 'f-cat', 'f-sev', 'f-loc', 'f-name', 'f-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });

  submitBtn.disabled = false;
}

function clearForm() {
  ['f-desc', 'f-cat', 'f-sev', 'f-loc', 'f-name', 'f-notes'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
  });
  const msg = document.getElementById('form-msg');
  msg.textContent = '';
  msg.className = '';
  msg.style.display = 'none';
}
