import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

// Invoked with the repo root as cwd (see app/package.json's "lint" script) so this
// config can cover app/, backend/, database/, and automation/ in one run — ESLint's
// flat config treats process.cwd() as the base path and refuses to lint anything
// outside it, and those directories are siblings of app/, not descendants.
export default tseslint.config(
  {
    ignores: ['app/out/**', 'app/dist/**', '**/*.tsbuildinfo']
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // TypeScript already checks this more accurately (and understands ambient/global
    // types like `process`/`window`) than ESLint's own no-undef can — avoids false positives.
    rules: {
      'no-undef': 'off'
    }
  },
  {
    files: ['app/src/renderer/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  prettierConfig
)
