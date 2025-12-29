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

let _conn: Connection;
export function connectMongo(opts = {}) {
  // if (_conn) return _conn;
  if (_conn) return _conn;
  const uri = getMongoUrl(process.env.MONGO_URL!);
  const conn = mongoose.createConnection(uri, {
    ...opts || {},
    dbName: 'ext_data',
  });
  _conn = conn;
  console.log('MongoDB: CONNECTED MONGO main');
  return conn;
}
export const connectExtData = connectMongo;