import { customAlphabet } from "nanoid";

export function customNanoId(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 12);
  return nanoid() //=> Ex: "ID8LBvumciN2"
}