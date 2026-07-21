/**
 * Diagnoses the "Image upload failed" / "Server returned unexpected status
 * code - 403" error by talking to Cloudinary directly and printing the RAW
 * response (status, headers, body) instead of letting the Cloudinary SDK
 * swallow it into a generic message.
 *
 * Why this is needed: the Cloudinary Node SDK only knows how to parse
 * responses with status 200, 400, 401, 404, 420, or 500 as real Cloudinary
 * API errors (see node_modules/cloudinary/lib/uploader.js — the
 * `includes([200, 400, 401, 404, 420, 500], res.statusCode)` check). A 403
 * is NOT in that list, which means it isn't Cloudinary's own application
 * returning it — something in front of Cloudinary (their CDN/WAF, an
 * account-level IP restriction, or a network device between this server and
 * Cloudinary) is blocking the request before it reaches Cloudinary's upload
 * handler. This script shows you exactly what that blocker's response looks
 * like, which usually reveals who's responsible (Cloudinary vs. your own
 * network).
 *
 * Run this ON THE MACHINE THAT RUNS THE API SERVER (not from anywhere else),
 * since network-level blocks are specific to the server's outbound path:
 *
 *   node scripts/diagnose-cloudinary.js
 */
const https = require('https');
require('dotenv').config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env');
  process.exit(1);
}

console.log(`Testing upload to Cloudinary cloud "${cloudName}"...\n`);

// 1x1 red pixel PNG.
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const crypto = require('crypto');
const timestamp = Math.floor(Date.now() / 1000);
const paramsToSign = `timestamp=${timestamp}`;
const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

const boundary = '----diagCloudinary' + Date.now();
const fields = [
  ['file', `data:image/png;base64,${tinyPngBase64}`],
  ['api_key', apiKey],
  ['timestamp', String(timestamp)],
  ['signature', signature],
];

let body = '';
for (const [name, value] of fields) {
  body += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
}
body += `--${boundary}--\r\n`;

const options = {
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${cloudName}/image/upload`,
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  console.log('HTTP status:', res.statusCode);
  console.log('Response headers:', JSON.stringify(res.headers, null, 2));

  let raw = '';
  res.on('data', (chunk) => (raw += chunk));
  res.on('end', () => {
    console.log('\nResponse body:');
    console.log(raw);

    console.log('\n--- Diagnosis ---');
    if (res.statusCode === 200) {
      console.log('Upload succeeded — Cloudinary itself is reachable and the credentials work.');
      console.log('If your app still fails, the problem is specific to that request (e.g. file type/size, or something only happening under the app\'s network conditions, not these credentials).');
    } else if ([400, 401, 404, 420, 500].includes(res.statusCode)) {
      console.log(`Cloudinary's app answered directly with ${res.statusCode} — this IS a real Cloudinary error, see the body above for the reason (e.g. bad signature, invalid params, quota).`);
    } else {
      console.log(`Got HTTP ${res.statusCode}, which is NOT one of Cloudinary's documented API response codes (200/400/401/404/420/500).`);
      console.log('This means something other than Cloudinary\'s application answered — check the response headers above:');
      console.log('  - "server: cloudflare" / "cf-ray" present  -> blocked at Cloudinary\'s edge/CDN (often an IP allowlist under Cloudinary Console > Settings > Security).');
      console.log('  - An HTML body (not JSON)                  -> almost certainly a network/WAF block page, not Cloudinary.');
      console.log('  - No recognizable Cloudinary headers        -> check outbound firewall rules on THIS server/host for api.cloudinary.com.');
    }
  });
});

req.on('error', (err) => {
  console.error('Request failed before getting a response at all:', err.message);
  console.error('This means the server cannot reach api.cloudinary.com over the network (DNS/firewall/egress block) — not a Cloudinary account issue.');
});

req.write(body);
req.end();
