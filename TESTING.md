# Testing Guide: Making Sure Everything Works

## Table of Contents
1. Why Testing Matters (Really)
2. Testing Pyramid
3. Setting Up Testing Tools
4. Writing Your First Tests
5. Testing the Backend (API Tests)
6. Testing the Frontend (Component Tests)
7. Integration & End-to-End Tests
8. Pre-Deployment Checklist
9. Security Testing Basics

---

## 1. Why Testing Matters (Really)

Imagine building a bridge. Would you let cars drive on it without testing if it can hold weight? Of course not.

Software testing is the same — it's how you know your app won't fall apart when real people use it. And real people will do things you never imagined: clicking buttons twice, entering emojis in phone number fields, refreshing in the middle of saving.

**Without tests:**
- You change one thing and accidentally break three other things
- You only find out when a user complains (or leaves)
- You're scared to change code because "what if something breaks?"

**With tests:**
- Change code confidently — tests catch regressions
- Find bugs before users do
- Document how features are supposed to work

---

## 2. Testing Pyramid

Think of testing like a pyramid:

```
         /\
        /  \
       / E2E \          ← Few (slow, expensive, but realistic)
      /--------\
     / Integra- \       ← Some (test pieces working together)
    /   tion     \
   /--------------\
  /    Unit Tests   \   ← Many (fast, cheap, test individual pieces)
 /--------------------\
```

**Unit tests** (base) — Lots of them. Fast. Test individual functions.
**Integration tests** (middle) — Moderate amount. Test components working together.
**E2E tests** (top) — Few. Slow. Test the entire app like a real user.

---

## 3. Setting Up Testing Tools

### For Next.js / React Projects (SparkForge Stack)

> **Note:** SparkForge uses Vitest (not Jest) per Enhancement 8.5. Vitest is Vite-native,
> faster, and has Jest-compatible APIs. All testing packages are installed in Stage 1 Part 1.

```bash
# Install testing dependencies (already done in Stage 1 Part 1, step 2j)
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test msw happy-dom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

### For Express / Node.js Backend

```bash
npm install -D jest supertest
```

### For Python / FastAPI

```bash
pip install pytest httpx pytest-asyncio
```

---

## 4. Writing Your First Tests

### Anatomy of a Test

Every test has three parts (called "Arrange-Act-Assert" or just "Setup-Do-Check"):

```typescript
test('adds two numbers correctly', () => {
  // ARRANGE: Set up what you need
  const a = 2;
  const b = 3;

  // ACT: Do the thing you're testing
  const result = add(a, b);

  // ASSERT: Check that it worked
  expect(result).toBe(5);
});
```

Think of it like a science experiment:
1. **Set up** the experiment (arrange)
2. **Run** the experiment (act)
3. **Check** the result matches what you expected (assert)

### Naming Tests

Name tests so they read like English sentences:

```typescript
// GOOD — reads clearly
test('user can sign up with valid email and password', ...)
test('shows error when email is already taken', ...)
test('redirects to dashboard after successful login', ...)

// BAD — vague and unhelpful
test('test1', ...)
test('signup works', ...)
test('error test', ...)
```

---

## 5. Testing the Backend (API Tests)

### What to Test

For each API endpoint, test:

| Test Type | Example |
|-----------|---------|
| **Happy path** | `POST /api/users` with valid data → 201 Created |
| **Validation** | `POST /api/users` with no email → 400 Bad Request |
| **Authentication** | `GET /api/profile` without token → 401 Unauthorized |
| **Authorization** | User A tries to edit User B's post → 403 Forbidden |
| **Not Found** | `GET /api/users/99999` → 404 Not Found |
| **Duplicates** | Creating a user with existing email → 409 Conflict |

### Example: Express API Test

```typescript
import request from 'supertest';
import app from '../src/app';

describe('POST /api/users', () => {
  test('creates a new user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'securePassword123'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.name).toBe('Test User');
    expect(response.body.user.email).toBe('test@example.com');
    // Password should NOT be in the response!
    expect(response.body.user.password).toBeUndefined();
  });

  test('returns 400 when email is missing', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test', password: 'pass123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('email');
  });
});
```

### Example: FastAPI Test

```python
from httpx import AsyncClient
from app.main import app
import pytest

@pytest.mark.asyncio
async def test_create_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/users", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "securePassword123"
        })

    assert response.status_code == 201
    assert response.json()["user"]["name"] == "Test User"
    assert "password" not in response.json()["user"]
```

---

## 6. Testing the Frontend (Component Tests)

### What to Test

| Test Type | Example |
|-----------|---------|
| **Renders correctly** | Button shows the right text |
| **User interactions** | Clicking "Submit" calls the right function |
| **Conditional display** | Error message appears when login fails |
| **Loading states** | Spinner shows while data is loading |
| **Form validation** | "Email is required" appears for empty field |

### Example: React Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  test('shows the login button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('shows error when submitting empty form', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  test('calls onSubmit with email and password', async () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@email.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@email.com',
      password: 'password123'
    });
  });
});
```

---

## 7. Integration & End-to-End Tests

### E2E with Playwright

```typescript
import { test, expect } from '@playwright/test';

test('user can sign up and reach dashboard', async ({ page }) => {
  // Go to the signup page
  await page.goto('/signup');

  // Fill in the form
  await page.fill('[name="email"]', 'newuser@test.com');
  await page.fill('[name="password"]', 'securePass123!');
  await page.fill('[name="name"]', 'New User');

  // Click sign up
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Should show welcome message
  await expect(page.locator('text=Welcome, New User')).toBeVisible();
});
```

---

## 8. Pre-Deployment Checklist

Run through this ENTIRE checklist before deploying:

### Functionality
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Manual walkthrough of every user flow
- [ ] Test on mobile screen sizes
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test with slow network (browser dev tools → Network → Slow 3G)

### Security
- [ ] All passwords are hashed (never stored in plain text)
- [ ] API keys and secrets are in .env (not in code)
- [ ] .env is in .gitignore
- [ ] All user inputs are validated on the backend
- [ ] SQL injection protection (use parameterized queries or ORM)
- [ ] XSS protection (sanitize user-generated content displayed in HTML)
- [ ] CORS is configured (only allow requests from your frontend domain)
- [ ] Rate limiting is enabled on sensitive endpoints (login, signup)
- [ ] HTTPS is required in production

### Performance
- [ ] Images are optimized (use Next.js Image component or compress manually)
- [ ] No unnecessary console.log statements left in
- [ ] Database queries are efficient (no N+1 queries)
- [ ] Loading states exist for all async operations

### Data
- [ ] Database is backed up
- [ ] Migrations run cleanly on a fresh database
- [ ] Seed data works (if applicable)
- [ ] .env.example is up to date

### Deployment
- [ ] Environment variables are set in hosting platform
- [ ] Build completes without errors
- [ ] Health check endpoint responds correctly
- [ ] Error monitoring is set up (optional but recommended)

---

## 9. Security Testing Basics

### The Big Five Security Checks

1. **Authentication** — Can someone access protected pages without logging in?
   - Try accessing `/dashboard` directly without a token
   - Try using an expired token
   - Try using a made-up token

2. **Authorization** — Can User A see/edit User B's data?
   - Log in as User A, try to access `/api/users/B/profile`
   - Try to edit someone else's post

3. **Input Validation** — What happens with weird input?
   - Enter `<script>alert('hacked')</script>` in text fields (XSS test)
   - Enter very long strings (buffer overflow test)
   - Send API requests with missing required fields

4. **Data Exposure** — Is sensitive data visible where it shouldn't be?
   - Check API responses don't include password hashes
   - Check the browser's network tab for leaked data
   - Make sure .env files aren't accessible via URL

5. **Rate Limiting** — Can someone spam your API?
   - Try sending 100 login requests per second
   - Ensure your API slows down or blocks excessive requests
