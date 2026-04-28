/** Curated vocabulary + fragments for plausible synthetic telemetry (no real endpoints). */

export const POOL_APP_NAMES = ["PAY_WEB", "AUTH_SVC", "DATA_API", "BATCH_ETL", "VPN_GW"] as const;
export const POOL_REGIONS = ["us-east", "eu-west", "ap-south"] as const;
export const POOL_USERS = ["svc_backup", "svc_etl", "jdoe", "nightly_job", "helpdesk_ai"] as const;

export function pickPool<T extends readonly string[]>(arr: T, seed: () => number): T[number] {
  const i = Math.floor(seed() * arr.length) % arr.length;
  return arr[i]!;
}

export type SeverityPoolEntry = {
  label: string;
  rank: number;
};

export const SEVERITY_LEVELS: SeverityPoolEntry[] = [
  { label: "P1", rank: 1 },
  { label: "P2", rank: 2 },
  { label: "P3", rank: 3 },
  { label: "P4", rank: 4 },
];

/** Narrative benign patterns */
export function benignLogFragments(next: () => number): readonly [string, string][] {
  const pairs: [string, string][] = [
    ["Certificate auto-renewal succeeded", "LetsEncrypt renewal job — expected"],
    ["AV definition update applied", "Defender signatures build " + Math.floor(next() * 900 + 1000)],
    ["LDAP bind success (scheduled report)", "Service account ldap_sync — read-only"],
    ["Backup snapshot completed", "Policy window 03:15 UTC"],
    ["User MFA enrollment completed", "new mobile device enrollment — HR ticket #"],
    ["Patch orchestration noop", `Cycle ${Math.floor(next() * 20 + 190)} queued — maintenance window`],
    ["Outbound SSH allowed partner IP", `Allowlist hit — finance batch host`],
  ];
  return pairs;
}

/** Suspicious but maybe benign until triaged */
export function ambiguousLogFragments(next: () => number): readonly [string, string][] {
  const pairs: [string, string][] = [
    ["Multiple failed binds from new subnet", `Auth gateway ${POOL_REGIONS[Math.floor(next() * POOL_REGIONS.length)]!}`],
    ["Unusual egress volume spike", `${pickPool(POOL_APP_NAMES, next)} → external IP range (CDN overlap)`],
    ["New service principal credential created", "Owner: infra-automation SA"],
    ["PowerShell invoked from WinRM remote session", `Host corp-ws-${Math.floor(next() * 90 + 10)}`],
    ["Rare process hash first-seen enterprise-wide", `Parent: explorer.exe pid ${1000 + Math.floor(next() * 500)}`],
  ];
  return pairs;
}

/** Malicious-leaning / IR-relevant cues */
export function hostileLogFragments(next: () => number): readonly [string, string][] {
  const pairs: [string, string][] = [
    ["Possible credential stuffing burst", `${Math.floor(next() * 500 + 800)} failures / 15m same ASN`],
    ["Suspicious WMI persistence class registered", "__EventFilter Consumer binding — new"],
    ["O365 impossible travel + token replay pattern", `User ${POOL_USERS[Math.floor(next() * POOL_USERS.length)]!}`],
    ["Data staging: outbound Rclone-like transfer", "~4.2 GB to consumer cloud storage ACL public"],
    ["Kerberos RC4 anomalies on multiple SVC accounts", `Ticket encryption audit spike`],
    ["SMTP auth spray against O365 federated tenants", `Same password across 312 mailboxes — lockout suppressed`],
    ["Container breakout signature on orchestrator", `Privileged pod escape attempt — cgroup anomaly`],
  ];
  return pairs;
}
