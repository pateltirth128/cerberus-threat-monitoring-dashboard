import os
import tempfile

_tmp = tempfile.mkdtemp(prefix="cerberus-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["SECRET_KEY_FILE"] = f"{_tmp}/secret_key"
os.environ.pop("APP_SECRET_KEY", None)
os.environ.pop("DEFAULT_ADMIN_PASSWORD", None)
os.environ.pop("ALLOW_REGISTRATION", None)
os.environ.pop("ALLOW_PRIVATE_TARGETS", None)
os.environ.pop("TRUSTED_PROXIES", None)
