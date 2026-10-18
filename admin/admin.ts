// ==============================================================================
// PAPA SMURF — Damera Game Analytics & Monitoring Dashboard Application
// ==============================================================================

import { createIcons, icons } from 'lucide';

interface AdminState {
  token: string | null;
  activeTab: string;
  activeRange: string;
  isSidebarCollapsed: boolean;
  playerPage: number;
  playerSearch: string;
  playerSort: string;
  logsPage: number;
  logsSearch: string;
  logsEvent: string;
  logsPlatform: string;
}

const state: AdminState = {
  token: sessionStorage.getItem('damera_admin_token'),
  activeTab: 'overview',
  activeRange: '7d',
  isSidebarCollapsed: false,
  playerPage: 1,
  playerSearch: '',
  playerSort: 'last_seen',
  logsPage: 1,
  logsSearch: '',
  logsEvent: 'all',
  logsPlatform: 'all',
};

// ── 0. LUCIDE ICON RENDER HELPER ──────────────────────────────────────────────
export function refreshIcons() {
  try {
    createIcons({ icons });
  } catch (err) {
    console.error('[Lucide] Failed to render icons:', err);
  }
}

// ── 1. API HELPER WITH AUTOMATIC AUTH HEADER ─────────────────────────────────
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const res = await fetch(endpoint, { ...options, headers });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }
  return res.json();
}

function handleUnauthorized() {
  state.token = null;
  sessionStorage.removeItem('damera_admin_token');
  document.getElementById('auth-overlay')?.classList.remove('hidden');
  document.getElementById('dashboard-shell')?.classList.add('hidden');
  refreshIcons();
}

// ── 2. INITIALIZATION & AUTHENTICATION ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  refreshIcons();

  if (state.token) {
    try {
      const verify = await apiFetch('/api/admin/auth?action=verify');
      if (verify.ok) {
        showDashboard();
        loadActiveView();
        return;
      }
    } catch {
      // Token invalid or expired
    }
  }

  // Show login overlay by default
  document.getElementById('auth-overlay')?.classList.remove('hidden');
  refreshIcons();
});

function showDashboard() {
  document.getElementById('auth-overlay')?.classList.add('hidden');
  document.getElementById('dashboard-shell')?.classList.remove('hidden');
  refreshIcons();
}

// ── 3. EVENT LISTENERS SETUP ──────────────────────────────────────────────────
function setupEventListeners() {
  // Login Form Submission
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const errBox = document.getElementById('login-error');

    if (errBox) errBox.classList.add('hidden');

    try {
      const res = await fetch('/api/admin/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordInput.value.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        if (errBox) {
          errBox.textContent = data.error || 'Authentication failed. Please check credentials.';
          errBox.classList.remove('hidden');
        }
        return;
      }

      state.token = data.token;
      sessionStorage.setItem('damera_admin_token', data.token);
      showDashboard();
      loadActiveView();
    } catch (err: any) {
      if (errBox) {
        errBox.textContent = 'Server connection error. Please try again.';
        errBox.classList.remove('hidden');
      }
    }
  });

  // Logout Action
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    handleUnauthorized();
  });

  // Sidebar Collapse
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    state.isSidebarCollapsed = !state.isSidebarCollapsed;
    sidebar?.classList.toggle('collapsed', state.isSidebarCollapsed);
  });

  // Mobile Sidebar Toggle
  document.getElementById('mobile-sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('mobile-open');
  });

  // Navigation Items
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = (e.currentTarget as HTMLElement).getAttribute('data-tab');
      if (target) switchTab(target);
      // Close mobile drawer on item tap
      document.getElementById('sidebar')?.classList.remove('mobile-open');
    });
  });

  // Date Range Pills
  document.querySelectorAll('.date-selector .date-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.date-selector .date-pill').forEach(p => p.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      state.activeRange = target.getAttribute('data-range') || '7d';
      loadActiveView();
    });
  });

  // Manual Refresh Button
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-refresh');
    btn?.classList.add('rotating');
    loadActiveView().finally(() => {
      setTimeout(() => btn?.classList.remove('rotating'), 500);
    });
  });

  // Player search & sort
  let searchTimer: any = null;
  document.getElementById('player-search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.playerSearch = (e.target as HTMLInputElement).value;
      state.playerPage = 1;
      loadPlayersView();
    }, 300);
  });

  document.getElementById('player-sort-select')?.addEventListener('change', (e) => {
    state.playerSort = (e.target as HTMLSelectElement).value;
    loadPlayersView();
  });

  document.getElementById('btn-player-prev')?.addEventListener('click', () => {
    if (state.playerPage > 1) {
      state.playerPage--;
      loadPlayersView();
    }
  });

  document.getElementById('btn-player-next')?.addEventListener('click', () => {
    state.playerPage++;
    loadPlayersView();
  });

  // Logs search & filters
  document.getElementById('logs-search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.logsSearch = (e.target as HTMLInputElement).value;
      state.logsPage = 1;
      loadLogsView();
    }, 300);
  });

  document.getElementById('logs-event-select')?.addEventListener('change', (e) => {
    state.logsEvent = (e.target as HTMLSelectElement).value;
    state.logsPage = 1;
    loadLogsView();
  });

  document.getElementById('logs-platform-select')?.addEventListener('change', (e) => {
    state.logsPlatform = (e.target as HTMLSelectElement).value;
    state.logsPage = 1;
    loadLogsView();
  });

  document.getElementById('btn-logs-prev')?.addEventListener('click', () => {
    if (state.logsPage > 1) {
      state.logsPage--;
      loadLogsView();
    }
  });

  document.getElementById('btn-logs-next')?.addEventListener('click', () => {
    state.logsPage++;
    loadLogsView();
  });

  // Data Export Button
  document.getElementById('btn-export-json')?.addEventListener('click', async () => {
    try {
      const data = await apiFetch('/api/admin/settings?action=export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `damera_analytics_export_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data.');
    }
  });

  // ── Reset Analytics Modal Handling ──
  const resetModal = document.getElementById('reset-modal');
  const btnOpenReset = document.getElementById('btn-open-reset-modal');
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  const btnConfirmReset = document.getElementById('btn-confirm-reset') as HTMLButtonElement | null;
  const resetConfirmInput = document.getElementById('reset-confirm-input') as HTMLInputElement | null;

  btnOpenReset?.addEventListener('click', () => {
    if (resetConfirmInput) resetConfirmInput.value = '';
    if (btnConfirmReset) btnConfirmReset.disabled = true;
    resetModal?.classList.remove('hidden');
    refreshIcons();
  });

  btnCancelReset?.addEventListener('click', () => {
    resetModal?.classList.add('hidden');
  });

  resetConfirmInput?.addEventListener('input', () => {
    if (btnConfirmReset) {
      btnConfirmReset.disabled = resetConfirmInput.value.trim() !== 'RESET_DAMERA_ANALYTICS';
    }
  });

  btnConfirmReset?.addEventListener('click', async () => {
    if (!resetConfirmInput || resetConfirmInput.value.trim() !== 'RESET_DAMERA_ANALYTICS') return;

    btnConfirmReset.disabled = true;
    btnConfirmReset.innerHTML = '<i data-lucide="loader-circle" class="lucide-icon rotating"></i> <span>Resetting Analytics...</span>';
    refreshIcons();

    try {
      const res = await apiFetch('/api/admin/reset', {
        method: 'POST',
        body: JSON.stringify({ confirm: 'RESET_DAMERA_ANALYTICS' }),
      });

      if (res.ok) {
        resetModal?.classList.add('hidden');
        alert(`Analytics history reset successfully.\nFresh tracking period started: ${new Date(res.resetAt).toUTCString()}`);
        switchTab('overview');
      } else {
        alert(res.error || 'Failed to reset analytics.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while executing analytics reset.');
    } finally {
      if (btnConfirmReset) {
        btnConfirmReset.innerHTML = '<i data-lucide="trash-2"></i> <span>Confirm &amp; Reset All Analytics</span>';
        btnConfirmReset.disabled = true;
        refreshIcons();
      }
    }
  });
}

// ── 4. TAB NAVIGATION CONTROLLER ──────────────────────────────────────────────
function switchTab(tabId: string) {
  state.activeTab = tabId;

  document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-view').forEach((view) => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) activeView.classList.add('active');

  const heading = document.getElementById('page-heading');
  if (heading) {
    const titles: Record<string, string> = {
      overview: 'Dashboard Overview',
      players: 'Player Analytics',
      gameplay: 'Gameplay Performance',
      retention: 'Player Retention & Engagement',
      health: 'Technical Health Monitoring',
      logs: 'Events & Telemetry Logs',
      alerts: 'System Alerts & Monitoring Rules',
      settings: 'Configuration & Settings',
    };
    heading.textContent = titles[tabId] || 'Analytics';
  }

  loadActiveView();
}

async function loadActiveView() {
  switch (state.activeTab) {
    case 'overview':
      await loadOverviewView();
      break;
    case 'players':
      await loadPlayersView();
      break;
    case 'gameplay':
      await loadGameplayView();
      break;
    case 'retention':
      await loadRetentionView();
      break;
    case 'health':
      await loadHealthView();
      break;
    case 'logs':
      await loadLogsView();
      break;
    case 'alerts':
      await loadAlertsView();
      break;
    case 'settings':
      await loadSettingsView();
      break;
  }
}

// ── 5. VIEW LOADERS & RENDERERS ───────────────────────────────────────────────

/** 5.1 Overview View */
async function loadOverviewView() {
  try {
    const data = await apiFetch(`/api/admin/overview?range=${state.activeRange}`);
    if (!data.ok) return;

    // Update Storage Chip
    const storageChip = document.getElementById('storage-status-chip');
    if (storageChip) {
      if (data.storage?.isSupabase) {
        storageChip.innerHTML = '<i data-lucide="database" class="chip-icon"></i> Supabase PostgreSQL';
        storageChip.className = 'status-chip chip-green';
      } else {
        storageChip.innerHTML = '<i data-lucide="hard-drive" class="chip-icon"></i> Local Fallback Store';
        storageChip.className = 'status-chip chip-info';
      }
    }

    // Update Tracking Start Reference Banner (Task 4)
    const trackingBanner = document.getElementById('tracking-reference-banner');
    const trackingText = document.getElementById('tracking-reference-text');
    const trackingStart = data.storage?.trackingStartTime || data.trackingStartTime;
    if (trackingBanner && trackingText) {
      if (trackingStart) {
        const utcDate = new Date(trackingStart).toUTCString();
        const localDate = new Date(trackingStart).toLocaleTimeString();
        trackingText.textContent = `Fresh tracking period started on ${utcDate} (${localDate} local).`;
        trackingBanner.classList.remove('hidden');
      } else {
        trackingBanner.classList.add('hidden');
      }
    }

    // Populate KPIs
    const k = data.kpis;
    setText('kpi-total-players', (k.totalUniquePlayers || 0).toLocaleString());
    setText('kpi-dau', (k.dau || 0).toLocaleString());
    setText('kpi-live-online', (k.currentlyActivePlayers || 0).toLocaleString());
    setText('kpi-total-sessions', (k.totalSessions || 0).toLocaleString());
    setText('kpi-avg-duration', `${k.avgSessionDuration || 0}s`);
    setText('kpi-victory-rate', `${k.victoryRate || 0}%`);
    setText('kpi-game-over-rate', `Game Over: ${k.gameOverRate || 0}%`);

    // Render SVG Charts
    const c = data.charts;
    if (c) {
      renderAreaChart('chart-players', c.labels, c.playersTimeline, '#ff7043', 'Players');
      renderGroupedBarChart('chart-sessions', c.labels, c.winsTimeline, c.lossesTimeline, 'Victories', 'Game Overs');
      renderDonutChart('chart-players-ratio', k.newPlayers || 0, k.returningPlayers || 0, 'New Players', 'Returning');
      renderLineChart('chart-duration', c.labels, c.durationTimeline, '#43a047', 'Seconds');
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load overview:', err);
  }
}

/** 5.2 Players View */
async function loadPlayersView() {
  const tbody = document.getElementById('players-table-body');
  if (!tbody) return;

  try {
    const data = await apiFetch(
      `/api/admin/players?page=${state.playerPage}&limit=12&search=${encodeURIComponent(state.playerSearch)}&sort=${state.playerSort}`
    );

    if (!data.ok || !data.players || data.players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center">No players found in this tracking period.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.players.map((p: any) => `
      <tr>
        <td><code>${escapeHtml(p.anonymous_player_id)}</code></td>
        <td>
          <span class="badge ${p.is_returning ? 'badge-green' : 'badge-warning'}">
            ${p.is_returning ? 'Returning' : 'New'}
          </span>
        </td>
        <td>
          <span class="platform-chip">
            <i data-lucide="${p.is_telegram ? 'bot' : 'globe'}" style="width:13px;height:13px;margin-right:4px;"></i>
            ${escapeHtml(p.platform)}${p.is_telegram ? ' (TG)' : ''}
          </span>
        </td>
        <td><strong>${p.total_sessions}</strong></td>
        <td>${p.total_play_duration_seconds}s</td>
        <td class="text-gold"><strong>${p.victories}</strong></td>
        <td><strong class="text-green">${p.win_rate_pct}%</strong></td>
        <td><span class="diff-chip ${p.preferred_difficulty?.toLowerCase() || 'easy'}">${p.preferred_difficulty || '—'}</span></td>
        <td class="text-faint">${formatDate(p.first_seen)}</td>
        <td>${formatDate(p.last_seen)}</td>
      </tr>
    `).join('');

    const info = document.getElementById('player-pagination-info');
    if (info) {
      info.textContent = `Page ${data.pagination.page} of ${data.pagination.totalPages} (${data.pagination.total} players)`;
    }

    (document.getElementById('btn-player-prev') as HTMLButtonElement).disabled = data.pagination.page <= 1;
    (document.getElementById('btn-player-next') as HTMLButtonElement).disabled = data.pagination.page >= data.pagination.totalPages;

    refreshIcons();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-red">Failed to load players.</td></tr>`;
  }
}

/** 5.3 Gameplay View */
async function loadGameplayView() {
  try {
    const data = await apiFetch(`/api/admin/gameplay?range=${state.activeRange}`);
    if (!data.ok) return;

    // Difficulties
    const diff = data.difficultyStats;
    if (diff) {
      setText('easy-starts', diff.EASY?.starts || 0);
      setText('easy-wins', diff.EASY?.victories || 0);
      setText('easy-winrate', `${diff.EASY?.victoryRate || 0}%`);
      setText('easy-timeremain', `${diff.EASY?.avgTimeRemainingAtVictory || 0}s`);

      setText('meh-starts', diff.MEH?.starts || 0);
      setText('meh-wins', diff.MEH?.victories || 0);
      setText('meh-winrate', `${diff.MEH?.victoryRate || 0}%`);
      setText('meh-timeremain', `${diff.MEH?.avgTimeRemainingAtVictory || 0}s`);

      setText('hard-starts', diff.HARD?.starts || 0);
      setText('hard-wins', diff.HARD?.victories || 0);
      setText('hard-winrate', `${diff.HARD?.victoryRate || 0}%`);
      setText('hard-timeremain', `${diff.HARD?.avgTimeRemainingAtVictory || 0}s`);
    }

    // Wood & Mechanics
    const wood = data.woodStats;
    if (wood) {
      setText('wood-total-delivered', wood.totalWoodDelivered || 0);
      setText('wood-avg-game', wood.avgDeliveredPerGame || '0.0');
    }

    const restarts = data.restarts;
    if (restarts) {
      setText('wood-restarts', restarts.count || 0);
      setText('wood-abandonment', `${restarts.abandonmentRate || 0}%`);
    }

    // Funnel Chart
    if (data.funnel) {
      renderFunnelChart('chart-funnel', data.funnel);
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load gameplay view:', err);
  }
}

/** 5.4 Retention View */
async function loadRetentionView() {
  try {
    const data = await apiFetch(`/api/admin/retention?range=${state.activeRange}`);
    if (!data.ok) return;

    const r = data.retentionMetrics;
    setText('ret-d1', r.day1?.rate !== null && r.day1?.rate !== undefined ? `${r.day1.rate}%` : 'Collecting data');
    setText('ret-d7', r.day7?.rate !== null && r.day7?.rate !== undefined ? `${r.day7.rate}%` : 'Collecting data');
    setText('ret-d30', r.day30?.rate !== null && r.day30?.rate !== undefined ? `${r.day30.rate}%` : 'Collecting data');

    const d = data.durationMetrics;
    setText('ret-median-dur', `${d?.medianDurationSeconds || 0}s`);

    // Cohort Table
    const tbody = document.getElementById('cohorts-table-body');
    if (tbody && data.cohorts) {
      if (data.cohorts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No cohort data accumulated yet in this tracking period.</td></tr>`;
      } else {
        tbody.innerHTML = data.cohorts.map((c: any) => `
          <tr>
            <td><strong>${c.cohort}</strong></td>
            <td>${c.size}</td>
            <td><span class="badge badge-green">${c.d1}</span></td>
            <td>${c.d7}</td>
            <td>${c.d14}</td>
            <td>${c.d30}</td>
          </tr>
        `).join('');
      }
    }

    // Frequency Bar Chart
    if (data.frequencyDistribution) {
      renderBarChart(
        'chart-frequency',
        data.frequencyDistribution.map((f: any) => f.label),
        data.frequencyDistribution.map((f: any) => f.count),
        '#00b4d8'
      );
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load retention view:', err);
  }
}

/** 5.5 Technical Health View */
async function loadHealthView() {
  try {
    const data = await apiFetch('/api/admin/health');
    if (!data.ok) return;

    // Component cards
    const grid = document.getElementById('component-health-grid');
    if (grid && data.components) {
      grid.innerHTML = data.components.map((c: any) => `
        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-name">${c.name}</span>
            <span class="status-chip ${c.status === 'healthy' ? 'chip-green' : 'chip-info'}">
              ${c.status.toUpperCase()}
            </span>
          </div>
          <p class="comp-desc">${c.description}</p>
          <div class="comp-footer">Latency: ${c.latencyMs}ms</div>
        </div>
      `).join('');
    }

    // Telemetry evidence
    const m = data.metrics;
    setText('health-game-load', m.latestGameLoad ? new Date(m.latestGameLoad).toLocaleString() : 'Waiting for event');
    setText('health-ingestion', m.latestIngestion ? new Date(m.latestIngestion).toLocaleString() : 'Waiting for event');
    setText('health-total-events', (m.totalEventsIngested || 0).toLocaleString());
    setText('health-error-rate', m.errorRatePct || '0.00%');

    // Recent errors
    const errTable = document.getElementById('health-errors-table');
    if (errTable) {
      if (!data.recentErrors || data.recentErrors.length === 0) {
        errTable.innerHTML = `<tr><td colspan="4" class="text-center text-green"><i data-lucide="check-circle" style="width:15px;height:15px;vertical-align:middle;margin-right:6px;"></i>No client errors recorded. System healthy.</td></tr>`;
      } else {
        errTable.innerHTML = data.recentErrors.map((e: any) => `
          <tr>
            <td class="text-faint">${formatDate(e.timestamp)}</td>
            <td class="text-red"><code>${escapeHtml(e.message)}</code></td>
            <td>${escapeHtml(e.platform)}</td>
            <td>${e.isTelegram ? 'Telegram Mini App' : 'Web Browser'}</td>
          </tr>
        `).join('');
      }
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load health view:', err);
  }
}

/** 5.6 Events & Logs View */
async function loadLogsView() {
  const tbody = document.getElementById('logs-table-body');
  if (!tbody) return;

  try {
    const data = await apiFetch(
      `/api/admin/logs?page=${state.logsPage}&limit=15&search=${encodeURIComponent(state.logsSearch)}&event_type=${state.logsEvent}&platform=${state.logsPlatform}`
    );

    if (!data.ok || !data.logs || data.logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">No event logs recorded in current tracking window.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.logs.map((l: any) => `
      <tr>
        <td class="text-faint">${formatDate(l.timestamp)}</td>
        <td><code>${l.event_name}</code></td>
        <td><code>${escapeHtml(l.anonymous_player_id)}</code></td>
        <td><small class="text-muted">${l.session_id}</small></td>
        <td><span class="diff-chip ${l.difficulty?.toLowerCase() || ''}">${l.difficulty || '—'}</span></td>
        <td>
          <span class="platform-chip">
            <i data-lucide="${l.is_telegram ? 'bot' : 'globe'}" style="width:13px;height:13px;margin-right:4px;"></i>
            ${escapeHtml(l.platform)}${l.is_telegram ? ' (TG)' : ''}
          </span>
        </td>
        <td><small class="text-muted">${escapeHtml(JSON.stringify(l.properties))}</small></td>
      </tr>
    `).join('');

    const info = document.getElementById('logs-pagination-info');
    if (info) {
      info.textContent = `Page ${data.pagination.page} of ${data.pagination.totalPages} (${data.pagination.total} events)`;
    }

    (document.getElementById('btn-logs-prev') as HTMLButtonElement).disabled = data.pagination.page <= 1;
    (document.getElementById('btn-logs-next') as HTMLButtonElement).disabled = data.pagination.page >= data.pagination.totalPages;

    refreshIcons();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red">Failed to load event logs.</td></tr>`;
  }
}

/** 5.7 Alerts View */
async function loadAlertsView() {
  try {
    const data = await apiFetch('/api/admin/alerts');
    if (!data.ok) return;

    // Active alerts list
    const alertList = document.getElementById('active-alerts-list');
    if (alertList) {
      if (!data.activeAlerts || data.activeAlerts.length === 0) {
        alertList.innerHTML = `<div class="alert-banner alert-info"><i data-lucide="check-circle" style="width:15px;height:15px;vertical-align:middle;margin-right:6px;"></i>All systems operational. Zero active warnings.</div>`;
      } else {
        alertList.innerHTML = data.activeAlerts.map((a: any) => `
          <div class="alert-banner alert-${a.severity}">
            <div class="alert-msg">
              <strong>${escapeHtml(a.title)}</strong>: ${escapeHtml(a.message)}
            </div>
            <button class="btn btn-secondary btn-sm" onclick="acknowledgeAlert('${a.id}')">Acknowledge</button>
          </div>
        `).join('');
      }
    }

    // Rules table
    const rulesBody = document.getElementById('alert-rules-body');
    if (rulesBody && data.rules) {
      rulesBody.innerHTML = data.rules.map((r: any) => `
        <tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td><code>${escapeHtml(r.metric)}</code></td>
          <td>${escapeHtml(r.condition)}</td>
          <td><span class="badge ${r.severity === 'critical' ? 'badge-warning' : 'badge-green'}">${r.severity}</span></td>
          <td><span class="text-green"><i data-lucide="check" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i>Active</span></td>
        </tr>
      `).join('');
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load alerts view:', err);
  }
}

/** 5.8 Settings View */
async function loadSettingsView() {
  try {
    const data = await apiFetch('/api/admin/settings');
    if (!data.ok) return;

    const env = data.environment;
    const dbBadge = document.getElementById('setting-db-badge');
    if (dbBadge) {
      if (env.database.configured) {
        dbBadge.innerHTML = '<i data-lucide="check-circle" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i>Connected to Supabase';
        dbBadge.className = 'badge badge-green';
      } else {
        dbBadge.innerHTML = '<i data-lucide="hard-drive" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i>In-Memory Fallback Mode';
        dbBadge.className = 'badge badge-warning';
      }
    }

    const tgBadge = document.getElementById('setting-tg-badge');
    if (tgBadge) {
      if (env.telegram.tokenConfigured) {
        tgBadge.innerHTML = '<i data-lucide="check-circle" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i>Webhook Active';
        tgBadge.className = 'badge badge-green';
      } else {
        tgBadge.innerHTML = '<i data-lucide="triangle-alert" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i>Token Not Set in Vercel';
        tgBadge.className = 'badge badge-warning';
      }
    }

    refreshIcons();
  } catch (err) {
    console.error('Failed to load settings view:', err);
  }
}

// ── 6. PURE RESPONSIVE SVG CHART ENGINES ───────────────────────────────────────
function renderAreaChart(containerId: string, labels: string[], values: number[], color: string, valueUnit: string) {
  const container = document.getElementById(containerId);
  if (!container || labels.length === 0) return;

  const width = container.clientWidth || 500;
  const height = 200;
  const padL = 40, padR = 20, padT = 20, padB = 30;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...values, 5);
  const stepX = chartW / (labels.length - 1 || 1);

  const points = values.map((val, idx) => {
    const x = padL + idx * stepX;
    const y = padT + chartH - (val / maxVal) * chartH;
    return { x, y, val, label: labels[idx] };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${padT + chartH} L ${points[0].x.toFixed(1)} ${padT + chartH} Z`;

  container.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad-${containerId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <!-- Grid lines -->
      <line x1="${padL}" y1="${padT + chartH * 0.5}" x2="${width - padR}" y2="${padT + chartH * 0.5}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
      <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.1)"/>
      <!-- Area fill -->
      <path d="${areaD}" fill="url(#grad-${containerId})" />
      <!-- Stroke line -->
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Dots -->
      ${points.map(p => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${color}" stroke="#0a0e0a" stroke-width="1.5">
          <title>${p.label}: ${p.val} ${valueUnit}</title>
        </circle>
      `).join('')}
      <!-- Labels -->
      ${points.filter((_, idx) => idx % Math.ceil(labels.length / 7) === 0).map(p => `
        <text x="${p.x.toFixed(1)}" y="${height - 8}" font-size="10" fill="#718771" text-anchor="middle">${p.label}</text>
      `).join('')}
    </svg>
  `;
}

function renderGroupedBarChart(containerId: string, labels: string[], wins: number[], losses: number[], winLabel: string, lossLabel: string) {
  const container = document.getElementById(containerId);
  if (!container || labels.length === 0) return;

  const width = container.clientWidth || 500;
  const height = 200;
  const padL = 35, padR = 15, padT = 20, padB = 30;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...wins, ...losses, 4);
  const groupW = chartW / labels.length;
  const barW = Math.max(4, Math.min(14, groupW * 0.35));

  container.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
      <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.1)"/>
      ${labels.map((lbl, idx) => {
    const cx = padL + idx * groupW + groupW / 2;
    const wH = (wins[idx] / maxVal) * chartH;
    const lH = (losses[idx] / maxVal) * chartH;
    return `
          <rect x="${cx - barW - 1}" y="${padT + chartH - wH}" width="${barW}" height="${wH}" fill="#ffb300" rx="2">
            <title>${lbl} - ${winLabel}: ${wins[idx]}</title>
          </rect>
          <rect x="${cx + 1}" y="${padT + chartH - lH}" width="${barW}" height="${lH}" fill="#e53935" rx="2">
            <title>${lbl} - ${lossLabel}: ${losses[idx]}</title>
          </rect>
          <text x="${cx}" y="${height - 8}" font-size="10" fill="#718771" text-anchor="middle">${lbl}</text>
        `;
  }).join('')}
    </svg>
  `;
}

function renderDonutChart(containerId: string, val1: number, val2: number, lbl1: string, lbl2: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const total = val1 + val2;
  const pct1 = total > 0 ? Math.round((val1 / total) * 100) : 0;
  const pct2 = total > 0 ? 100 - pct1 : 0;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; padding: 10px;">
      <svg width="140" height="140" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1f291f" stroke-width="6"/>
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ff7043" stroke-width="6"
          stroke-dasharray="${pct1} ${100 - pct1}" stroke-dashoffset="25"/>
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2e7d32" stroke-width="6"
          stroke-dasharray="${pct2} ${100 - pct2}" stroke-dashoffset="${25 - pct1}"/>
        <text x="21" y="22" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle">${pct1}%</text>
      </svg>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #ff7043; border-radius: 2px;"></span>
          <span>${lbl1}: <strong>${val1} (${pct1}%)</strong></span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 10px; height: 10px; background: #2e7d32; border-radius: 2px;"></span>
          <span>${lbl2}: <strong>${val2} (${pct2}%)</strong></span>
        </div>
      </div>
    </div>
  `;
}

function renderLineChart(containerId: string, labels: string[], values: number[], color: string, unit: string) {
  renderAreaChart(containerId, labels, values, color, unit);
}

function renderBarChart(containerId: string, labels: string[], values: number[], color: string) {
  const container = document.getElementById(containerId);
  if (!container || labels.length === 0) return;

  const maxVal = Math.max(...values, 1);
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; padding: 10px;">
      ${labels.map((lbl, idx) => `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>${lbl}</span>
            <strong>${values[idx]}</strong>
          </div>
          <div style="background: #0c100c; border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="background: ${color}; height: 100%; width: ${(values[idx] / maxVal) * 100}%;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFunnelChart(containerId: string, steps: Array<{ step: string; count: number; pct: number }>) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; padding: 10px;">
      ${steps.map((s, idx) => {
    const colors = ['#2e7d32', '#ffb300', '#ff7043', '#ff5722'];
    const col = colors[idx % colors.length];
    return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span>${s.step}</span>
              <span><strong>${s.count}</strong> (${s.pct}%)</span>
            </div>
            <div style="background: #0c100c; border-radius: 4px; height: 12px; overflow: hidden;">
              <div style="background: ${col}; height: 100%; width: ${Math.max(5, s.pct)}%; transition: width 0.3s;"></div>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

// ── 7. UTILITY FUNCTIONS ──────────────────────────────────────────────────────
function setText(elemId: string, text: string | number) {
  const elem = document.getElementById(elemId);
  if (elem) elem.textContent = String(text);
}

function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoString;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m] || m));
}

(window as any).acknowledgeAlert = async (alertId: string) => {
  await apiFetch('/api/admin/alerts', {
    method: 'POST',
    body: JSON.stringify({ alert_id: alertId }),
  });
  loadAlertsView();
};
