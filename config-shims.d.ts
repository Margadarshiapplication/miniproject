/** Minimal declarations when tooling cannot resolve node_modules (e.g. before npm install). */
declare module "tailwindcss" {
  export type Config = Record<string, unknown>;
}

declare module "tailwindcss-animate" {
  const plugin: { handler: () => void };
  export default plugin;
}
