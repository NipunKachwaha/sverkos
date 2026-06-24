import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Add the strict TypeScript rules ported from the old Convex setup
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "array-bracket-spacing": ["error", "never"],
      "object-curly-newline": ["error", { consistent: true }],
      "keyword-spacing": ["error", { before: true, after: true }],
      "consistent-return": "error",
      semi: ["error", "always"],
      curly: ["error"],
      "no-eval": ["error"],
      "linebreak-style": "off",
      "arrow-spacing": ["error", { before: true, after: true }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../"],
              message: "Relative imports are not allowed. Please use '~/' or '@/' instead.",
            },
          ],
        },
      ],
    },
  }
]);

export default eslintConfig;