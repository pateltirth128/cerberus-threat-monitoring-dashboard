import dns.resolver
import dns.exception
import pytest

from app.services.dnsbl import (
    BASE_PROVIDERS,
    _check_provider,
    _make_resolver,
    _resolve_ipv4,
    check_dnsbl_providers,
)

SPAMHAUS_TEST_IP = "127.0.0.2"

REAL_BANNED_IP = "66.132.195.108"

MXTOOLBOX_SHARED_PROVIDERS = [
    "zen.spamhaus.org",
    "bl.spamcop.net",
    "b.barracudacentral.org",
    "dnsbl-1.uceprotect.net",
    "dnsbl-2.uceprotect.net",
    "dnsbl-3.uceprotect.net",
    "dnsbl.dronebl.org",
    "psbl.surriel.com",
    "dyna.spamrats.com",
    "noptr.spamrats.com",
    "spam.spamrats.com",
    "rbl.interserver.net",
    "ubl.lashback.com",
    "bl.nordspam.com",
    "spamrbl.imp.ch",
    "wormrbl.imp.ch",
    "z.mailspike.net",
    "ips.backscatterer.org",
    "relays.nether.net",
    "matrix.spfbl.net",
    "blacklist.woody.ch",
    "all.s5h.net",
]


def _raw_dnsbl_query(ip: str, provider: str, timeout: float = 5.0) -> tuple[bool, bool]:

    reversed_ip = ".".join(reversed(ip.split(".")))
    query = f"{reversed_ip}.{provider}"
    resolver = dns.resolver.Resolver()
    resolver.lifetime = timeout
    resolver.timeout = timeout
    try:
        answers = resolver.resolve(query, "A")
        for rdata in answers:
            parts = rdata.to_text().split(".")
            if parts[0] == "127" and parts[1] == "0" and parts[2] == "0":
                return True, False
        return False, False
    except dns.resolver.NXDOMAIN:
        return False, False
    except dns.resolver.NoAnswer:
        return False, False
    except dns.exception.DNSException:
        return False, True


def _raw_dnsbl_query_stable(ip: str, provider: str, attempts: int = 3) -> tuple[bool, bool]:

    for _ in range(attempts):
        is_listed, failed = _raw_dnsbl_query(ip, provider, timeout=8.0)
        if is_listed:
            return True, False
        if not failed:
            return False, False
    return False, True


class TestResolveIpv4:
    def test_plain_ipv4(self):
        assert _resolve_ipv4("1.2.3.4") == "1.2.3.4"

    def test_url_with_scheme(self):
        assert _resolve_ipv4("http://1.2.3.4/path") == "1.2.3.4"

    def test_host_with_port(self):
        assert _resolve_ipv4("1.2.3.4:8080") == "1.2.3.4"

    def test_empty_string(self):
        assert _resolve_ipv4("") is None

    def test_unresolvable(self):
        assert _resolve_ipv4("this-will-never-resolve.invalid") is None


class TestCheckProvider:

    @pytest.mark.timeout(10)
    def test_spamhaus_test_ip_is_listed(self):
        resolver = _make_resolver()
        provider, is_listed, failed = _check_provider("2.0.0.127", "zen.spamhaus.org", resolver)
        assert provider == "zen.spamhaus.org"
        if not failed:
            assert is_listed, (
                "Spamhaus test IP 127.0.0.2 should be listed on zen.spamhaus.org. "
                "If this fails, your DNS resolver may be blocked by Spamhaus — "
                "set DNSBL_NAMESERVERS to a local recursive resolver."
            )

    @pytest.mark.timeout(10)
    def test_localhost_not_listed(self):
        resolver = _make_resolver()
        provider, is_listed, failed = _check_provider("1.0.0.127", "zen.spamhaus.org", resolver)
        if not failed:
            assert not is_listed

    @pytest.mark.timeout(10)
    def test_failed_provider_detected(self):
        resolver = _make_resolver()
        provider, is_listed, failed = _check_provider("2.0.0.127", "nonexistent.invalid.test", resolver)
        assert not is_listed


class TestCheckDnsblProviders:
    @pytest.mark.timeout(30)
    def test_result_structure(self):
        result = check_dnsbl_providers("127.0.0.1")
        assert "detected_on" in result
        assert "providers" in result
        assert "failed_providers" in result
        assert "is_blacklisted" in result
        assert "hostname" in result
        assert result["providers"] == BASE_PROVIDERS

    @pytest.mark.timeout(30)
    def test_invalid_host(self):
        result = check_dnsbl_providers("this-will-never-resolve.invalid")
        assert result["error"] == "Unable to resolve hostname to IPv4 address"
        assert result["is_blacklisted"] is False

    @pytest.mark.timeout(30)
    def test_failed_providers_tracked(self):
        result = check_dnsbl_providers("127.0.0.1")
        assert isinstance(result["failed_providers"], list)


class TestCrossValidation:


    @pytest.mark.timeout(120)
    def test_cerberus_matches_raw_queries_for_spamhaus_test_ip(self):

        ip = SPAMHAUS_TEST_IP

        raw_listed: set[str] = set()
        raw_failed: set[str] = set()
        for provider in MXTOOLBOX_SHARED_PROVIDERS:
            is_listed, failed = _raw_dnsbl_query_stable(ip, provider)
            if failed:
                raw_failed.add(provider)
            elif is_listed:
                raw_listed.add(provider)

        cerberus_result = check_dnsbl_providers(ip)
        cerberus_listed = {d["provider"] for d in cerberus_result["detected_on"]}
        cerberus_failed = set(cerberus_result["failed_providers"])

        comparable = set(MXTOOLBOX_SHARED_PROVIDERS) - cerberus_failed - raw_failed

        missed = (raw_listed & comparable) - (cerberus_listed & comparable)
        extra = (cerberus_listed & comparable) - (raw_listed & comparable)

        assert not missed, (
            f"Cerberus MISSED listings that raw DNS queries found: {missed}. "
            f"This indicates a bug in the DNSBL check logic."
        )
        assert not extra, (
            f"Cerberus reported EXTRA listings that raw DNS queries did not find: {extra}. "
            f"This indicates a false positive in the DNSBL check logic."
        )

    @pytest.mark.timeout(180)
    def test_cerberus_matches_raw_queries_for_all_providers(self):
        ip = SPAMHAUS_TEST_IP

        raw_listed: set[str] = set()
        raw_failed: set[str] = set()
        for provider in BASE_PROVIDERS:
            is_listed, failed = _raw_dnsbl_query_stable(ip, provider)
            if failed:
                raw_failed.add(provider)
            elif is_listed:
                raw_listed.add(provider)

        cerberus_result = check_dnsbl_providers(ip)
        cerberus_listed = {d["provider"] for d in cerberus_result["detected_on"]}
        cerberus_failed = set(cerberus_result["failed_providers"])

        comparable = set(BASE_PROVIDERS) - cerberus_failed - raw_failed

        missed = (raw_listed & comparable) - (cerberus_listed & comparable)
        extra = (cerberus_listed & comparable) - (raw_listed & comparable)

        assert not missed, (
            f"Cerberus MISSED listings on: {missed}"
        )
        assert not extra, (
            f"Cerberus reported FALSE POSITIVES on: {extra}"
        )

        if "zen.spamhaus.org" in comparable:
            assert "zen.spamhaus.org" in cerberus_listed, (
                "Spamhaus test IP 127.0.0.2 must be listed on zen.spamhaus.org"
            )

    @pytest.mark.timeout(180)
    def test_clean_ip_not_listed(self):
        ip = "8.8.8.8"

        cerberus_result = check_dnsbl_providers(ip)
        cerberus_listed = {d["provider"] for d in cerberus_result["detected_on"]}
        cerberus_failed = set(cerberus_result["failed_providers"])

        raw_listed: set[str] = set()
        raw_failed: set[str] = set()
        for provider in BASE_PROVIDERS:
            is_listed, failed = _raw_dnsbl_query_stable(ip, provider)
            if failed:
                raw_failed.add(provider)
            elif is_listed:
                raw_listed.add(provider)

        comparable = set(BASE_PROVIDERS) - cerberus_failed - raw_failed

        missed = (raw_listed & comparable) - (cerberus_listed & comparable)
        extra = (cerberus_listed & comparable) - (raw_listed & comparable)

        assert not missed, f"Cerberus MISSED listings on: {missed}"
        assert not extra, f"Cerberus reported FALSE POSITIVES on: {extra}"


class TestRealBannedIP:


    @pytest.mark.timeout(180)
    def test_real_ip_cerberus_vs_mxtoolbox_shared_providers(self):
        ip = REAL_BANNED_IP

        raw_listed: set[str] = set()
        raw_failed: set[str] = set()
        for provider in MXTOOLBOX_SHARED_PROVIDERS:
            is_listed, failed = _raw_dnsbl_query_stable(ip, provider)
            if failed:
                raw_failed.add(provider)
            elif is_listed:
                raw_listed.add(provider)

        cerberus_result = check_dnsbl_providers(ip)
        cerberus_listed = {d["provider"] for d in cerberus_result["detected_on"]}
        cerberus_failed = set(cerberus_result["failed_providers"])

        comparable = set(MXTOOLBOX_SHARED_PROVIDERS) - cerberus_failed - raw_failed

        missed = (raw_listed & comparable) - (cerberus_listed & comparable)
        extra = (cerberus_listed & comparable) - (raw_listed & comparable)

        print(f"\n{'='*60}")
        print(f"Real IP cross-validation: {ip}")
        print(f"{'='*60}")
        print(f"Raw baseline listed ({len(raw_listed)}): {sorted(raw_listed)}")
        print(f"Cerberus listed ({len(cerberus_listed)}): {sorted(cerberus_listed)}")
        print(f"Raw failed: {sorted(raw_failed)}")
        print(f"Cerberus failed: {sorted(cerberus_failed)}")
        print(f"Comparable providers: {len(comparable)}")
        if missed:
            print(f"MISSED: {sorted(missed)}")
        if extra:
            print(f"EXTRA: {sorted(extra)}")
        print(f"{'='*60}")

        assert not missed, (
            f"Cerberus MISSED listings that MXToolbox-style queries found: {sorted(missed)}. "
            f"Raw listed: {sorted(raw_listed)}, Cerberus listed: {sorted(cerberus_listed)}"
        )
        assert not extra, (
            f"Cerberus reported EXTRA listings not found by MXToolbox-style queries: {sorted(extra)}. "
            f"Raw listed: {sorted(raw_listed)}, Cerberus listed: {sorted(cerberus_listed)}"
        )

    @pytest.mark.timeout(300)
    def test_real_ip_cerberus_vs_all_providers(self):
        ip = REAL_BANNED_IP

        raw_listed: set[str] = set()
        raw_failed: set[str] = set()
        for provider in BASE_PROVIDERS:
            is_listed, failed = _raw_dnsbl_query_stable(ip, provider)
            if failed:
                raw_failed.add(provider)
            elif is_listed:
                raw_listed.add(provider)

        cerberus_result = check_dnsbl_providers(ip)
        cerberus_listed = {d["provider"] for d in cerberus_result["detected_on"]}
        cerberus_failed = set(cerberus_result["failed_providers"])

        comparable = set(BASE_PROVIDERS) - cerberus_failed - raw_failed

        missed = (raw_listed & comparable) - (cerberus_listed & comparable)
        extra = (cerberus_listed & comparable) - (raw_listed & comparable)

        print(f"\n{'='*60}")
        print(f"Real IP full cross-validation: {ip}")
        print(f"{'='*60}")
        print(f"Raw baseline listed ({len(raw_listed)}): {sorted(raw_listed)}")
        print(f"Cerberus listed ({len(cerberus_listed)}): {sorted(cerberus_listed)}")
        print(f"Raw failed ({len(raw_failed)}): {sorted(raw_failed)}")
        print(f"Cerberus failed ({len(cerberus_failed)}): {sorted(cerberus_failed)}")
        print(f"Comparable providers: {len(comparable)}/{len(BASE_PROVIDERS)}")
        if missed:
            print(f"MISSED: {sorted(missed)}")
        if extra:
            print(f"EXTRA: {sorted(extra)}")
        print(f"{'='*60}")

        assert not missed, (
            f"Cerberus MISSED listings: {sorted(missed)}"
        )
        assert not extra, (
            f"Cerberus reported FALSE POSITIVES: {sorted(extra)}"
        )
