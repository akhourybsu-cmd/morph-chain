import { supabase } from "@/integrations/supabase/client";

export type AlertType = 
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'bulk_download_attempt'
  | 'admin_action'
  | 'security_violation';

interface SecurityAlert {
  alert_type: AlertType;
  user_id?: string;
  details?: Record<string, any>;
}

/**
 * Log security alerts for admin review
 */
export const logSecurityAlert = async (alert: SecurityAlert): Promise<void> => {
  try {
    const { error } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: alert.alert_type,
        user_id: alert.user_id,
        details: alert.details || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log security alert:', error);
    }
  } catch (err) {
    console.error('Exception logging security alert:', err);
  }
};

/**
 * Log admin actions for audit trail
 */
export const logAdminAction = async (
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    console.error('Exception logging admin action:', err);
  }
};

/**
 * Detect suspicious patterns in user behavior
 */
export const detectSuspiciousActivity = (metrics: {
  requestCount: number;
  timeWindow: number;
  failedAttempts: number;
  uniqueEndpoints: number;
}): boolean => {
  // Heuristics for detecting scraping/automation
  const { requestCount, timeWindow, failedAttempts, uniqueEndpoints } = metrics;
  
  // Too many requests in short time
  if (requestCount > 100 && timeWindow < 60000) {
    return true;
  }
  
  // High failure rate suggests probing
  if (failedAttempts > 10 && failedAttempts / requestCount > 0.3) {
    return true;
  }
  
  // Accessing many different endpoints rapidly (scraping pattern)
  if (uniqueEndpoints > 20 && timeWindow < 300000) {
    return true;
  }
  
  return false;
};

// Watermark functions removed - were unused dead code
