export function promiseTimeout(ms, fn: () => Promise<any>){
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  let timeout = wait(ms).then(() => {
    return Promise.reject(new Error(`Timed out in ${ms} ms`))
  });
  return Promise.race([ fn(), timeout ]);
}