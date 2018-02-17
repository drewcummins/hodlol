
export function sleep(ms:number):Promise<NodeJS.Timer> {
  return new Promise(resolve => setTimeout(resolve, ms));
}