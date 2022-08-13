export function randomString(length = 10): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const lastIndex = characters.length - 1;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * lastIndex));
  }
  return result;
}
