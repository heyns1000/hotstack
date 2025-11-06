# 🔐 Database Setup Instructions

This guide will help you set up Cloudflare D1 database for user authentication in HotStack.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler` or use the local version)
- Authenticated with Cloudflare (`wrangler login`)

## Step 1: Create D1 Database

Run the following command to create a new D1 database:

```bash
wrangler d1 create hotstack-db
```

This will output something like:

```
✅ Successfully created DB 'hotstack-db'

[[d1_databases]]
binding = "DB"
database_name = "hotstack-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important:** Copy the `database_id` value - you'll need it in the next step.

## Step 2: Update wrangler.toml

Open `wrangler.toml` and update the `database_id` in the D1 database binding:

```toml
[[d1_databases]]
binding = "DB"
database_name = "hotstack-db"
database_id = "YOUR_DATABASE_ID"  # Replace with your actual database ID
```

## Step 3: Initialize Database Schema

Run the schema file to create the necessary tables:

```bash
wrangler d1 execute hotstack-db --file=./schema.sql
```

This will create the following tables:
- `users` - User accounts
- `sessions` - Authentication sessions
- `user_preferences` - User settings
- `audit_logs` - Activity tracking

You should see output like:

```
🌀 Executing on hotstack-db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 Executed 20 commands in 0.05ms
```

## Step 4: Verify Database Setup

You can verify the tables were created by listing them:

```bash
wrangler d1 execute hotstack-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see:
- users
- sessions
- user_preferences
- audit_logs

## Step 5: Test Locally

Start the development server:

```bash
npm run dev
```

The authentication API will be available at:
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/me` - Get current user info

## Step 6: Deploy to Production

When you're ready to deploy:

```bash
npm run deploy
```

## Testing Authentication Endpoints

### Sign Up

```bash
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "johndoe"
  }'
```

### Sign In

```bash
curl -X POST http://localhost:8787/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_ID"
```

### Sign Out

```bash
curl -X POST http://localhost:8787/api/auth/signout \
  -H "Authorization: Bearer YOUR_SESSION_ID"
```

## Using the Client Library

Include the auth client in your HTML:

```html
<script src="/js/auth.js"></script>
```

Then use it in your JavaScript:

```javascript
// Sign up
try {
  const result = await auth.signup('user@example.com', 'password123', 'username');
  console.log('User created:', result.user);
} catch (error) {
  console.error('Signup failed:', error.message);
}

// Sign in
try {
  const result = await auth.signin('user@example.com', 'password123');
  console.log('Signed in:', result.user);
} catch (error) {
  console.error('Signin failed:', error.message);
}

// Get current user
try {
  const user = await auth.getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Not authenticated');
}

// Sign out
try {
  await auth.signout();
  console.log('Signed out successfully');
} catch (error) {
  console.error('Signout failed:', error.message);
}

// Check if authenticated
if (auth.isAuthenticated()) {
  console.log('User is authenticated');
}
```

## Database Management

### View Data

```bash
# List all users
wrangler d1 execute hotstack-db --command "SELECT id, email, username, created_at FROM users"

# List active sessions
wrangler d1 execute hotstack-db --command "SELECT id, user_id, expires_at FROM sessions"

# View audit logs
wrangler d1 execute hotstack-db --command "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10"
```

### Clean Up Expired Sessions

```bash
wrangler d1 execute hotstack-db --command "DELETE FROM sessions WHERE expires_at < datetime('now')"
```

### Delete a User

```bash
wrangler d1 execute hotstack-db --command "DELETE FROM users WHERE email='user@example.com'"
```

## Remote Database

To execute commands on your production database (deployed to Cloudflare), add the `--remote` flag:

```bash
# Initialize remote database
wrangler d1 execute hotstack-db --remote --file=./schema.sql

# Query remote database
wrangler d1 execute hotstack-db --remote --command "SELECT COUNT(*) as user_count FROM users"
```

## Security Best Practices

1. **Password Requirements**: Minimum 8 characters (enforced in code)
2. **Session Expiration**: Sessions expire after 7 days
3. **Password Hashing**: Uses bcrypt with 10 rounds
4. **HttpOnly Cookies**: Session cookies are HttpOnly and Secure
5. **Audit Logging**: All authentication events are logged
6. **CORS Headers**: Configured for security

## Troubleshooting

### Database not found

If you get "Database not found" error:
1. Make sure you created the database: `wrangler d1 create hotstack-db`
2. Verify the database_id in `wrangler.toml` is correct
3. Check you're authenticated: `wrangler whoami`

### Schema errors

If schema initialization fails:
1. Delete and recreate the database: `wrangler d1 delete hotstack-db`
2. Create a new database: `wrangler d1 create hotstack-db`
3. Run the schema again: `wrangler d1 execute hotstack-db --file=./schema.sql`

### Local development issues

For local development, Wrangler creates a local SQLite database in `.wrangler/state/v3/d1/`. This is separate from your production database.

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Authentication Patterns](https://developers.cloudflare.com/workers/examples/)

---

**Need help?** Open an issue on GitHub or check the Cloudflare Community forums.
