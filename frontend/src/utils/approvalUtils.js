/**
 * Approval Utilities for ATLAS.PAY Parent Approval Portal
 *
 * Provides pure helper functions for:
 * - Filtering and validating pending guardian approvals
 * - Formatting approval timestamps (prioritizing requested_at)
 * - State machine resolution for error, loading, and empty list states
 */

/**
 * Filter and validate pending approval records from the guardian API response.
 *
 * Requirements:
 * - Non-empty approval ID (id or approval_id)
 * - Status must be PENDING (case-insensitive)
 * - Must match guardian ID
 * - Must match student ID where appropriate
 * - Deduplicates by approval ID
 *
 * @param {Array} rawPending - Array of raw pending approval objects
 * @param {string} guardianId - Target guardian ID (e.g. 'guard_priya_sharma_01')
 * @param {string} studentId - Target student ID (e.g. 'stu_aarav_sharma_01')
 * @returns {Array} Validated, deduplicated list of pending approvals
 */
export function filterValidPendingApprovals(rawPending, guardianId = 'guard_priya_sharma_01', studentId = 'stu_aarav_sharma_01') {
  if (!Array.isArray(rawPending)) {
    return [];
  }

  const validPending = [];
  const seenIds = new Set();

  for (const item of rawPending) {
    if (!item || typeof item !== 'object') continue;

    const appId = (item.id || item.approval_id || '').toString().trim();
    if (!appId || seenIds.has(appId)) continue;

    // Must be strictly PENDING
    const itemStatus = String(item.status || '').trim().toUpperCase();
    if (itemStatus !== 'PENDING') continue;

    // Guardian ID matching (exact or corridor prefix)
    const matchesGuardian = !guardianId || !item.guardian_id ||
      item.guardian_id === guardianId ||
      item.guardian_id.startsWith(guardianId) ||
      guardianId.startsWith(item.guardian_id);

    // Student ID matching (exact or corridor prefix)
    const matchesStudent = !studentId || !item.student_id ||
      item.student_id === studentId ||
      item.student_id.startsWith(studentId) ||
      studentId.startsWith(item.student_id);

    if (matchesGuardian && matchesStudent) {
      seenIds.add(appId);
      validPending.push({
        ...item,
        id: appId
      });
    }
  }

  return validPending;
}

/**
 * Format the request timestamp for human readability.
 * Prioritizes `requested_at` because the backend response does not use `created_at` for guardian approvals.
 *
 * @param {string|Date} requestedAt - The primary requested_at ISO timestamp
 * @param {string|Date} createdAt - Fallback created_at timestamp
 * @returns {string} Formatted timestamp or fallback string
 */
export function formatApprovalTimestamp(requestedAt, createdAt) {
  const ts = requestedAt || createdAt;
  if (!ts) return 'Just now';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return 'Just now';
  }
}

/**
 * Compute the UI display state for the Parent Approval Portal.
 *
 * Guarantees:
 * - When an API error exists, portal state is 'ERROR' (never 'EMPTY' / 'No Pending Requests')
 * - When loading, portal state is 'LOADING'
 * - When successfully fetched with 0 items, portal state is 'EMPTY'
 * - When items exist, portal state is 'LIST'
 *
 * @param {Object} state - Current component state { loading, error, pendingApprovals }
 * @returns {'ERROR'|'LOADING'|'EMPTY'|'LIST'}
 */
export function getPortalDisplayState({ loading, error, pendingApprovals }) {
  if (error) return 'ERROR';
  if (loading) return 'LOADING';
  if (!Array.isArray(pendingApprovals) || pendingApprovals.length === 0) return 'EMPTY';
  return 'LIST';
}

