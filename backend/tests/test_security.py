import gzip
import http.server
import threading
import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core import secret_key as secret_module
from app.core.config import settings
from app.core.net_safety import UnsafeTargetError, resolve_safe_ip
from app.core.rate_limit import limiter
from app.core.security import create_access_token, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models import User
from app.services import server_status
from app.services.dmarc_parser import ReportTooLargeError, extract_xml, parse_dmarc_xml
from app.services.scheduler import _is_asset_due


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    limiter.reset()
    yield
    limiter.reset()


def _bearer(username: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(username)}"}


def _ensure_user(username: str, superuser: bool = False) -> None:
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == username).first():
            db.add(User(
                username=username, email=f"{username}@test.local", phone_number="1234",
                hashed_password=hash_password("correct-horse-battery"), is_superuser=superuser,
            ))
            db.commit()
    finally:
        db.close()


def test_generated_secret_is_strong_and_not_a_placeholder():
    assert len(settings.app_secret_key) >= 32
    assert settings.app_secret_key not in secret_module.KNOWN_WEAK_SECRETS


@pytest.mark.parametrize("value", ["change-me-in-production", "replace-this-secret", "short"])
def test_weak_configured_secret_is_rejected(monkeypatch, value):
    monkeypatch.setenv("APP_SECRET_KEY", value)
    with pytest.raises(secret_module.InsecureSecretError):
        secret_module.resolve_secret_key()


def test_token_forged_with_old_public_secret_is_rejected(client):
    forged = jwt.encode(
        {"sub": "admin", "type": "access", "exp": int(time.time()) + 3600},
        "change-me-in-production", algorithm="HS256",
    )
    r = client.get("/hostname/list/", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


NEW_USER = {"username": "intruder", "email": "intruder@test.local", "phone_number": "1234", "password": "password-123"}


def test_anonymous_registration_is_disabled(client):
    assert client.post("/user/create/", json=NEW_USER).status_code == 403


def test_superuser_can_create_users(client):
    _ensure_user("root", superuser=True)
    r = client.post("/user/create/", json={**NEW_USER, "username": "member", "email": "member@test.local"},
                    headers=_bearer("root"))
    assert r.status_code == 200


def test_regular_user_cannot_change_global_scheduler(client):
    _ensure_user("regular")
    body = {"scheduler_enabled": True, "scheduler_interval_minutes": 1}
    assert client.put("/settings/scheduler/", json=body, headers=_bearer("regular")).status_code == 403


@pytest.mark.parametrize("target", [
    "127.0.0.1", "localhost", "http://169.254.169.254/latest/meta-data/",
    "10.0.0.5", "192.168.1.1", "172.17.0.1", "0.0.0.0", "100.64.0.1",
])
def test_server_status_refuses_internal_targets(client, target):
    r = client.get("/tools/server-status/", params={"hostname": target})
    assert r.status_code == 400
    assert "private or reserved" in r.json()["detail"]


def test_ssl_checker_refuses_internal_targets(client):
    r = client.get("/tools/ssl/", params={"hostname": "127.0.0.1"})
    assert r.status_code == 400


def test_ipv4_mapped_ipv6_loopback_is_refused():
    with pytest.raises(UnsafeTargetError):
        from app.core.net_safety import check_ip
        check_ip("::ffff:127.0.0.1")


def test_redirect_to_metadata_service_is_blocked(monkeypatch):

    class Redirect(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(302)
            self.send_header("Location", "http://169.254.169.254/latest/meta-data/")
            self.end_headers()

        def log_message(self, *args):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 0), Redirect)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]

    real = resolve_safe_ip
    monkeypatch.setattr(server_status, "resolve_safe_ip",
                        lambda h, *a: "127.0.0.1" if h == "public.test" else real(h, *a))
    try:
        with pytest.raises(UnsafeTargetError):
            server_status._safe_get(f"http://public.test:{port}/")
    finally:
        srv.shutdown()


def test_public_tools_are_rate_limited(client):
    codes = [client.get("/blacklist/quick-check/").status_code for _ in range(settings.rate_limit_per_minute + 1)]
    assert codes[-1] == 429
    assert all(c == 400 for c in codes[:-1])


def test_login_is_rate_limited(client):
    creds = {"username": "nobody", "password": "wrong-password"}
    codes = [client.post("/user/login/", json=creds).status_code for _ in range(settings.login_rate_limit_per_minute + 1)]
    assert codes[-1] == 429


def test_spoofed_forwarded_for_from_untrusted_peer_is_ignored(client):
    codes = [
        client.get("/blacklist/quick-check/", headers={"X-Forwarded-For": f"203.0.113.{i}"}).status_code
        for i in range(settings.rate_limit_per_minute + 1)
    ]
    assert codes[-1] == 429


def test_scheduler_handles_naive_datetimes_from_sqlite():
    naive_recent = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
    naive_old = naive_recent - timedelta(hours=7)
    assert _is_asset_due(SimpleNamespace(last_checked=naive_recent, check_interval_minutes=None), 360) is False
    assert _is_asset_due(SimpleNamespace(last_checked=naive_old, check_interval_minutes=None), 360) is True


def test_gzip_bomb_is_rejected():
    bomb = gzip.compress(b"<a>" + b" " * (30 * 1024 * 1024) + b"</a>")
    assert len(bomb) < 100_000
    with pytest.raises(ReportTooLargeError):
        extract_xml(bomb)


def test_xml_with_entities_is_rejected():
    evil = '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaa">]><feedback>&a;</feedback>'
    with pytest.raises(ValueError):
        parse_dmarc_xml(evil)


def test_pinned_request_keeps_real_host_header(monkeypatch):
    seen = {}

    class Echo(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            seen["host"] = self.headers.get("Host")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")

        def log_message(self, *args):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 0), Echo)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    monkeypatch.setattr(server_status, "resolve_safe_ip", lambda h, *a: "127.0.0.1")
    try:
        resp, size, _ = server_status._safe_get(f"http://public.test:{port}/")
    finally:
        srv.shutdown()
    assert resp.status_code == 200 and size == 2
    assert seen["host"] == f"public.test:{port}"


def test_pinned_tls_still_verifies_certificate_hostname(monkeypatch, tmp_path):
    import datetime as dt
    import ssl

    import requests
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.x509.oid import NameOID

    def make_cert(name: str):
        key = ec.generate_private_key(ec.SECP256R1())
        subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, name)])
        now = dt.datetime.now(dt.timezone.utc)
        cert = (
            x509.CertificateBuilder().subject_name(subject).issuer_name(subject)
            .public_key(key.public_key()).serial_number(x509.random_serial_number())
            .not_valid_before(now - dt.timedelta(minutes=1)).not_valid_after(now + dt.timedelta(days=1))
            .add_extension(x509.SubjectAlternativeName([x509.DNSName(name)]), critical=False)
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .sign(key, hashes.SHA256())
        )
        cert_path, key_path = tmp_path / f"{name}.crt", tmp_path / f"{name}.key"
        cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
        key_path.write_bytes(key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
        return cert_path, key_path

    class Ok(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()

        def log_message(self, *args):
            pass

    def serve(name):
        cert_path, key_path = make_cert(name)
        srv = http.server.HTTPServer(("127.0.0.1", 0), Ok)
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(cert_path, key_path)
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        return srv, cert_path

    monkeypatch.setattr(server_status, "resolve_safe_ip", lambda h, *a: "127.0.0.1")

    srv, cert = serve("public.test")
    monkeypatch.setenv("REQUESTS_CA_BUNDLE", str(cert))
    try:
        resp, _, _ = server_status._safe_get(f"https://public.test:{srv.server_address[1]}/")
        assert resp.status_code == 200
    finally:
        srv.shutdown()

    srv, cert = serve("evil.test")
    monkeypatch.setenv("REQUESTS_CA_BUNDLE", str(cert))
    try:
        with pytest.raises(requests.exceptions.SSLError):
            server_status._safe_get(f"https://public.test:{srv.server_address[1]}/")
    finally:
        srv.shutdown()
