// MEASURED - Audit Log Utilities
// Helper functions for logging admin actions

import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | 'ingest_run'
  | 'approve_candidate'
  | 'block_candidate'
  | 'edit_candidate'
  | 'create_fact'
  | 'edit_fact'
  | 'retire_fact'
  | 'restore_fact'
  | 'generate_puzzle'
  | 'publish_puzzle'
  | 'unpublish_puzzle'
  | 'emergency_swap'
  | 'regenerate_puzzle';

export type EntityType = 'candidate' | 'fact' | 'puzzle' | 'system';

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  details?: Record<string, unknown>;
  reason?: string;
}

/**
 * Log an admin action to the audit log
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user for audit log');
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('measured_audit_log')
      .insert({
        admin_user_id: user.id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        details: entry.details,
        reason: entry.reason
      });

    if (error) {
      console.error('Failed to log audit action:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Audit log error:', err);
    return false;
  }
}

/**
 * Get formatted action label for display
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    'ingest_run': 'Ingestion Run',
    'approve_candidate': 'Approved Candidate',
    'block_candidate': 'Blocked Candidate',
    'edit_candidate': 'Edited Candidate',
    'create_fact': 'Created Fact',
    'edit_fact': 'Edited Fact',
    'retire_fact': 'Retired Fact',
    'restore_fact': 'Restored Fact',
    'generate_puzzle': 'Generated Puzzle',
    'publish_puzzle': 'Published Puzzle',
    'unpublish_puzzle': 'Unpublished Puzzle',
    'emergency_swap': 'Emergency Swap',
    'regenerate_puzzle': 'Regenerated Puzzle'
  };
  return labels[action] || action;
}

/**
 * Get action color for UI display
 */
export function getActionColor(action: AuditAction): string {
  const successActions: AuditAction[] = ['approve_candidate', 'create_fact', 'publish_puzzle', 'restore_fact'];
  const warningActions: AuditAction[] = ['edit_candidate', 'edit_fact', 'regenerate_puzzle'];
  const dangerActions: AuditAction[] = ['block_candidate', 'retire_fact', 'emergency_swap', 'unpublish_puzzle'];

  if (successActions.includes(action)) {
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  }
  if (warningActions.includes(action)) {
    return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
  }
  if (dangerActions.includes(action)) {
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  }
  return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
}
