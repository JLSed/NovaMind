# NovaMind Copilot Instructions

## 🧠 Project Philosophy & Core Logic

- **Concept**: Chronobiology & Energy Management.
- **Core Principle**: **Output > Mood**. The app compares subjective feeling (Pre-Work) vs. actual performance (Post-Work) to find patterns.
- **Goal**: Identify "Peak Performance Windows" and "Crash Zones" based on biological data (Sleep) and context (Tags).

## 🏗 Project Architecture

- **Framework**: Expo (React Native) with Expo Router (File-based routing).
- **Language**: TypeScript (Strict mode).
- **Styling**: NativeWind (Tailwind CSS) - use `className` props.
- **Backend**: Supabase (Auth & Database).
- **AI Engine**: Google Gemini 1.5 Flash (via `@google/generative-ai`).

## 📂 Key Directories & Files

- `app/`: Routes and screens.
  - `_layout.tsx`: Root layout, handles Auth state (`supabase.auth.onAuthStateChange`) and protection.
  - `(tabs)/`: Main tab navigation (Home, Session, History).
- `lib/`: Service integrations.
  - `supabase.ts`: Supabase client setup.
  - `gemini.ts`: AI logic, `SYSTEM_PROMPT`, and context injection.
- `components/`: Reusable UI components.
  - `ui/icon-symbol.tsx`: Cross-platform icon wrapper.
- `hooks/`: Custom hooks (e.g., `useColorScheme`).

## 🔄 Data Flow & Schema

- **Database**: Single table `productivity_logs`.
  - `id`: UUID
  - `user_id`: UUID (Auth)
  - `entry_date`: Date
  - `log_data`: **JSONB** (Stores all metrics).
- **JSON Structure (`log_data`)**:
  - `daily_bio_metrics`: `sleep_duration_hours`, `waking_condition`, `sleep_waketime`.
  - `sessions`: Array of work blocks.
    - `pre_session`: `subjective_mood`, `context_tags` (e.g., ["caffeine", "quiet"]), `start_time`.
    - `post_session`: `output_rating` (High/Med/Low), `net_focus_minutes` (Total - Breaks), `distraction_level`.

## 🎨 Styling Conventions

- Use **NativeWind** (`className`) for all styling.
- **Colors**: Use Slate (`bg-slate-900`, `text-slate-300`) for dark mode base.
- **Layout**: Flexbox is default. Use `flex-1`, `justify-center`, `items-center`.
- **Safe Area**: Use `SafeAreaView` from `react-native-safe-area-context` for screen containers.

## 🛠 Developer Workflow

- **Start**: `npx expo start` (Select Android/iOS/Web).
- **Reset**: `npm run reset-project` (Resets to blank state).
- **Env Vars**: Use `EXPO_PUBLIC_` prefix for client-side variables (e.g., `EXPO_PUBLIC_SUPABASE_URL`).

## 🤖 AI Integration Patterns

- **Strategy**: **Context Injection**. We do NOT fine-tune. We send `HISTORY_LOGS` (last 30 days) + `CURRENT_STATE` in every prompt.
- **Prompt Engineering**: Defined in `lib/gemini.ts`.
- **Output**: AI returns Markdown formatted text with sections: `📊 Daily Prediction`, `🕒 Recommended Flow`, `💡 Insight`.

## 🚨 Common Pitfalls

- **Auth Redirects**: Ensure `app/_layout.tsx` logic covers all protected routes.
- **JSON Data**: `log_data` is unstructured in DB; strictly validate types in TypeScript (see `LogEntry` type in `history.tsx`).
- **Icons**: Use `IconSymbol` instead of direct library imports for cross-platform consistency.

## 🚨 Instruction

-- stop changing the AI model being used in the project. it should always be "gemini-flash-latest"
-- before adding a function, constant, or component, check if there is an existing one that can be reused or extended to avoid duplication.
-- create a list of function, constant, or component that might be reusable or extendable then read the list to check if the requested prompt can use components in this list.
-- when adding constant data options, always add them to the constants/data.ts file
-- when dealing with icons make sure they are mapped correctly to SF symbols and materials icon in the components/ui/icon-symbol.tsx file
-- if you encounter a prompt that requires significant changes to the data structure, architecture, or core logic of the app, notify the user and get approval before proceeding.
-- if you encounter an unused import, variable, function, or component in the codebase, remove it to keep the code clean and efficient.
-- make sure to check if the code you are adding or modifying does not produce any TypeScript errors or warnings.
-- before finishing your response check if there are any errors or warnings in the code you provided and fix them.
-- when creating a new screen or component, ensure it follows the existing design patterns and coding conventions used throughout the project.
-- always ensure that any new code you write is compatible with both Android and iOS platforms, considering any platform-specific nuances.
-- ui components should be designed to be as reusable as possible and be placed in the components/ui directory.

# JavaScript/TypeScript Best Practices for GitHub Copilot

## Overview

These instructions guide GitHub Copilot to generate high-quality, modern JavaScript and TypeScript code following established best practices.

## General JavaScript/TypeScript Guidelines

### Modern JavaScript (ES6+)

**Instructions for Copilot:**

- Always use ES6+ features (const/let, arrow functions, template literals, destructuring)
- Never use `var`; use `const` by default, `let` only when reassignment is needed
- Use arrow functions for callbacks and short functions
- Use template literals for string interpolation
- Use destructuring for cleaner code
- Use async/await instead of promise chains when possible
- Use modules (import/export) instead of CommonJS require

**Example:**

```javascript
// Use const/let, not var
const MAX_RETRIES = 3;
let currentAttempt = 0;

// Arrow functions
const calculateTotal = (items) =>
  items.reduce((sum, item) => sum + item.price, 0);

// Template literals
const greeting = `Hello, ${user.name}! You have ${user.messages.length} new messages.`;

// Destructuring
const { name, age, email } = user;
const [first, second, ...rest] = array;

// Async/await instead of promise chains
async function fetchUserData(userId) {
  try {
    const user = await getUserById(userId);
    const posts = await getPostsByUser(user.id);
    const comments = await getCommentsByUser(user.id);
    return { user, posts, comments };
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}

// Modules
import { apiClient } from "./api/client";
import type { User } from "./types/user";

export const userService = {
  async getUser(id) {
    return await apiClient.get(`/users/${id}`);
  },
};
```

## TypeScript Specific

### Type Annotations

**Instructions for Copilot:**

- Always add type annotations for function parameters and return values
- Use interfaces for object shapes
- Use type aliases for union types and complex types
- Use enums for fixed sets of values
- Prefer `interface` over `type` for object types (better error messages)
- Use generic types for reusable components
- Use `unknown` instead of `any` when type is truly unknown
- Enable strict mode in tsconfig.json

**Example:**

```typescript
// Interface for object shapes
interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  metadata?: Record<string, unknown>; // Optional property
}

// Enum for fixed values
enum UserRole {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

// Type alias for unions
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Generic function with proper types
function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => ({ success: true, data }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Function with full type annotations
async function createUser(
  name: string,
  email: string,
  role: UserRole = UserRole.User
): Promise<User> {
  const user: User = {
    id: generateId(),
    name,
    email,
    role,
    createdAt: new Date(),
  };

  await saveToDatabase(user);
  return user;
}

// Use unknown instead of any
function processUnknownData(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }
  if (typeof data === "object" && data !== null && "toString" in data) {
    return String(data);
  }
  return "Unknown data";
}

// Generic class
class Repository<T> {
  private items: Map<string, T> = new Map();

  add(id: string, item: T): void {
    this.items.set(id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }
}
```

### Type Guards

**Instructions for Copilot:**

- Use type guards to narrow types
- Create custom type guards for complex type checking
- Use discriminated unions for better type safety

**Example:**

```typescript
// Built-in type guards
function processValue(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toString();
}

// Custom type guard
interface Dog {
  type: "dog";
  bark(): void;
}

interface Cat {
  type: "cat";
  meow(): void;
}

type Pet = Dog | Cat;

// Type guard function
function isDog(pet: Pet): pet is Dog {
  return pet.type === "dog";
}

// Usage with discriminated union
function handlePet(pet: Pet): void {
  if (isDog(pet)) {
    pet.bark(); // TypeScript knows it's a Dog
  } else {
    pet.meow(); // TypeScript knows it's a Cat
  }
}

// Array type guard
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
```

## Error Handling

**Instructions for Copilot:**

- Always use try/catch for async operations
- Create custom error classes for different error types
- Include context in error messages
- Never swallow errors silently
- Use error boundaries in React applications
- Validate input and throw meaningful errors

**Example:**

```typescript
// Custom error classes
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
  }
}

// Function with proper error handling
async function getUserById(userId: string): Promise<User> {
  // Input validation
  if (!userId || typeof userId !== "string") {
    throw new ValidationError("User ID must be a non-empty string", "userId");
  }

  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError("User", userId);
      }
      throw new ApplicationError(
        `Failed to fetch user: ${response.statusText}`,
        "FETCH_ERROR",
        response.status
      );
    }

    const user = await response.json();

    // Validate response data
    if (!isValidUser(user)) {
      throw new ValidationError("Invalid user data received from API");
    }

    return user;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof ApplicationError) {
      throw error;
    }

    // Wrap unknown errors
    console.error("Unexpected error fetching user:", error);
    throw new ApplicationError("An unexpected error occurred", "UNKNOWN_ERROR");
  }
}

// Error handling in Express
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ApplicationError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        field: error instanceof ValidationError ? error.field : undefined,
      },
    });
  }

  console.error("Unhandled error:", error);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An internal error occurred",
    },
  });
});
```

## Code Organization and Patterns

### Module Organization

**Instructions for Copilot:**

- Organize code by feature, not by type
- Keep files focused and single-purpose
- Use barrel exports (index.ts) to simplify imports
- Separate concerns (business logic, data access, presentation)

**Example Structure:**

```typescript
// src/features/users/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// src/features/users/repository.ts
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Data access logic
  }

  async save(user: User): Promise<void> {
    // Save logic
  }
}

// src/features/users/service.ts
export class UserService {
  constructor(private repository: UserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User", id);
    }
    return user;
  }
}

// src/features/users/controller.ts
export class UserController {
  constructor(private service: UserService) {}

  async getUser(req: Request, res: Response): Promise<void> {
    const user = await this.service.getUser(req.params.id);
    res.json(user);
  }
}

// src/features/users/index.ts (barrel export)
export * from "./types";
export * from "./repository";
export * from "./service";
export * from "./controller";
```

### Functional Programming Patterns

**Instructions for Copilot:**

- Prefer pure functions (no side effects)
- Use immutable data structures
- Use Array methods (map, filter, reduce) instead of loops
- Use function composition for complex operations
- Avoid mutating objects; create new ones instead

**Example:**

```typescript
// Pure functions
const calculateTotal = (items: Item[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const applyDiscount = (total: number, discount: number): number =>
  total * (1 - discount);

// Immutable updates
const updateUser = (user: User, updates: Partial<User>): User => ({
  ...user,
  ...updates,
  updatedAt: new Date(),
});

// Array operations instead of loops
const activeUsers = users.filter((user) => user.isActive);
const userNames = users.map((user) => user.name);
const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

// Function composition
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduce((acc, fn) => fn(acc), value);

const processOrder = pipe(
  validateOrder,
  calculateTax,
  applyDiscount,
  formatForDisplay
);

// Avoid mutation
const badExample = (items: Item[]): void => {
  items.push({ id: "1", name: "New Item" }); // Mutates input
};

const goodExample = (items: Item[]): Item[] => {
  return [...items, { id: "1", name: "New Item" }]; // Returns new array
};
```

## Async Patterns

**Instructions for Copilot:**

- Use async/await for cleaner async code
- Handle errors in async functions
- Use Promise.all for parallel operations
- Use Promise.allSettled when you need all results regardless of failures
- Avoid mixing callbacks and promises

**Example:**

```typescript
// Parallel operations with Promise.all
async function loadDashboardData(userId: string): Promise<DashboardData> {
  try {
    const [user, stats, notifications] = await Promise.all([
      getUserById(userId),
      getUserStats(userId),
      getNotifications(userId),
    ]);

    return {
      user,
      stats,
      notifications,
    };
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    throw error;
  }
}

// Promise.allSettled for fault tolerance
async function loadOptionalData(userId: string): Promise<Partial<UserData>> {
  const results = await Promise.allSettled([
    getUserProfile(userId),
    getUserPreferences(userId),
    getUserHistory(userId),
  ]);

  const data: Partial<UserData> = {};

  if (results[0].status === "fulfilled") {
    data.profile = results[0].value;
  }
  if (results[1].status === "fulfilled") {
    data.preferences = results[1].value;
  }
  if (results[2].status === "fulfilled") {
    data.history = results[2].value;
  }

  return data;
}

// Async retry pattern
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}
```

## Testing

**Instructions for Copilot:**

- Write tests using Jest or Vitest
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error conditions
- Use TypeScript for tests too

**Example:**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user-service";
import { UserRepository } from "./user-repository";

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as any;

    userService = new UserService(mockRepository);
  });

  describe("getUser", () => {
    it("should return user when found", async () => {
      // Arrange
      const mockUser: User = {
        id: "123",
        name: "John Doe",
        email: "john@example.com",
      };
      mockRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUser("123");

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith("123");
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when user does not exist", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUser("999")).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for invalid user ID", async () => {
      // Act & Assert
      await expect(userService.getUser("")).rejects.toThrow(ValidationError);
    });
  });

  describe("createUser", () => {
    it("should create and return new user", async () => {
      // Arrange
      const userData = {
        name: "Jane Doe",
        email: "jane@example.com",
      };
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toMatchObject(userData);
      expect(result.id).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(userData)
      );
    });

    it("should validate email format", async () => {
      // Arrange
      const invalidData = {
        name: "John",
        email: "invalid-email",
      };

      // Act & Assert
      await expect(userService.createUser(invalidData)).rejects.toThrow(
        ValidationError
      );
    });
  });
});

// Testing async hooks in React
import { renderHook, waitFor } from "@testing-library/react";

describe("useUser hook", () => {
  it("should fetch user data", async () => {
    // Arrange
    const mockUser = { id: "1", name: "John" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    // Act
    const { result } = renderHook(() => useUser("1"));

    // Assert
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });
});
```

## Security Best Practices

**Instructions for Copilot:**

- Always validate and sanitize user input
- Never use eval() or Function() constructor with user input
- Use parameterized queries for database operations
- Implement CSRF protection
- Use Content Security Policy headers
- Sanitize HTML content to prevent XSS
- Never expose sensitive data in client-side code

**Example:**

```typescript
import DOMPurify from "dompurify";
import { z } from "zod";

// Input validation using Zod
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().max(150),
  role: z.enum(["admin", "user", "guest"]),
});

function createUser(data: unknown): User {
  // Validate input
  const validated = userSchema.parse(data);

  // Process validated data
  return {
    id: generateId(),
    ...validated,
    createdAt: new Date(),
  };
}

// XSS protection
function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p"],
    ALLOWED_ATTR: ["href"],
  });
}

// SQL injection protection (using parameterized query)
async function getUserByEmail(email: string): Promise<User | null> {
  // Good: parameterized query
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  // Bad: string concatenation (never do this)
  // const result = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

  return result.rows[0] || null;
}

// CSRF protection middleware
function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-csrf-token"];
  const sessionToken = req.session.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
}

// Rate limiting to prevent brute force
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
});

app.post("/api/login", loginLimiter, async (req, res) => {
  // Login logic
});

// Secure password handling
import bcrypt from "bcrypt";

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Never expose sensitive data
class UserDTO {
  id: string;
  name: string;
  email: string;

  static fromUser(user: User): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      // Don't include password hash, tokens, etc.
    };
  }
}
```

## Documentation and Comments

**Instructions for Copilot:**

- Use JSDoc comments for functions, classes, and complex types
- Document parameters, return values, and exceptions
- Add examples for complex functions
- Use TSDoc for TypeScript-specific documentation

**Example:**

````typescript
/**
 * Fetches user data from the API with retry logic.
 *
 * @param userId - The unique identifier of the user
 * @param options - Optional configuration for the fetch
 * @param options.includeMetadata - Whether to include user metadata
 * @param options.maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to the user data
 * @throws {NotFoundError} When user is not found
 * @throws {ValidationError} When userId is invalid
 *
 * @example
 * ```typescript
 * const user = await fetchUser('123', { includeMetadata: true });
 * console.log(user.name);
 * ```
 */
async function fetchUser(
  userId: string,
  options: {
    includeMetadata?: boolean;
    maxRetries?: number;
  } = {}
): Promise<User> {
  // Implementation
}

/**
 * Repository for managing user data.
 *
 * @remarks
 * This class provides methods for CRUD operations on user entities.
 * All methods include proper error handling and logging.
 *
 * @example
 * ```typescript
 * const repo = new UserRepository(database);
 * const user = await repo.findById('123');
 * ```
 */
class UserRepository {
  // Class implementation
}
````

## Performance Optimization

**Instructions for Copilot:**

- Use memoization for expensive computations
- Implement debouncing and throttling for user interactions
- Use lazy loading for large datasets
- Optimize bundle size with code splitting
- Use web workers for CPU-intensive tasks

**Example:**

```typescript
import { useMemo, useCallback } from "react";

// Memoization
function ExpensiveComponent({ data }: { data: Item[] }) {
  // Memoize expensive calculation
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [data]);

  return <div>Total: ${total}</div>;
}

// Debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Usage
const searchUsers = debounce(async (query: string) => {
  const results = await api.searchUsers(query);
  setSearchResults(results);
}, 300);

// Throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Code splitting with dynamic imports
const AdminPanel = lazy(() => import("./components/AdminPanel"));

// Virtual scrolling for large lists
import { FixedSizeList } from "react-window";

function LargeList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => <div style={style}>{items[index].name}</div>}
    </FixedSizeList>
  );
}
```
