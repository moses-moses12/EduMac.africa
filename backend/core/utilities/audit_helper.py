import logging

logger = logging.getLogger(__name__)

def log_audit_event(user=None, action="", model_name="", object_id="", changes=None, ip_address=None):
    """
    Log an event to the AuditLog model safely.
    Handles exceptions quietly to avoid breaking main transaction flows.
    """
    try:
        from apps.audit.models import AuditLog
        AuditLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            changes_json=changes or {},
            ip_address=ip_address or ""
        )
    except Exception as e:
        logger.warning(f"Failed to record audit log: {e}")
