import mongoose from "mongoose";
import { promiseRetry } from "../libs/promise-retry";

const shouldMongoTls = true;
function getMongoUrl(url: string) {
  if (typeof process.env[url] === 'string' && process.env[url]) url = process.env[url] as string;
  if (shouldMongoTls && url.includes('-pri')) {
    if (!url.includes('?')) url += '?';
    url = url.replace('-pri.', '.');
    url += '&tls=true';
  }
  return url;
}
export async function connectMongo(opts = {}) {
  const uri = getMongoUrl(process.env.MONGO_URL!);
  // console.log('Connect MONGO_URL with is aws check', { isAws, shouldMongoTls }, uri);
  // const proxyConfig = getEnvProxyConfig() || {};
  const wait = promiseRetry(5, async () => {
    return mongoose.connect(uri, {
      // ...proxyConfig,
      tls: !!(shouldMongoTls),
      ...opts || {},
      // dbName: isProdEnv ? 'web3pass' : 'web3pass_dev' // better if can config in uri
      // maxConnecting: 5,
      // directConnection: true,
      // maxPoolSize,
      // minPoolSize: 1,
    })
  });
  // console.log('CONNECT MONGO', , mongoose.);
  await wait;
  console.log('CONNECTED MONGO main');
}