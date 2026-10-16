from rest_framework.routers import DefaultRouter

class OptionalSlashRouter(DefaultRouter):
    """
    Custom router that allows optional trailing slashes on all registered endpoints
    without breaking URL resolvers or requiring 301 redirects.
    Uses non-capturing group '(?:/)?' to safely support both '/' and non-'/' suffixes,
    even for empty prefix routes.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = '(?:/)?'
