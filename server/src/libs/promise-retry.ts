const _range = (start, count) => Array.apply(0, Array(count)).map((e, i) => i + start);

type PromiseRetryFn = (t: number, cancel: (err: any) => void) => Promise<any>;

export async function promiseRetry(times: number, asyncFn: PromiseRetryFn) {
  let rejected: any;
  const cancel = (err: any) => { rejected = err; };
  return _range(0, Math.max(times, 1)).reduce((agg, t) => agg.catch((e) => {
    if (rejected) {
      return Promise.reject(rejected);
    }
    if (t >= times - 1) {
      // console.log(`Failed retried ${t + 1} times`);
      return Promise.reject(e);
      // return Promise.reject(new Error(`Failed retried ${t + 1} times`));
    }
    return asyncFn(t + 1, cancel);
  }), asyncFn(0, cancel));
}