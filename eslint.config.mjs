import next from 'eslint-config-next'

const config = [
  ...next,
  {
    // shadcn/ui primitives and the use-mobile hook are managed by the shadcn
    // CLI — re-adding a component overwrites them. Don't lint files we don't
    // own.
    ignores: [
      '.next/**',
      'node_modules/**',
      'drizzle/**',
      'src/components/ui/**',
      'src/hooks/use-mobile.ts',
    ],
  },
]

export default config
