import mongoose, { Connection, Mongoose } from "mongoose";
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

let _connPromise: Promise<Mongoose> | null = null;
export async function connectMongo(opts = {}) {
  if (_connPromise) return _connPromise;
  const uri = getMongoUrl(process.env.MONGO_URL!);
  console.log('MongoDB: Try connect URI: ', uri);
  // console.log('Connect MONGO_URL with is aws check', { isAws, shouldMongoTls }, uri);
  // const proxyConfig = getEnvProxyConfig() || {};
  _connPromise = promiseRetry(5, async () => {
    return mongoose.connect(uri, {
      // ...proxyConfig,
      // tls: !!(shouldMongoTls),
      ...opts || {},
      dbName: 'ext_data',
      // dbName: isProdEnv ? 'web3pass' : 'web3pass_dev' // better if can config in uri
      // maxConnecting: 5,
      // directConnection: true,
      // maxPoolSize,
      // minPoolSize: 1,
    })
  });
  _connPromise.catch(err => {
    console.log('MongoDB: CONNECT MONGO error', err);
    _connPromise = null;
  });
  // console.log('CONNECT MONGO', , mongoose.);
  console.log('MongoDB: CONNECTED MONGO main');
  return await _connPromise;
}