import { Application, Request, Response, NextFunction } from 'express';

/**
 * When running behind a tunnel (ngrok, cloudflared) or a reverse proxy
 * (nginx, ALB, Cloud Run), Express must trust the X-Forwarded-* headers
 * so req.ip, req.protocol, and req.hostname reflect the ORIGINAL client
 * instead of the tunnel's loopback address.
 *
 * We trust "loopback, linklocal, uniquelocal" — safe for local dev tunnels
 * and single-hop production proxies. For multi-hop, set TRUST_PROXY_HOPS.
 */
export const configureTrustProxy = (app: Application): void => {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  if (Number.isFinite(hops) && hops > 0) {
    app.set('trust proxy', hops);
    return;
  }
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
};

/**
 * Attach tunnel/forwarding context onto the request for downstream use
 * (logging, signed-URL builders, webhook receipt validation).
 */
export interface TunnelContext {
  forwardedFor: string | undefined;
  forwardedProto: string | undefined;
  forwardedHost: string | undefined;
  isTunneled: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    tunnel?: TunnelContext;
  }
}

export const tunnelContext = (req: Request, _res: Response, next: NextFunction): void => {
  const forwardedHost = req.get('x-forwarded-host') || undefined;
  const via = req.get('via') || '';
  const ngrok = /ngrok/i.test(forwardedHost || '') || /ngrok/i.test(via);
  const cloudflared = /trycloudflare|cfargotunnel/i.test(forwardedHost || '');

  req.tunnel = {
    forwardedFor: req.get('x-forwarded-for') || undefined,
    forwardedProto: req.get('x-forwarded-proto') || undefined,
    forwardedHost,
    isTunneled: Boolean(forwardedHost) || ngrok || cloudflared,
  };

  next();
};
