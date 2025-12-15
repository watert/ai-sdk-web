export default async function asyncWait(ts = 500) {
  await new Promise(resolve => setTimeout(resolve, ts));
}