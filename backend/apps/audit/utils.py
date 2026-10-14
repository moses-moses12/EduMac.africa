import logging
from typing import Optional, Dict, Any
from .models import AuditLog, AuditAction

logger = logging.getLogger(__name__)

def log_audit_event(
    user=None,
    action: str = AuditAction.CREATE,
    object_type: str = '',
    object_id: str = '',
    ip_address: str = '',
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[AuditLog]:
    """
    Central helper to record institutional audit logs reliably.
    Normal users have zero access to modify or delete these logs.
    """
    try:
        log = AuditLog.objects.create(
            user=user if getattr(user, 'is_authenticated', False) else None,
            action=action,
            object_type=object_type,
            model_name=object_type,
            object_id=str(object_id),
            ip_address=ip_address or '',
            metadata=metadata or {},
            changes_json=metadata or {},
        )
        return log
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        return None
