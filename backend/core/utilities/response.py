from rest_framework.response import Response
from rest_framework import status

def api_success(data=None, message="Operation successful.", status_code=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )

def api_error(message="Operation failed.", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            "success": False,
            "message": message,
            "errors": errors or {},
        },
        status=status_code,
    )
