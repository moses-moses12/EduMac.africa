import pytest
from django.core.management import call_command

@pytest.fixture(autouse=True)
def seed_test_database(db):
    call_command('seed_demo_data')
