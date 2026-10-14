from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler to ensure standard JSON error structure:
    {
        "success": False,
        "message": "...",
        "errors": { ... },
        "status_code": 400
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "message": "An error occurred while processing your request.",
            "errors": {},
        }

        # Handle specific HTTP status codes and detail formatting
        if response.status_code == status.HTTP_403_FORBIDDEN:
            detail = response.data.get("detail", "You do not have permission to access this resource.") if isinstance(response.data, dict) else "You do not have permission to access this resource."
            custom_data["message"] = str(detail)
            custom_data["errors"] = {}
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            detail = response.data.get("detail", "Authentication credentials were not provided or have expired.") if isinstance(response.data, dict) else "Authentication failed."
            custom_data["message"] = str(detail)
            custom_data["errors"] = {}
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            detail = response.data.get("detail", "Requested resource was not found.") if isinstance(response.data, dict) else "Resource not found."
            custom_data["message"] = str(detail)
            custom_data["errors"] = {}
        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            custom_data["message"] = "Validation failed. Please correct the errors."
            if isinstance(response.data, dict):
                custom_data["errors"] = response.data
                if "detail" in response.data:
                    custom_data["message"] = str(response.data["detail"])
                elif "non_field_errors" in response.data:
                    custom_data["message"] = str(response.data["non_field_errors"][0])
                elif len(response.data) > 0:
                    first_key = next(iter(response.data))
                    first_val = response.data[first_key]
                    if isinstance(first_val, list) and len(first_val) > 0:
                        custom_data["message"] = f"{first_key}: {first_val[0]}"
                    else:
                        custom_data["message"] = f"{first_key}: {first_val}"
            elif isinstance(response.data, list):
                custom_data["errors"] = {"non_field_errors": response.data}
                if len(response.data) > 0:
                    custom_data["message"] = str(response.data[0])
            else:
                custom_data["errors"] = {"error": str(response.data)}
        else:
            if isinstance(response.data, dict):
                custom_data["errors"] = response.data
                if "detail" in response.data:
                    custom_data["message"] = str(response.data["detail"])
            else:
                custom_data["errors"] = {"error": str(response.data)}

        response.data = custom_data
        return response

    # Catch-all for unhandled exceptions (Never show raw Python tracebacks to users)
    logger.exception("Unhandled server exception caught in custom handler: %s", exc)
    return Response(
        {
            "success": False,
            "message": "An internal server error occurred while processing your request. Please contact system support.",
            "errors": {},
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
