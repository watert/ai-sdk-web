const isClipboardSupported = () => {
  return !!navigator.clipboard?.writeText;
};
export async function copyToClipboard(text: string | any) {
  if (typeof text !== 'string') {
    text = JSON.stringify(text, null, 2);
  }
  if (isClipboardSupported()) {
    return navigator.clipboard.writeText(text).catch(err => {
        console.warn('copyToClipboard failed', err);
        throw err;
    });
  }
  const textArea = document.createElement('textarea');
  Object.assign(textArea.style, {
    position: 'fixed', top: 0, left: 0, width: '2em', height: '2em', padding: 0,
    border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent',
  });
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.log('copy fail', err);
    return false;
  }
}
