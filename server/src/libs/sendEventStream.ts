import _ from "lodash";
import { isCancel } from "axios";
import { jsonifyError } from "./jsonifyError";

export async function setResponseEventStreamHeaders(res) {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client
  res.on('close', () => { res.end(); });
}

export async function sendEventStream(res, fn: (send: (data: any) => void) => any) {
  // const linebreakBuffer = Buffer.from('\n\n');
  const setHeader = _.once(() => setResponseEventStreamHeaders(res))
  const result = await fn((data) => {
    setHeader();
    // console.log('sendEventStream:fn called', { isBuffer: Buffer.isBuffer(data), data })
    if (Buffer.isBuffer(data)) {
      res.write(data); return;
    }
    let str = data;
    if (typeof str !== 'string' || (typeof str === 'string' && !str.trim().match(/^([{["]|data:)/))) {
      str = JSON.stringify(str);
    }
    if (!str?.startsWith?.('data:')) {
      str = 'data: '+ str;
    }
    str = str.trim() + '\n\n'
    res.write(str);
  }).catch(async (error: any) => {
    if (isCancel(error)) { return; }
    console.log('send event stream catched error', error);
    const isReadableStream = typeof error?.data?._readableState === 'object';
    if (isReadableStream) { // readable stream error
      let info: any = '', data;
      for await (const chunk of error.data) { info += chunk; }
      console.log('isReadableStream error', info);
      try {
        data = JSON.parse(info);
        if (data?.error) { error = data?.error; }
      } catch(err) { data = info; }
      // errObj = { name: error.name, message: error.message, data, info }
    }
    if (error?.response?.data) {
      error = { name: error.name, message: JSON.stringify(error?.response?.data) }
    } else if (error?.data) {
      error = { name: error.name || error?.message, message: JSON.stringify(error.data) }
    }
    // if (error?.data) {
    //   console.log('error?.data', error?.data, error?.data?.toString?.(), error?.response?.data)
    // }
    res.write('data: ' + JSON.stringify({ error: _.pick(jsonifyError(error), 'name', 'message') }) + '\n\n');
    res.end();
    return;
    // throw error;
  });
  if (typeof result === 'object') {
    res.write('data: ' + JSON.stringify(result) + '\n\n');
  }
  res.end();
}
