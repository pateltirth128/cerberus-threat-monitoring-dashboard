import secrets

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import User

KNOWN_WEAK_PASSWORDS = {"password123", "password", "admin", "changeme"}


def seed_default_admin(db: Session) -> None:
    admin = db.query(User).filter(User.username == settings.default_admin_username).first()
    if admin:
        return

    password = settings.default_admin_password
    if password and password.lower() in KNOWN_WEAK_PASSWORDS:
        raise RuntimeError(
            "DEFAULT_ADMIN_PASSWORD is set to a publicly known default. Remove it to have "
            "Cerberus generate one, or choose a strong password."
        )

    generated = not password
    if generated:
        password = secrets.token_urlsafe(16)

    db.add(
        User(
            username=settings.default_admin_username,
            email=settings.default_admin_email,
            phone_number=settings.default_admin_phone,
            hashed_password=hash_password(password),
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )
    )
    db.commit()

    if generated:
        banner = "=" * 64
        print(
            f"\n{banner}\n Cerberus admin account created\n"
            f"   username: {settings.default_admin_username}\n"
            f"   password: {password}\n"
            f" This is shown only once. Store it in a password manager.\n{banner}\n",
            flush=True,
        )
