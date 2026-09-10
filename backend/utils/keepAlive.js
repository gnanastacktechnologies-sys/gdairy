import http from 'http';
import https from 'https';

/**
 * Self-ping utility to keep the Render web service awake 24/7.
 * Render free web services go to sleep after 15 minutes of inactivity.
 * This utility pings the public health endpoint every 12 minutes.
 */
export function initKeepAlive() {
  const isProd = process.env.NODE_ENV === 'production';
  const rawUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.SERVER_URL;
  const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS || '720000', 10); // Default: 12 minutes (720,000 ms)

  if (!rawUrl && !isProd) {
    console.log('[KeepAlive] Disabled in development mode (no external URL configured).');
    return;
  }

  const targetUrl = rawUrl 
    ? (rawUrl.endsWith('/api/health') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api/health`)
    : null;

  if (!targetUrl) {
    console.warn('[KeepAlive] RENDER_EXTERNAL_URL or BACKEND_URL is not set. Self-ping inactive.');
    console.warn('[KeepAlive] Set RENDER_EXTERNAL_URL in Render environment variables to enable 24/7 keep-alive.');
    return;
  }

  console.log(`[KeepAlive] Self-ping service initialized.`);
  console.log(`[KeepAlive] Target: ${targetUrl} (Interval: ${Math.round(intervalMs / 60000)} minutes)`);

  const ping = () => {
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(targetUrl, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[KeepAlive Ping Success] ${new Date().toISOString()} - Status ${res.statusCode}`);
          } else {
            console.warn(`[KeepAlive Ping Warning] ${new Date().toISOString()} - Status ${res.statusCode}`);
          }
        });
      });

      req.on('error', (err) => {
        console.error(`[KeepAlive Ping Error] ${new Date().toISOString()} - ${err.message}`);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        console.warn(`[KeepAlive Ping Timeout] Request to ${targetUrl} timed out.`);
      });
    } catch (err) {
      console.error(`[KeepAlive Exception] ${err.message}`);
    }
  };

  // Perform initial ping after 30 seconds of server startup
  setTimeout(ping, 30000);

  // Set recurring interval
  const timer = setInterval(ping, intervalMs);

  // Prevent background process holding unref if needed
  if (timer.unref) {
    timer.unref();
  }

  return timer;
}
