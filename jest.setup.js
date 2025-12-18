require('dotenv').config({  
  path: './server/.env',
  quiet: true,
});
const { ProxyAgent, fetch: undiciFetch } = require('undici');

const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.https_proxy;
const proxyFetch = !proxyUrl? undefined: (input, init) => {
  const dispatcher = new ProxyAgent({
    uri: proxyUrl,
    requestTls: { rejectUnauthorized: false, },
    proxyTls: { rejectUnauthorized: false, },
  });

  let url;
  if (typeof input === 'string' || input instanceof URL) {
    url = input;
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    throw new Error(`Unsupported input type: ${typeof input}`);
  }

  if (!init) {
    return undiciFetch(url, { dispatcher, });
  }

  (init).dispatcher = dispatcher;
  return undiciFetch(url, init);
}
globalThis.fetch = proxyFetch || fetch;