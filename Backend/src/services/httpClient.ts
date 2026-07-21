/**
 * Outbound HTTP client — all external API calls go through this so egress
 * can be routed through a corporate proxy / static-IP gateway just by
 * setting env vars.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { URL } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { outboundTunnel } from '../config/tunnel';
import { logger } from '../utils/logger';

const shouldBypass = (targetUrl: string): boolean => {
  if (!outboundTunnel.noProxy?.length) return false;
  try {
    const host = new URL(targetUrl).hostname;
    return outboundTunnel.noProxy.some((rule) =>
      rule.startsWith('*.') ? host.endsWith(rule.slice(1)) : host === rule,
    );
  } catch {
    return false;
  }
};

const buildProxyUrl = (): string | undefined => {
  if (!outboundTunnel.enabled || !outboundTunnel.proxyUrl) return undefined;
  const u = new URL(outboundTunnel.proxyUrl);
  if (outboundTunnel.proxyAuth) {
    u.username = outboundTunnel.proxyAuth.username;
    u.password = outboundTunnel.proxyAuth.password;
  }
  return u.toString();
};

export const createHttpClient = (baseConfig: AxiosRequestConfig = {}): AxiosInstance => {
  const proxyUrl = buildProxyUrl();
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  const client = axios.create({
    timeout: 15000,
    ...baseConfig,
    httpAgent: agent,
    httpsAgent: agent,
    proxy: false,
  });

  client.interceptors.request.use((cfg) => {
    if (cfg.url && shouldBypass(cfg.url)) {
      cfg.httpAgent = undefined;
      cfg.httpsAgent = undefined;
    }
    return cfg;
  });

  client.interceptors.response.use(
    (r) => r,
    (err) => {
      logger.error(
        `Outbound HTTP error: ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${err.message}`,
      );
      return Promise.reject(err);
    },
  );

  return client;
};

export const http = createHttpClient();
