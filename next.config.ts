import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Type-safe routes — `<Link href>` is checked against your actual routes.
  typedRoutes: true,

  // `pg` (node-postgres) ships native bindings — keep it out of the bundler.
  // Without this, Turbopack fails to resolve it in dev with a hashed-name error.
  serverExternalPackages: ['pg'],
}

export default nextConfig
