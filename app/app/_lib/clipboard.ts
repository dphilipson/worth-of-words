// I really don't care if this is best practice. This is very low on the list of
// things I'm interested in.
export function copyToClipboard(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}
