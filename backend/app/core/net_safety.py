from __future__ import annotations

import ipaddress
import socket

from app.core.config import settings


class UnsafeTargetError(ValueError):
    pass


def _is_public(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    return ip.is_global and not ip.is_multicast


def check_ip(ip_str: str) -> str:
    ip = ipaddress.ip_address(ip_str)
    if not settings.allow_private_targets and not _is_public(ip):
        raise UnsafeTargetError("Target resolves to a private or reserved address, which is not allowed.")
    return str(ip)


def resolve_safe_ip(hostname: str, family: int = socket.AF_INET) -> str:

    host = (hostname or "").strip().strip("[]")
    if not host:
        raise UnsafeTargetError("Empty hostname.")

    infos = socket.getaddrinfo(host, None, family, socket.SOCK_STREAM)
    addresses = sorted({info[4][0] for info in infos})
    if not addresses:
        raise socket.gaierror(f"No addresses for {host}")

    for addr in addresses:
        check_ip(addr)
    return addresses[0]
