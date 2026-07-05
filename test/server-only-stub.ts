// Next.js normally provides a "server-only" import guard at build time.
// Vitest runs outside that pipeline, so this stub satisfies the import
// with a no-op when server-action modules are unit-tested directly.
export {};
