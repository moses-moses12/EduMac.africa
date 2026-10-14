from django.apps import AppConfig

class FeesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.fees'
    verbose_name = 'Fees, Invoices & Payments'

    def ready(self):
        import apps.fees.signals
