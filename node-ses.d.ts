declare module "node-ses" {
  export function createClient({ key: string, secret: string, amazon?: string }): Client;
}
