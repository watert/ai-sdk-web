export function getErrorInfo(err) {
//   console.log('err', err);
  let status = 500, code = 500;
  if (err?.error && !err?.message) {
    return getErrorInfo(err?.error);
  }
  let message = err?.message?.toString() || (typeof err === 'string' ? err: "Something broke!");
  let data = err?.data || null;
  if (err?.response?.data) {
    data = err?.response?.data;
  }
  if (err?.response?.status) {
    status = err?.response?.status;
    code = err?.response?.status;
  }
  return { status, message, data, code };
}