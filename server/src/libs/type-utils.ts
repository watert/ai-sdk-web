export function isAsyncIterable(value: any): boolean {
  return typeof value?.[Symbol.asyncIterator] === 'function';
}
export function isIterable(value: any): boolean {
  return typeof value?.[Symbol.iterator] === 'function';
}
export function isPromise(value: any): boolean {
  return value instanceof Promise || typeof value?.then === 'function';
}