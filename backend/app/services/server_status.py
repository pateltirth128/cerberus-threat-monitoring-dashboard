import os
import socket
import time
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.connection import HTTPConnection, HTTPSConnection
from urllib3.connectionpool import HTTPConnectionPool, HTTPSConnectionPool

from app.core.net_safety import UnsafeTargetError, resolve_safe_ip

USER_AGENT = "Cerberus-Monitor/1.0"
MAX_REDIRECTS = 5
MAX_BODY_BYTES = 5 * 1024 * 1024


def _normalize_url(value: str) -> tuple[str, str]:
    target = (value or "").strip()
    if not target:
        return "", ""

    if not target.startswith(("http://", "https://")):
        target = "https://" + target

    parsed = urlparse(target)
    hostname = parsed.hostname or ""
    return target, hostname


def _pinned_session(ip: str) -> requests.Session:


    class _Conn(HTTPConnection):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._dns_host = ip

    class _TLSConn(HTTPSConnection):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            real_host = self.host
            self._dns_host = ip
            self.server_hostname = real_host

    class _Pool(HTTPConnectionPool):
        ConnectionCls = _Conn

    class _TLSPool(HTTPSConnectionPool):
        ConnectionCls = _TLSConn

    adapter = HTTPAdapter(max_retries=0)
    adapter.poolmanager.pool_classes_by_scheme = {"http": _Pool, "https": _TLSPool}
    session = requests.Session()
    session.trust_env = False
    session.verify = os.environ.get("REQUESTS_CA_BUNDLE") or os.environ.get("SSL_CERT_FILE") or True
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def _safe_get(url: str) -> tuple[requests.Response, int, str]:

    current = url
    for _ in range(MAX_REDIRECTS + 1):
        parsed = urlparse(current)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            raise UnsafeTargetError("Only http(s) URLs with a hostname are allowed.")

        ip = resolve_safe_ip(parsed.hostname)
        default_port = 443 if parsed.scheme == "https" else 80
        host_header = parsed.hostname if parsed.port in (None, default_port) else f"{parsed.hostname}:{parsed.port}"
        with _pinned_session(ip) as session:
            resp = session.get(
                current,
                timeout=10,
                allow_redirects=False,
                stream=True,
                headers={"User-Agent": USER_AGENT, "Host": host_header},
            )
            try:
                if resp.is_redirect and resp.headers.get("Location"):
                    current = urljoin(current, resp.headers["Location"])
                    continue

                size = 0
                for chunk in resp.iter_content(64 * 1024):
                    size += len(chunk)
                    if size >= MAX_BODY_BYTES:
                        break
                return resp, size, current
            finally:
                resp.close()

    raise requests.exceptions.TooManyRedirects(f"More than {MAX_REDIRECTS} redirects.")


def check_server_status(hostname_or_url: str) -> dict[str, Any]:
    url, hostname = _normalize_url(hostname_or_url)
    if not hostname:
        return {"error": "Invalid hostname or URL."}

    result: dict[str, Any] = {
        "query": hostname_or_url,
        "hostname": hostname,
        "url": url,
    }

    try:
        ip = resolve_safe_ip(hostname)
        result["resolved_ip"] = ip
        result["dns_resolves"] = True
    except UnsafeTargetError as exc:
        return {"error": str(exc)}
    except (socket.gaierror, socket.timeout, UnicodeError):
        result["resolved_ip"] = None
        result["dns_resolves"] = False
        result["is_up"] = False
        result["reason"] = "DNS resolution failed"
        return result

    for port in (443, 80):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        try:
            sock.connect((ip, port))
            result[f"port_{port}_open"] = True
        except (socket.timeout, socket.error, OSError):
            result[f"port_{port}_open"] = False
        finally:
            sock.close()

    try:
        start = time.monotonic()
        resp, size, final_url = _safe_get(url)
        elapsed_ms = round((time.monotonic() - start) * 1000)

        result["is_up"] = True
        result["status_code"] = resp.status_code
        result["response_time_ms"] = elapsed_ms
        result["final_url"] = final_url
        result["content_length"] = size
        result["server_header"] = resp.headers.get("Server")
    except UnsafeTargetError as exc:
        result["is_up"] = False
        result["reason"] = f"Redirect blocked: {exc}"
    except requests.exceptions.SSLError:
        result["is_up"] = False
        result["reason"] = "SSL certificate error"
        try:
            http_url = url.replace("https://", "http://", 1)
            start = time.monotonic()
            resp, _size, final_url = _safe_get(http_url)
            elapsed_ms = round((time.monotonic() - start) * 1000)
            result["is_up"] = True
            result["status_code"] = resp.status_code
            result["response_time_ms"] = elapsed_ms
            result["final_url"] = final_url
            result["ssl_error"] = True
        except (requests.exceptions.RequestException, UnsafeTargetError, socket.gaierror):
            pass
    except requests.exceptions.ConnectionError:
        result["is_up"] = False
        result["reason"] = "Connection refused or unreachable"
    except requests.exceptions.Timeout:
        result["is_up"] = False
        result["reason"] = "Request timed out"
    except (requests.exceptions.RequestException, socket.gaierror) as exc:
        result["is_up"] = False
        result["reason"] = str(exc)

    return result
