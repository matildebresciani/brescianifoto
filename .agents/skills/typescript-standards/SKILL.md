---
name: typescript-standards
description: Use when editing TypeScript, TSX, React, or other application logic in this repository. Applies the shared coding standards that were extracted from the repo AGENTS instructions.
---

# TypeScript Standards

Use this skill for shared TypeScript and React work in this repository. Keep package-specific instructions from local `AGENTS.md` files in force alongside this skill.

## Biome

- Read both the root `biome.jsonc` and the nearest app or package `biome.jsonc` before making code changes.
- If the configs conflict, the local app or package config wins.
- Before finishing, ensure the changed code passes the applicable Biome formatting and lint rules.

## Naming

- Boolean variables, props, parameters, and return values must use semantic prefixes such as `is`, `has`, `should`, `can`, or `will`.

## Type Assertions

- Prefer `unknown` over `any` when a type is not yet known.
- Avoid `as` when narrowing, type guards, generics, or better typing can solve the problem.
- At external data boundaries, prefer the app's predefined Zod validators instead of coercing payloads with `as`.
- If an assertion is genuinely unavoidable, add the required ignore comment immediately above it and explain why narrowing is not possible:

```typescript
// biome-ignore lint/plugin: The external legacy API returns an untyped object that we know maps exactly to UserProfile here, and narrowing is not possible.
const profile = legacyData.user as UserProfile;
```

## Errors

- Prefer `neverthrow` for error handling and control flow.
- Wrap native or third-party operations that can throw with `Result.fromThrowable`, `ResultAsync.fromPromise`, or equivalent `ok` / `err` handling.
- Throw only when a framework requires exception-based control flow, such as Next.js `notFound()` / `redirect()` or TanStack Query `queryFn` failures.

## Comments

- Write comments to explain why the code exists or why an edge case matters, not to restate the syntax.
- Use TSDoc for exported or shared utilities, complex types, and public component props.
- Use inline comments sparingly for non-obvious internal logic.

## React State

- Avoid `useEffect` when derived state during render is sufficient.
- Treat `useEffect` as an escape hatch for synchronizing with external systems such as DOM subscriptions, third-party libraries, or sockets.

## Control Flow

- Prefer guard clauses and early returns over nested conditionals.
- Keep the happy path flat and easy to scan.

## Exhaustive Union Checks

When switching over a union type, add an exhaustive check in the `default` branch so that TypeScript catches unhandled members at compile time:

```typescript
import type { Assert } from "@/lib/types/utilities"; // repo utility
import type { Equals } from "ts-toolbelt/out/Any/Equals";

// key: 'a' | 'b'
switch (key) {
    case "a":
        // ...
        break;
    case "b":
        // ...
        break;
    default: {
        type _ExhaustiveCheck = Assert<Equals<typeof key, never>>;
        break;
    }
}
```

- `Assert` is a repo-provided utility: `export type Assert<T extends true | 1> = T;`
- `Equals` comes from the `ts-toolbelt` package.
- The check is a type-level no-op at runtime; it only produces a compile error when `key` is not `never`, meaning a union member was not handled.
- There should almost always be a `default` case to handle unexpected runtime values. If the other branches return a value, the `default` branch must also return a value.
- The check may be explicit about intentionally unhandled members instead of asserting `never`. Use this when some members of the union should legitimately fall through to the default case:

```typescript
// key: 'a' | 'b'
switch (key) {
    case "a":
        // ...
        break;
    default: {
        // 'b' intentionally uses the fallback
        type _ExhaustiveCheck = Assert<Equals<typeof key, "b">>;
        break;
    }
}
```
