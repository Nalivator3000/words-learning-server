# 🔐 Google OAuth 2.0 Implementation Plan

**Цель:** Добавить авторизацию через Google для LexyBooster
**Приоритет:** HIGH
**Статус:** Planning

---

## 📋 Этапы реализации

### 1️⃣ Подготовка (Setup)

#### 1.1 Google Cloud Console
- [ ] Создать проект в Google Cloud Console
- [ ] Включить Google+ API
- [ ] Создать OAuth 2.0 credentials
- [ ] Настроить OAuth consent screen
- [ ] Добавить authorized redirect URIs:
  - `http://localhost:3000/auth/google/callback` (dev)
  - `https://words-learning-server-production.up.railway.app/auth/google/callback` (prod)
- [ ] Получить Client ID и Client Secret

#### 1.2 Environment Variables
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

#### 1.3 Dependencies
```bash
npm install passport passport-google-oauth20 express-session
```

---

### 2️⃣ Backend Implementation

#### 2.1 Passport.js Setup
Файл: `auth/passport-config.js`
```javascript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    // Find or create user in database
    // profile.id = Google user ID
    // profile.emails[0].value = user email
    // profile.displayName = user name
    // profile.photos[0].value = profile picture
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  // Fetch user from database
});
```

#### 2.2 Auth Routes
Файл: `routes/auth.js`
```javascript
// GET /auth/google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /auth/google/callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/');
  }
);

// GET /auth/logout
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// GET /api/auth/user (check auth status)
app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});
```

#### 2.3 Database Schema
Добавить в таблицу `users`:
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
```

#### 2.4 User Model Updates
```javascript
async findOrCreateGoogleUser(profile) {
  let user = await db.query(
    'SELECT * FROM users WHERE google_id = $1',
    [profile.id]
  );

  if (user.rows.length === 0) {
    // Create new user
    user = await db.query(
      `INSERT INTO users (google_id, username, email, auth_provider, profile_picture_url)
       VALUES ($1, $2, $3, 'google', $4)
       RETURNING *`,
      [profile.id, profile.displayName, profile.emails[0].value, profile.photos[0].value]
    );
  }

  return user.rows[0];
}
```

---

### 3️⃣ Frontend Implementation

#### 3.1 Login Button
Файл: `public/index.html`
```html
<div class="auth-modal">
  <h2 data-i18n="login">Login</h2>

  <!-- Existing email/password form -->
  <div class="auth-form">
    <input type="email" id="loginEmail" placeholder="Email">
    <input type="password" id="loginPassword" placeholder="Password">
    <button id="loginBtn">Login</button>
  </div>

  <!-- OAuth divider -->
  <div class="auth-divider">
    <span data-i18n="or">or</span>
  </div>

  <!-- Google OAuth button -->
  <button class="google-login-btn" onclick="loginWithGoogle()">
    <img src="/icons/google-icon.svg" alt="Google">
    <span data-i18n="login_with_google">Continue with Google</span>
  </button>
</div>
```

#### 3.2 JavaScript
Файл: `public/auth.js`
```javascript
function loginWithGoogle() {
  window.location.href = '/auth/google';
}

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/user');
    if (response.ok) {
      const { user } = await response.json();
      handleAuthenticatedUser(user);
    } else {
      handleUnauthenticatedUser();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

// Call on page load
window.addEventListener('DOMContentLoaded', checkAuthStatus);
```

#### 3.3 Styling
Файл: `public/style.css`
```css
.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: white;
  border: 2px solid #dadce0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  transition: all 0.2s;
}

.google-login-btn:hover {
  background: #f8f9fa;
  border-color: #c6c8cc;
}

.google-login-btn img {
  width: 24px;
  height: 24px;
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #5f6368;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #dadce0;
}

.auth-divider span {
  padding: 0 16px;
  font-size: 14px;
}
```

---

### 4️⃣ Session Management

#### 4.1 Express Session
```javascript
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());
```

#### 4.2 Session Store (Optional - PostgreSQL)
```bash
npm install connect-pg-simple
```

```javascript
import pgSession from 'connect-pg-simple';
const PgSession = pgSession(session);

app.use(session({
  store: new PgSession({
    pool: db.pool,
    tableName: 'session'
  }),
  // ... other options
}));
```

---

### 5️⃣ Security Considerations

#### 5.1 CSRF Protection
```bash
npm install csurf
```

```javascript
import csrf from 'csurf';
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);
```

#### 5.2 Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.use('/auth/*', authLimiter);
```

#### 5.3 Environment Security
- ✅ Никогда не коммитить .env файлы
- ✅ Использовать Railway environment variables
- ✅ Ротация secrets регулярно

---

### 6️⃣ Translation Keys

Добавить в `translations/source-texts.json`:
```json
{
  "login_with_google": {
    "source": "Continue with Google",
    "en": "Continue with Google",
    "ru": "Войти через Google",
    "de": "Mit Google fortfahren",
    "es": "Continuar con Google",
    "fr": "Continuer avec Google",
    "it": "Continua con Google"
  },
  "or": {
    "source": "or",
    "en": "or",
    "ru": "или",
    "de": "oder",
    "es": "o",
    "fr": "ou",
    "it": "o"
  }
}
```

---

### 7️⃣ Testing

#### 7.1 Local Testing
1. Start server: `npm start`
2. Navigate to `http://localhost:3000`
3. Click "Continue with Google"
4. Complete OAuth flow
5. Verify user created in database
6. Verify session persists

#### 7.2 Production Testing
1. Deploy to Railway
2. Verify redirect URIs in Google Console
3. Test OAuth flow on production URL
4. Check Railway logs for errors

---

### 8️⃣ Migration Strategy

#### Existing Users
```javascript
// Allow linking Google account to existing email/password account
async linkGoogleAccount(userId, googleId) {
  await db.query(
    'UPDATE users SET google_id = $1 WHERE id = $2',
    [googleId, userId]
  );
}
```

#### UI for Account Linking
```html
<!-- In settings page -->
<div class="account-linking">
  <h3 data-i18n="connected_accounts">Connected Accounts</h3>
  <button onclick="linkGoogleAccount()">
    <span data-i18n="link_google_account">Link Google Account</span>
  </button>
</div>
```

---

### 9️⃣ Error Handling

```javascript
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    res.redirect('/?login=success');
  }
);

// Frontend error display
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('error') === 'oauth_failed') {
  showToast('error', i18n.t('oauth_login_failed'));
}
if (urlParams.get('login') === 'success') {
  showToast('success', i18n.t('login_successful'));
}
```

---

### 🔟 Monitoring & Analytics

#### Track OAuth Events
```javascript
// Log OAuth logins
await db.query(
  `INSERT INTO user_activity_log (user_id, action, metadata)
   VALUES ($1, 'oauth_login', $2)`,
  [user.id, JSON.stringify({ provider: 'google', timestamp: new Date() })]
);
```

#### Metrics to Track
- OAuth login attempts
- OAuth login success rate
- Time to complete OAuth flow
- New users via OAuth vs email/password
- OAuth errors and failures

---

## ✅ Checklist

### Backend
- [ ] Install dependencies (passport, passport-google-oauth20, express-session)
- [ ] Set up Passport.js with Google Strategy
- [ ] Create auth routes (/auth/google, /auth/google/callback)
- [ ] Update database schema (google_id, auth_provider, profile_picture_url)
- [ ] Implement findOrCreateGoogleUser function
- [ ] Set up express-session
- [ ] Add CSRF protection
- [ ] Add rate limiting
- [ ] Test locally

### Frontend
- [ ] Add Google login button to auth modal
- [ ] Add OAuth divider styling
- [ ] Add Google icon asset
- [ ] Implement loginWithGoogle() function
- [ ] Implement checkAuthStatus() function
- [ ] Add error handling for OAuth failures
- [ ] Add translation keys
- [ ] Test UI flow

### Google Cloud Console
- [ ] Create project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Configure OAuth consent screen
- [ ] Add authorized redirect URIs (local + prod)
- [ ] Copy Client ID and Secret to .env

### Deployment
- [ ] Add environment variables to Railway
- [ ] Deploy to production
- [ ] Test OAuth flow on production URL
- [ ] Monitor logs for errors
- [ ] Update documentation

---

## 📚 Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

---

## 🎯 Success Criteria

- ✅ Users can log in with Google account
- ✅ User data syncs to database
- ✅ Sessions persist across page reloads
- ✅ Works on both local and production
- ✅ Error handling for OAuth failures
- ✅ Secure (HTTPS, CSRF protection, rate limiting)
- ✅ Mobile-friendly UI
- ✅ Translated to all 6 languages

---

**Estimated time:** 4-6 hours
**Complexity:** Medium
**Risk level:** Low (well-documented pattern)
