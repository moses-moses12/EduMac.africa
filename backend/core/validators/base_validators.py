import re
from django.core.exceptions import ValidationError

def validate_phone_number(value):
    """Ensure phone number format conforms to international standard or valid local digits."""
    if not value:
        return
    pattern = r'^\+?[1-9]\d{1,14}$'
    clean_val = re.sub(r'[\s\-\(\)]', '', value)
    if not re.match(pattern, clean_val):
        raise ValidationError(f"'{value}' is not a valid international phone number.")

def validate_score_range(value):
    """Validate score is between 0 and 100."""
    if value < 0 or value > 100:
        raise ValidationError("Score must be between 0 and 100.")

def validate_positive_amount(value):
    """Ensure monetary amount is strictly non-negative."""
    if value < 0:
        raise ValidationError("Amount cannot be negative.")
