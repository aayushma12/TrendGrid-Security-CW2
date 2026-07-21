/**
 * Outbound HTTP tunnel / proxy configuration.
 * Consumed by src/services/httpClient.ts so all egress can be routed through
 * a corporate proxy, SSH tunnel, or static-IP gateway without code changes.
 */

export interface OutboundTunnelConfig {
  enabled: boolean;
  proxyUrl?: string;
  proxyAuth?: { username: string; password: string };
  noProxy?: string[];
}

const parseBool = (v: string | undefined, fallback = false): boolean =>
  v === undefined ? fallback : /^(1|true|yes|on)$/i.test(v);

export const outboundTunnel: OutboundTunnelConfig = {
  enabled: parseBool(process.env.OUTBOUND_PROXY_ENABLED, false),
  proxyUrl: process.env.OUTBOUND_PROXY_URL,
  proxyAuth:
    process.env.OUTBOUND_PROXY_USER && process.env.OUTBOUND_PROXY_PASS
      ? {
          username: process.env.OUTBOUND_PROXY_USER,
          password: process.env.OUTBOUND_PROXY_PASS,
        }
      : undefined,
  noProxy: (process.env.OUTBOUND_NO_PROXY || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
