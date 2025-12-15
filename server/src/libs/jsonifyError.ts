import { AxiosError } from "axios";

function getSuperclasses(obj) {
  const superclasses: any[] = [];
  let temp: any = Object.getPrototypeOf(obj);
  if (temp !== null) temp = Object.getPrototypeOf(temp);
  while (temp !== null) {
    superclasses.push(temp.constructor.name);
    temp = Object.getPrototypeOf(temp);
  }
  return superclasses;
}

function stripColorsIfString(arg) {
  if (typeof arg !=="string") return arg;
  /* eslint-disable-next-line no-control-regex */
  return arg.replace(/\u001b\[\d{1,2}m/g, "").replace(/\\u001b\[\d{1,2}m/g, "");
}

export function jsonifyError(error: Error | AxiosError | any) {
  if (typeof error === 'string') {
    error = new Error(error);
  }
  if (error instanceof AxiosError) {
    console.log('instanceof axios err');
    const { status, statusText, data } = error?.response || {};
    return { name: statusText, status, data, stack: stripColorsIfString(error.stack) || "<no stack trace available>" }
  }
  if (!(error instanceof Error)) return error;
  try {
    const wrappedError: any = {};
    wrappedError.name = error.name || "<no name available>";
    wrappedError.className = error.constructor.name || "<no class name available>";
    wrappedError.message = stripColorsIfString(error.message) || "<no message available>";
    wrappedError.superclasses = getSuperclasses(error);
    wrappedError.enumerableFields = {};
    for (const x in error) {
      if (typeof error[x] === "function") continue;
      wrappedError.enumerableFields[x] = stripColorsIfString(error[x]);
    }
    if (typeof error.stack === "string" && error.stack.length > 0) {
      wrappedError.stack = error.stack.split('\n').map(x => x.replace(/^\s+/, "")).filter(x => x).map(stripColorsIfString);
    } else {
      wrappedError.stack = stripColorsIfString(error.stack) || "<no stack trace available>";
    }
    return wrappedError;
  } catch(err) {
    console.log('jsonifyError failed', err);
    return { message: error?.message || error?.toString() || 'Unknown Error' };
  }
}
