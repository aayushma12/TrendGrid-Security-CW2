/**
 * ESLint config that ENFORCES the "tunnel" every API must pass through.
 * These rules are what turn workflowtunelling.md from a convention into an invariant.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    // tsconfig.json alone excludes tests/ (see its `exclude`), which made
    // every test file fail to parse for type-aware rules. tsconfig.test.json
    // includes both src/ and tests/, so listing both here covers all files
    // ESLint is ever pointed at without changing what either tsconfig builds.
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: { project: ['./tsconfig.json', './tsconfig.test.json'] },
      node: true,
    },
  },
  ignorePatterns: ['dist', 'node_modules', 'prisma/generated'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],

    /**
     * TUNNEL GUARDRAIL
     * Nobody may call res.json / res.send / res.end directly. Every response
     * must go through utils/response.ts so the shape is standardized.
     * (Exempted only for the response builder itself via overrides below.)
     */
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "CallExpression[callee.type='MemberExpression'][callee.object.name='res'][callee.property.name=/^(json|send|end)$/]",
        message:
          'Do not call res.json/res.send/res.end directly. Use success(), created(), paginated(), noContent(), or throw an AppError.',
      },
    ],
  },
  overrides: [
    /**
     * TUNNEL GUARDRAIL — LAYER BOUNDARIES
     * Only applies to controller/ and route/ files. Services legitimately
     * need to import their own repositories, so the base rules are relaxed
     * and this override selectively enforces the boundary.
     */
    {
      files: ['src/**/controller/**/*.ts', 'src/**/route/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '**/repository',
                  '**/repository/**',
                  '../repository',
                  '../repository/*',
                  '../../repository',
                  '../../repository/*',
                  '../../../repository',
                  '../../../repository/*',
                ],
                message:
                  'Controllers/routes must NOT import repositories directly. Route → controller → service → repository.',
              },
            ],
          },
        ],
      },
    },

    /* The response builder is the only place res.json is legal. */
    {
      files: ['src/utils/response.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },

    /* Tests build throwaway Express apps/handlers to exercise middleware in
     * isolation — they never go through the app's real response tunnel, so
     * the tunnel invariant doesn't apply to them. */
    {
      files: ['tests/**/*.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },

    /* Swagger JSDoc modules export nothing intentionally. */
    {
      files: ['src/**/swagger/**/*.ts'],
      rules: {
        '@typescript-eslint/no-empty-interface': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ],
};
