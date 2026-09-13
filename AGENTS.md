- Instead of manually maintaining entity arrays or relying on folder-based discovery at runtime, you can use the discovery:export CLI command to generate a TypeScript barrel file with explicit entity imports:

```bash
bun run mikro-orm discovery:export
```

This scans your entity source files (using entitiesTs or entities paths from your config) and generates a file like:

```typescript
import { Article } from "./entities/Article.js";
import { User } from "./entities/User.js";

export const entities = [Article, User] as const;
```