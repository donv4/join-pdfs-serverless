/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        JOIN_PDFS_STORE: KVNamespace;
      };
    };
  }
}
