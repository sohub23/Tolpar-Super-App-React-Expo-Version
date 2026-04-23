declare module "@xmpp/client" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function client(options: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function xml(name: string, attrs?: any, ...children: any[]): any;
}

declare module "@xmpp/debug" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debug: (xmpp: any) => void;
  export default debug;
}