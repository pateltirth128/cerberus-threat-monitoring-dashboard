// Example report shown when the backend is offline (for demos and portfolio visitors).
// It is clearly labelled as sample data in the UI. It is NOT a real check.

export const SAMPLE_TARGET = '203.0.113.25';

const SAMPLE_PROVIDERS = [
  'zen.spamhaus.org',
  'b.barracudacentral.org',
  'bl.spamcop.net',
  'cbl.abuseat.org',
  'dnsbl.sorbs.net',
  'psbl.surriel.com',
  'dnsbl-1.uceprotect.net',
  'ix.dnsbl.manitu.net',
  'bl.mailspike.net',
  'all.s5h.net',
  'dnsbl.dronebl.org',
  'db.wpbl.info',
];

export const SAMPLE_REPORT = {
  hostname: SAMPLE_TARGET,
  providers: SAMPLE_PROVIDERS,
  detected_on: [
    { provider: 'bl.spamcop.net', categories: ['unknown'], status: 'open' },
  ],
  failed_providers: [],
  is_blacklisted: true,
  categories: ['unknown'],
  abuseipdb: null,
};
