// ===== SAFETRACK DATA =====
// This file holds complaint data. In a real deployment, this would connect to a database.

const COMPLAINTS = [
  { id: 'SC-001', desc: 'Exposed electrical wiring near main entrance', cat: 'Infrastructure', sev: 'High',   status: 'Open',        date: '2026-04-10', loc: 'Building A', reporter: 'John M.' },
  { id: 'SC-002', desc: 'Chemical spill not cleaned in laboratory area', cat: 'Chemical',       sev: 'High',   status: 'In Progress', date: '2026-04-09', loc: 'Lab 3',       reporter: 'Sarah K.' },
  { id: 'SC-003', desc: 'Fire exit blocked by storage boxes',            cat: 'Fire',           sev: 'High',   status: 'Resolved',    date: '2026-04-08', loc: 'Warehouse',   reporter: 'Anonymous' },
  { id: 'SC-004', desc: 'Broken safety railing on main staircase',       cat: 'Infrastructure', sev: 'Medium', status: 'Open',        date: '2026-04-07', loc: 'Floor 2',     reporter: 'David R.' },
  { id: 'SC-005', desc: 'Faulty smoke detector not triggering alarms',   cat: 'Fire',           sev: 'Medium', status: 'In Progress', date: '2026-04-06', loc: 'Office B',    reporter: 'Anonymous' },
  { id: 'SC-006', desc: 'Unsafe scaffolding on active construction site', cat: 'Equipment',      sev: 'High',   status: 'Open',        date: '2026-04-05', loc: 'Site C',      reporter: 'Raj P.' },
  { id: 'SC-007', desc: 'Suspicious unattended package near reception',  cat: 'Security',       sev: 'Medium', status: 'Resolved',    date: '2026-04-04', loc: 'Reception',   reporter: 'Lisa T.' },
  { id: 'SC-008', desc: 'Slippery floor with no warning sign present',   cat: 'Infrastructure', sev: 'Low',    status: 'Resolved',    date: '2026-04-03', loc: 'Corridor 1',  reporter: 'Anonymous' },
  { id: 'SC-009', desc: 'Gas leak smell detected in storage room',       cat: 'Chemical',       sev: 'High',   status: 'Open',        date: '2026-04-11', loc: 'Storage',     reporter: 'Mike A.' },
  { id: 'SC-010', desc: 'Broken CCTV camera at emergency exit B',        cat: 'Security',       sev: 'Low',    status: 'Open',        date: '2026-04-12', loc: 'Exit B',      reporter: 'Anonymous' },
  { id: 'SC-011', desc: 'Heavy machinery left unsecured overnight',      cat: 'Equipment',      sev: 'Medium', status: 'Resolved',    date: '2026-04-02', loc: 'Depot',       reporter: 'Chris W.' },
  { id: 'SC-012', desc: 'Missing protective gear in chemical storage',   cat: 'Chemical',       sev: 'Medium', status: 'In Progress', date: '2026-04-01', loc: 'Storage',     reporter: 'Priya S.' },
];

// Generate next complaint ID
function getNextId() {
  const nums = COMPLAINTS.map(c => parseInt(c.id.replace('SC-', '')));
  const max = Math.max(...nums);
  return 'SC-' + String(max + 1).padStart(3, '0');
}

// Add new complaint
function addComplaint(data) {
  const complaint = {
    id: getNextId(),
    desc: data.desc,
    cat: data.cat,
    sev: data.sev,
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    loc: data.loc,
    reporter: data.reporter || 'Anonymous',
  };
  COMPLAINTS.unshift(complaint);
  return complaint;
}
