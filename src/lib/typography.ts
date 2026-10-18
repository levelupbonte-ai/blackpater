/** French typography: non-breaking spaces before ? ! : ; » and after «, so punctuation never wraps alone. */
export function frenchTypography(s: string): string {
  return s.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
}
