import logging
import os
import secrets
from pathlib import Path

logger = logging.getLogger(__name__)

MIN_SECRET_LENGTH = 32

KNOWN_WEAK_SECRETS = {
    "change-me-in-production",
    "replace-this-secret",
    "insecure-dev-secret-key-change-me",
    "secret",
    "changeme",
    "change-me",
}


class InsecureSecretError(RuntimeError):
    pass


def _load_or_create(path: Path) -> str:
    if path.exists():
        value = path.read_text(encoding="utf-8").strip()
        if len(value) >= MIN_SECRET_LENGTH:
            return value
        logger.warning("Secret key file %s is too short; regenerating.", path)

    value = secrets.token_urlsafe(48)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(value)
    logger.warning("APP_SECRET_KEY not set; generated a random signing key at %s.", path)
    return value


def resolve_secret_key() -> str:
    configured = (os.getenv("APP_SECRET_KEY") or "").strip()

    if configured:
        if configured.lower() in KNOWN_WEAK_SECRETS:
            raise InsecureSecretError(
                "APP_SECRET_KEY is set to a public placeholder value. Remove it to let "
                "Cerberus generate one, or set a random value (e.g. `python -c "
                "\"import secrets; print(secrets.token_urlsafe(48))\"`)."
            )
        if len(configured) < MIN_SECRET_LENGTH:
            raise InsecureSecretError(
                f"APP_SECRET_KEY must be at least {MIN_SECRET_LENGTH} characters."
            )
        return configured

    return _load_or_create(Path(os.getenv("SECRET_KEY_FILE", ".secret_key")))
