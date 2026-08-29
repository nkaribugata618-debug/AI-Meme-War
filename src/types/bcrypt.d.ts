/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'bcrypt' {
  export function hash(data: any, saltOrRounds: string | number): Promise<string>;
  export function compare(data: any, encrypted: string): Promise<boolean>;
}
