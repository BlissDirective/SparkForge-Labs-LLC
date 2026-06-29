# Feature Workflow: Build-Test-Integrate Cycle

## Table of Contents
1. The Cycle Explained
2. Breaking an App into Features
3. Sizing Features Correctly
4. Building a Single Feature
5. Writing Tests for Each Feature
6. Version Control per Feature
7. Integrating Features Together
8. Rolling Back a Broken Feature
9. Mapping to SparkForge's Stage System
10. Learning File Template

---

## 1. The Cycle Explained

Building an app feature-by-feature is like building with LEGO. You don't dump all the bricks on the floor and try to build everything at once. Instead:

1. **Pick one brick** (one feature)
2. **Build it** (write the code)
3. **Check it** (test it works)
4. **Snap it onto the rest** (integrate with other features)
5. **Repeat** with the next brick

This cycle prevents overwhelm and catches problems early.

```
    ┌──────────┐
    │  PICK a  │
    │ feature  │
    └────┬─────┘
         │
    ┌────▼─────┐
    │  BUILD   │  Write the code
    │   it     │
    └────┬─────┘
         │
    ┌────▼─────┐
    │  TEST    │  Make sure it works alone
    │   it     │
    └────┬─────┘
         │
    ┌────▼──────┐
    │ INTEGRATE │  Connect to the rest of the app
    │    it     │
    └────┬──────┘
         │
    ┌────▼──────┐
    │  TEST     │  Make sure it works WITH everything else
    │ together  │
    └────┬──────┘
         │
         └───> Back to PICK next feature
```

---

## 2. Breaking an App into Features

Before building, break the app into a feature list. Order them by dependency — what needs to exist first?

**Example: A social media app**

| Order | Feature | Why This Order |
|-------|---------|---------------|
| 1 | Project setup and config | Everything needs this first |
| 2 | Database setup | Most features need to save data |
| 3 | User registration and login | Almost everything needs to know "who" is using it |
| 4 | User profile page | Once they can log in, they need a profile |
| 5 | Create posts | Core functionality |
| 6 | News feed (view posts) | Need posts to exist first |
| 7 | Like and comment | Need posts and users first |
| 8 | Follow users | Need user profiles first |
| 9 | Notifications | Need likes/comments/follows to trigger them |
| 10 | Search | Need content to search through |

**Example: SparkForge (this project)**

| Order | Feature | Why This Order |
|-------|---------|---------------|
| 1 | Foundation config and types | Every component references these |
| 2 | Database schema and API routes | Games and UI need data endpoints |
| 3 | Auth and layout shell | Must know who the user is before showing content |
| 4 | Core pages and navigation | Need a place to display games |
| 5 | Gamification (XP, badges, streaks) | Games award XP, so the system must exist first |
| 6 | Flagship games (5) | Core product, depend on all above |
| 7 | Remaining games (30) | Follow same patterns established by flagships |
| 8 | Parent dashboard and payments | Needs games and user system in place |
| 9 | Content agent | Needs all content structures defined |
| 10 | Polish and deploy | Everything must work before shipping |

**Rule of thumb:** Build the boring stuff first (auth, database), then the fun stuff (features users see).

---

## 3. Sizing Features Correctly

A "feature" should be small enough to build, test, and integrate in one focused session. If it feels too big, break it down further.

### Too Big (Needs Splitting)

- "Build the entire user system" — This is 4+ features: registration, login, profile, password reset
- "Create all API routes" — Split by resource: users, posts, comments, etc.
- "Add all games" — Each game is its own feature

### Just Right

- "User can register with email and password"
- "API endpoint to create a post"
- "Login form submits and redirects to dashboard"
- "AI Pet Trainer game: welcome and learn phases"

### Too Small (Not Worth Isolating)

- "Add a CSS class" — This is part of building a component, not a standalone feature
- "Create a single type definition" — Part of a larger feature

### The Checklist Test

A feature is the right size when you can answer YES to all of these:

- [ ] Can I describe what "done" looks like in 2-3 sentences?
- [ ] Can I build it in under a day?
- [ ] Can I test it meaningfully in isolation?
- [ ] Does it deliver a visible or measurable result?

---

## 4. Building a Single Feature

For each feature, follow this micro-process:

### 4a. Define What "Done" Looks Like

Before writing code, write down acceptance criteria — concrete statements that describe success:

- "A user can type their email and password and create an account"
- "The password is stored securely (hashed, not plain text)"
- "If the email already exists, show an error message"
- "The API returns 201 on success, 400 on bad input, 409 on duplicate"

### 4b. Design the Data

What data does this feature need?

- What fields? (name, email, password)
- What types? (text, number, date, boolean)
- Any relationships? (a user HAS many posts)
- Any constraints? (email must be unique, password minimum 8 characters)

### 4c. Build Backend First (Usually)

The backend is the engine. Build it first, then build the dashboard (frontend) that displays it.

1. Create the database model/table
2. Create the API endpoint(s)
3. Test the API with sample requests (curl, Postman, or a quick test file)

### 4d. Build Frontend Second

Once the backend works:

1. Create the UI component(s)
2. Connect them to the API
3. Handle loading states, errors, and success messages

### 4e. Write Tests

See Section 5. Write tests while the feature is fresh in your mind, not later.

### 4f. Definition of Done Checklist

Copy this for every feature. Do not skip items.

```
FEATURE DONE CHECKLIST — [Feature Name]
- [ ] Acceptance criteria met (all statements from 4a pass)
- [ ] Backend endpoint works (tested manually or with unit test)
- [ ] Frontend renders correctly (checked in browser)
- [ ] Error states handled (bad input, network failure, auth failure)
- [ ] Loading states present (spinner or skeleton while data loads)
- [ ] Tests written and passing (unit + at least one integration)
- [ ] No TypeScript errors (npx tsc --noEmit passes)
- [ ] No console errors in browser dev tools
- [ ] Code committed on feature branch
```

### 4g. Create the Learning File

Document what was built and why. See Section 10 for the template.

---

## 5. Writing Tests for Each Feature

> For comprehensive testing guidance (setup, tools, code examples, security testing), see **TESTING.md** in the project root. This section focuses on the *workflow* of testing within the feature cycle.

### When to Write Tests

Write tests **during** the build, not after. The best time:

| Moment | What to Test |
|--------|-------------|
| After building a utility function | Unit test it immediately |
| After building an API endpoint | Integration test with sample requests |
| After connecting frontend to backend | Component test with mocked API |
| After the whole feature works | One E2E test for the happy path |

### What to Test per Feature

For each feature, cover these four categories:

1. **Happy path** — Everything works as expected
2. **Sad path** — What if the user enters bad data?
3. **Edge cases** — Empty inputs, very long strings, special characters, concurrent actions
4. **Authorization** — Can only the right people do this action?

**Example for "User Registration":**

```
Happy path:  User signs up with valid email/password -> account created, redirects to dashboard
Sad path:    User signs up with invalid email -> "Invalid email" error shown
Sad path:    User signs up with existing email -> "Email already taken" error
Sad path:    User signs up with short password -> "Password too short" error
Edge case:   Request sent with empty body -> 400 response, no crash
Auth:        Signed-in user visits /signup -> redirected to dashboard
```

### Minimum Test Coverage per Feature

| Feature Type | Minimum Tests |
|-------------|---------------|
| Utility function | 3+ unit tests (happy, sad, edge) |
| API endpoint | 4+ tests (happy, validation, auth, not-found) |
| UI component | 2+ tests (renders correctly, handles interaction) |
| Full page/flow | 1+ integration test (happy path end-to-end) |

### Test File Naming

Keep test files next to the code they test:

```
src/
  utils/
    formatDate.ts
    formatDate.test.ts      <-- right next to it
  components/
    LoginForm.tsx
    LoginForm.test.tsx       <-- right next to it
  app/
    api/
      users/
        route.ts
        route.test.ts        <-- right next to it
```

---

## 6. Version Control per Feature

Each feature should live on its own branch until it is tested and ready to integrate.

### Branch Workflow

```
main (stable, deployable)
  └── feature/user-registration
  └── feature/user-profile
  └── feature/create-posts
```

### Per-Feature Git Flow

```bash
# 1. Start from the latest main (or development branch)
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/user-registration

# 3. Build the feature (multiple commits are fine)
git add src/app/api/users/route.ts
git commit -m "Add user registration API endpoint"

git add src/components/SignupForm.tsx
git commit -m "Add signup form component"

git add src/app/api/users/route.test.ts src/components/SignupForm.test.tsx
git commit -m "Add tests for user registration"

# 4. Verify everything passes
npm run build
npm test

# 5. Push and open a pull request
git push -u origin feature/user-registration
```

### Commit Message Style

Use short, descriptive messages that explain *what* was done:

```
GOOD:
  "Add user registration API with email validation"
  "Fix password hashing to use bcrypt instead of md5"
  "Add loading spinner to signup form"

BAD:
  "wip"
  "stuff"
  "fix"
  "update files"
```

---

## 7. Integrating Features Together

After building a feature in isolation, connect it to the rest of the app.

### Integration Checklist

Copy this for each integration:

```
INTEGRATION CHECKLIST — [Feature Name]
- [ ] Data flow: frontend -> API -> database -> API -> frontend works
- [ ] Navigation: users can reach the feature (links, buttons, routes)
- [ ] State updates: changes in this feature reflect in other parts of the app
- [ ] Error boundaries: if this feature fails, the rest of the app still works
- [ ] Loading states: spinner or skeleton shown while data loads
- [ ] Auth check: feature correctly verifies the user is logged in (if needed)
- [ ] Build passes: npm run build succeeds with the feature integrated
- [ ] No regressions: existing tests still pass
```

### Common Integration Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| "It works on my machine!" | Environment differences | Use .env files properly, document required variables |
| Data shows as `undefined` | API response shape mismatch | Check that types match between frontend and backend |
| Everything loads forever | API endpoint URL is wrong | Check the URL, port, and that the server is running |
| "Not authorized" errors | Token not being sent with requests | Check auth middleware and request headers |
| Data updates but UI doesn't | Frontend state not refreshing | Invalidate React Query cache or refetch data |
| Build passes but page crashes | Runtime error not caught by TypeScript | Check browser console, add error boundaries |

### Integration Test

After connecting a feature, run one integration test that exercises the full flow:

```typescript
test('user registration full flow', async () => {
  // 1. Render the signup page
  // 2. Fill in the form
  // 3. Submit
  // 4. Verify API was called with correct data
  // 5. Verify redirect to dashboard
  // 6. Verify welcome message appears
});
```

---

## 8. Rolling Back a Broken Feature

Sometimes a feature breaks things after integration. Here is what to do.

### Diagnose First

Before reverting, understand the problem:

1. **Read the error message carefully** — It usually tells you exactly what is wrong
2. **Check what changed** — `git diff main` shows all differences
3. **Isolate the failure** — Is it the new feature or an interaction with existing code?

### Revert Options (Least to Most Destructive)

| Option | When to Use | Command |
|--------|------------|---------|
| **Fix forward** | The bug is small and obvious | Just fix it and commit |
| **Revert the merge commit** | Feature merged but broke something | `git revert <merge-commit>` |
| **Cherry-pick good parts** | Some commits are fine, others broke things | `git cherry-pick <good-commit>` |
| **Reset branch** | Nothing from the feature is salvageable | `git reset --hard <last-good-commit>` (destructive, use with caution) |

### Prevention

The best rollback is the one you never need:

- Run `npm run build` before every commit
- Run tests before pushing
- Use feature branches so `main` stays stable
- Review the integration checklist from Section 7

---

## 9. Mapping to SparkForge's Stage System

SparkForge uses a stage-based build plan (see CLAUDE.md, Section 4). Each stage maps to one or more iterations of the Build-Test-Integrate cycle.

### How Stages Map to the Cycle

| Stage | Cycle Mapping |
|-------|--------------|
| Stage 1 (Foundation) | **PICK**: config, types, stores. **BUILD**: files per stage doc. **TEST**: `npm run build` passes. **INTEGRATE**: N/A (nothing to integrate with yet). |
| Stage 2 (Database/API) | **PICK**: schema, then API routes by resource. **BUILD**: SQL + route files. **TEST**: API responds correctly. **INTEGRATE**: routes connect to Supabase. |
| Stage 3 (Auth/Layout) | **PICK**: auth flow, then layout shell, then station frame. **BUILD**: per part. **TEST**: signup/login works, layout renders. **INTEGRATE**: auth wraps layout, layout wraps pages. |
| Stage 4-5 (Pages/Gamification) | **PICK**: one page or system at a time. **BUILD**: per part. **TEST**: page renders, hooks return data. **INTEGRATE**: pages accessible via navigation. |
| Stage 6-7 (Games) | **PICK**: one game at a time. **BUILD**: all phases (welcome/learn/play/complete). **TEST**: game is playable, XP awarded. **INTEGRATE**: game appears in registry and arcade. |
| Stage 8-10 (Polish) | **PICK**: one system (payments, content agent, a11y). **BUILD/TEST/INTEGRATE**: per part as usual. |

### Stage-Level Validation

At the end of each stage, SparkForge has a **Visual Checkpoint** (HARD STOP HS-5) where the human reviews the running app. This is the "integration test" for the entire stage — it confirms that all the features built in that stage work together visually and functionally.

---

## 10. Learning File Template

When building each feature, create a learning file alongside the code to document decisions and context.

```markdown
# Learning File: [Feature Name]

## What We Built
[Plain-English description of the feature]

## Why This Feature Exists
[What problem does it solve for the user?]

## Architecture (How the Pieces Fit)

[Diagram or description of how data flows through this feature]

Example:
User clicks "Sign Up"
  -> Frontend sends email/password to POST /api/users
  -> API validates input with Zod schema
  -> API checks if email exists in database
  -> API hashes password with bcrypt
  -> API inserts user row into database
  -> API returns 201 with user object (no password)
  -> Frontend shows "Welcome!" and redirects to /dashboard

## New Concepts

| Concept | Explanation | Analogy |
|---------|------------|---------|
| [term]  | [what it is and why it matters] | [real-world comparison] |

## Key Files

| File | Purpose |
|------|---------|
| [path] | [what this file does in the feature] |

## Tests Written

| Test | What It Checks |
|------|---------------|
| [test name] | [what this test proves] |

## Dependencies

- **This feature depends on:** [list features/systems that must exist first]
- **These features depend on this:** [list features that will build on top of this]

## Pitfalls and Gotchas
[Common bugs or mistakes encountered while building this feature]

## Next Feature
[The next feature to build and why it comes after this one]
```

**Where to store learning files:** `docs/learning/` directory, named after the feature: `docs/learning/user-registration.md`
