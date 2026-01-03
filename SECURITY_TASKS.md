# Security Improvement Tasks

This document provides an actionable task list for addressing the security issues identified in the security assessment. Tasks are organized by priority and include implementation details.

---

## Critical Priority Tasks

### Task 1: Fix CORS Configuration
**Issue ID:** #1  
**Severity:** Critical  
**Effort:** 1-2 hours  
**Files:** `crates/remote/src/routes/mod.rs`

**Description:**
Replace overly permissive CORS configuration that mirrors all origins with a whitelist of allowed origins.

**Implementation Steps:**
1. Create environment variable `ALLOWED_ORIGINS` for configuration
2. Parse allowed origins from config
3. Update CORS layer to use specific origins
4. Add validation for origin format
5. Test with both allowed and disallowed origins

**Code Changes:**
```rust
// In crates/remote/src/config.rs
#[derive(Debug, Clone)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
}

impl CorsConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let origins_str = env::var("ALLOWED_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());
        
        let allowed_origins: Vec<String> = origins_str
            .split(',')
            .map(|s| s.trim().to_string())
            .collect();
        
        Ok(Self { allowed_origins })
    }
}

// In crates/remote/src/routes/mod.rs
use tower_http::cors::AllowOrigin;

let cors_origins: Vec<HeaderValue> = state.cors_config().allowed_origins
    .iter()
    .filter_map(|origin| origin.parse().ok())
    .collect();

let cors_layer = CorsLayer::new()
    .allow_origin(AllowOrigin::list(cors_origins))
    .allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::DELETE,
        Method::PATCH,
    ])
    .allow_headers([
        header::AUTHORIZATION,
        header::CONTENT_TYPE,
        header::ACCEPT,
    ])
    .allow_credentials(true);
```

**Testing:**
```bash
# Test allowed origin
curl -H "Origin: https://app.taskcopilot.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8081/v1/health

# Test disallowed origin (should fail)
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8081/v1/health
```

**Acceptance Criteria:**
- [ ] Only whitelisted origins can make requests
- [ ] CORS preflight requests work correctly
- [ ] Credentials work with allowed origins
- [ ] Documentation updated with CORS configuration

---

### Task 2: Implement Security Headers
**Issue ID:** #2  
**Severity:** Critical  
**Effort:** 2-3 hours  
**Files:** `crates/remote/src/routes/mod.rs`, `crates/server/src/lib.rs`

**Description:**
Add comprehensive security headers to all HTTP responses to protect against common web vulnerabilities.

**Implementation Steps:**
1. Add tower-http middleware for security headers
2. Configure headers for both remote and local server
3. Create environment-specific CSP policies
4. Test with browser security tools

**Code Changes:**
```rust
// Add to Cargo.toml
tower-http = { version = "0.5", features = ["set-header"] }

// Create new file: crates/remote/src/middleware/security_headers.rs
use axum::http::{header, HeaderValue};
use tower_http::set_header::SetResponseHeaderLayer;

pub fn security_headers_layers() -> Vec<SetResponseHeaderLayer<HeaderValue>> {
    vec![
        // Prevent clickjacking
        SetResponseHeaderLayer::overriding(
            header::X_FRAME_OPTIONS,
            HeaderValue::from_static("DENY"),
        ),
        // Prevent MIME sniffing
        SetResponseHeaderLayer::overriding(
            header::X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ),
        // Force HTTPS
        SetResponseHeaderLayer::overriding(
            header::STRICT_TRANSPORT_SECURITY,
            HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
        ),
        // CSP
        SetResponseHeaderLayer::overriding(
            header::CONTENT_SECURITY_POLICY,
            HeaderValue::from_static(
                "default-src 'self'; \
                 script-src 'self' 'unsafe-inline' 'unsafe-eval'; \
                 style-src 'self' 'unsafe-inline'; \
                 img-src 'self' data: https:; \
                 font-src 'self' data:; \
                 connect-src 'self'; \
                 frame-ancestors 'none';"
            ),
        ),
        // XSS Protection (legacy but doesn't hurt)
        SetResponseHeaderLayer::overriding(
            HeaderValue::from_static("x-xss-protection"),
            HeaderValue::from_static("1; mode=block"),
        ),
        // Referrer policy
        SetResponseHeaderLayer::overriding(
            header::REFERRER_POLICY,
            HeaderValue::from_static("strict-origin-when-cross-origin"),
        ),
    ]
}

// In routes/mod.rs
use crate::middleware::security_headers::security_headers_layers;

Router::new()
    .nest("/v1", v1_public)
    .nest("/v1", v1_protected)
    .fallback_service(spa)
    .layer(/* existing layers */)
    // Add security headers
    .layers(security_headers_layers())
```

**Testing:**
```bash
# Check headers
curl -I http://localhost:8081/

# Use online tools
# https://securityheaders.com
# https://observatory.mozilla.org
```

**Acceptance Criteria:**
- [ ] All 6 security headers present in responses
- [ ] Headers score A+ on securityheaders.com
- [ ] CSP doesn't block legitimate resources
- [ ] Application functions normally with headers

---

### Task 3: Strengthen JWT Secret Validation
**Issue ID:** #3  
**Severity:** Critical  
**Effort:** 1-2 hours  
**Files:** `crates/remote/src/config.rs`

**Description:**
Improve JWT secret validation to enforce stronger entropy requirements and prevent weak secrets.

**Implementation Steps:**
1. Increase minimum secret length requirement
2. Add entropy validation
3. Reject common patterns
4. Add generation helper in documentation

**Code Changes:**
```rust
// In crates/remote/src/config.rs

fn validate_jwt_secret(secret: &str) -> Result<(), ConfigError> {
    let decoded = BASE64_STANDARD
        .decode(secret.as_bytes())
        .map_err(|_| ConfigError::InvalidVar(
            "VIBEKANBAN_REMOTE_JWT_SECRET must be valid base64"
        ))?;

    // Require at least 64 bytes (512 bits) for HS256/HS512
    const MIN_SECRET_LENGTH: usize = 64;
    if decoded.len() < MIN_SECRET_LENGTH {
        return Err(ConfigError::InvalidVar(
            "VIBEKANBAN_REMOTE_JWT_SECRET must be at least 64 bytes (512 bits)"
        ));
    }

    // Check entropy - reject overly simple patterns
    let unique_bytes: std::collections::HashSet<_> = decoded.iter().collect();
    if unique_bytes.len() < decoded.len() / 4 {
        return Err(ConfigError::InvalidVar(
            "VIBEKANBAN_REMOTE_JWT_SECRET has insufficient entropy"
        ));
    }

    // Check for repeated patterns
    if has_repeated_pattern(&decoded) {
        return Err(ConfigError::InvalidVar(
            "VIBEKANBAN_REMOTE_JWT_SECRET contains repeated patterns"
        ));
    }

    Ok(())
}

fn has_repeated_pattern(bytes: &[u8]) -> bool {
    // Check for 4-byte pattern repetition
    if bytes.len() >= 16 {
        let pattern = &bytes[0..4];
        let mut count = 0;
        for chunk in bytes.chunks(4) {
            if chunk == pattern {
                count += 1;
                if count > 2 {
                    return true;
                }
            }
        }
    }
    false
}
```

**Documentation Update:**
Add to README or deployment guide:
```bash
# Generate a strong JWT secret
openssl rand -base64 64
```

**Testing:**
```rust
#[test]
fn test_jwt_secret_validation() {
    // Too short
    assert!(validate_jwt_secret(&base64::encode(&[0u8; 31])).is_err());
    
    // Low entropy
    assert!(validate_jwt_secret(&base64::encode(&[42u8; 64])).is_err());
    
    // Valid
    let random_bytes: Vec<u8> = (0..64).map(|_| rand::random()).collect();
    assert!(validate_jwt_secret(&base64::encode(&random_bytes)).is_ok());
}
```

**Acceptance Criteria:**
- [ ] Secrets under 64 bytes rejected
- [ ] Low entropy secrets rejected
- [ ] Pattern-based secrets rejected
- [ ] Documentation includes generation command
- [ ] Tests pass

---

### Task 4: Implement Global Rate Limiting
**Issue ID:** #4  
**Severity:** High  
**Effort:** 4-6 hours  
**Files:** Multiple

**Description:**
Add comprehensive rate limiting to prevent abuse, brute force attacks, and DoS.

**Implementation Steps:**
1. Add tower-governor dependency
2. Create rate limiting configuration
3. Apply global rate limits
4. Add stricter limits for sensitive endpoints
5. Implement custom rate limit responses

**Code Changes:**
```toml
# Add to Cargo.toml
tower-governor = "0.4"
```

```rust
// Create crates/remote/src/middleware/rate_limit.rs
use governor::{Quota, RateLimiter};
use std::num::NonZeroU32;
use tower_governor::{
    governor::GovernorConfigBuilder,
    key_extractor::KeyExtractor,
    GovernorLayer,
};

pub struct IpKeyExtractor;

impl KeyExtractor for IpKeyExtractor {
    type Key = IpAddr;

    fn extract<T>(&self, req: &axum::http::Request<T>) -> Result<Self::Key, GovernorError> {
        req.extensions()
            .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
            .map(|ci| ci.0.ip())
            .ok_or(GovernorError::UnableToExtractKey)
    }
}

// Global rate limiter: 100 requests per minute
pub fn global_rate_limiter() -> GovernorLayer<IpKeyExtractor> {
    let config = Box::new(
        GovernorConfigBuilder::default()
            .per_second(100)
            .burst_size(120)
            .key_extractor(IpKeyExtractor)
            .finish()
            .unwrap(),
    );
    GovernorLayer {
        config: Box::leak(config),
    }
}

// Auth rate limiter: 5 requests per minute
pub fn auth_rate_limiter() -> GovernorLayer<IpKeyExtractor> {
    let config = Box::new(
        GovernorConfigBuilder::default()
            .per_minute(5)
            .burst_size(7)
            .key_extractor(IpKeyExtractor)
            .finish()
            .unwrap(),
    );
    GovernorLayer {
        config: Box::leak(config),
    }
}

// In routes/mod.rs
let v1_public = Router::<AppState>::new()
    .route("/health", get(health))
    .merge(oauth::public_router().layer(auth_rate_limiter()))
    .merge(tokens::public_router().layer(auth_rate_limiter()))
    // ... other routes
    .layer(global_rate_limiter());
```

**Testing:**
```bash
# Test rate limiting
for i in {1..150}; do
  curl -w "%{http_code}\n" http://localhost:8081/v1/health
done
# Should see 429 responses after ~100 requests
```

**Acceptance Criteria:**
- [ ] Global rate limit applied to all endpoints
- [ ] Auth endpoints have stricter limits
- [ ] Rate limit headers included (X-RateLimit-*)
- [ ] 429 response includes retry-after header
- [ ] Rate limits configurable via environment

---

## High Priority Tasks

### Task 5: Add File Upload Size Limits
**Issue ID:** #6  
**Severity:** High  
**Effort:** 2-3 hours  
**Files:** `crates/server/src/routes/images.rs`

**Description:**
Implement strict file size limits and MIME type validation for image uploads.

**Implementation Steps:**
1. Add DefaultBodyLimit middleware
2. Implement content-type validation
3. Use magic number detection for file type verification
4. Add size validation in upload handler

**Code Changes:**
```toml
# Add to Cargo.toml
infer = "0.15"
```

```rust
// In crates/server/src/routes/images.rs
use axum::extract::DefaultBodyLimit;
use infer;

const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_UPLOAD_SIZE: usize = 50 * 1024 * 1024; // 50MB for multipart
const ALLOWED_MIME_TYPES: &[&str] = &[
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
];

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route("/images/upload", post(upload_image)
            .layer(DefaultBodyLimit::max(MAX_TOTAL_UPLOAD_SIZE))
        )
        .route("/images/task/:task_id", post(upload_image_for_task)
            .layer(DefaultBodyLimit::max(MAX_TOTAL_UPLOAD_SIZE))
        )
        // ... other routes
}

pub(crate) async fn process_image_upload(
    deployment: &DeploymentImpl,
    mut multipart: Multipart,
    link_task_id: Option<Uuid>,
) -> Result<ImageResponse, ApiError> {
    let image_service = deployment.image();

    while let Some(field) = multipart.next_field().await? {
        if field.name() == Some("image") {
            let filename = field
                .file_name()
                .map(|s| s.to_string())
                .unwrap_or_else(|| "image.png".to_string());

            // Validate filename for path traversal
            if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
                return Err(ApiError::InvalidInput("Invalid filename".to_string()));
            }

            let data = field.bytes().await?;
            
            // Validate size
            if data.len() > MAX_IMAGE_SIZE {
                return Err(ApiError::PayloadTooLarge {
                    max_size: MAX_IMAGE_SIZE,
                    actual_size: data.len(),
                });
            }

            // Validate MIME type using magic numbers
            let kind = infer::get(&data)
                .ok_or(ApiError::InvalidInput("Unable to determine file type".to_string()))?;

            if !ALLOWED_MIME_TYPES.contains(&kind.mime_type()) {
                return Err(ApiError::InvalidInput(
                    format!("Unsupported file type: {}. Allowed types: {:?}", 
                        kind.mime_type(), ALLOWED_MIME_TYPES)
                ));
            }

            let image = image_service.store_image(&data, &filename).await?;
            
            // ... rest of handler
        }
    }
    
    Err(ApiError::InvalidInput("No image field found".to_string()))
}
```

```rust
// Update error.rs
#[derive(Error, Debug)]
pub enum ApiError {
    // ... existing variants
    
    #[error("Payload too large: {actual_size} bytes (max: {max_size} bytes)")]
    PayloadTooLarge { max_size: usize, actual_size: usize },
}
```

**Testing:**
```bash
# Test with oversized file
dd if=/dev/zero of=large.jpg bs=1M count=20
curl -F "image=@large.jpg" http://localhost:8080/images/upload
# Should return 413 or 400

# Test with valid file
curl -F "image=@valid.jpg" http://localhost:8080/images/upload
# Should succeed
```

**Acceptance Criteria:**
- [ ] Files over 10MB rejected
- [ ] Non-image files rejected
- [ ] MIME type validated by content, not extension
- [ ] Clear error messages
- [ ] Configuration documented

---

### Task 6: Configure Request Timeouts
**Issue ID:** #7  
**Severity:** High  
**Effort:** 1-2 hours  
**Files:** `crates/server/src/main.rs`, `crates/remote/src/app.rs`

**Description:**
Add global request timeout to prevent slowloris attacks and resource exhaustion.

**Implementation Steps:**
1. Add timeout middleware
2. Configure timeout duration
3. Exclude specific long-running endpoints
4. Add timeout error handling

**Code Changes:**
```rust
// In both crates/server/src/lib.rs and crates/remote/src/routes/mod.rs
use tower_http::timeout::TimeoutLayer;
use std::time::Duration;

pub fn router(state: AppState) -> Router {
    // ... existing router setup
    
    Router::<AppState>::new()
        .nest("/v1", v1_public)
        .nest("/v1", v1_protected)
        .fallback_service(spa)
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
        // ... other layers
}

// For WebSocket routes, exclude from timeout
let ws_routes = Router::new()
    .route("/ws/events", get(events_websocket))
    // No timeout layer here

// For long-running operations, use per-route timeout
.route("/v1/tasks/:id/execute",
    post(execute_task)
        .layer(TimeoutLayer::new(Duration::from_secs(600)))
)
```

**Testing:**
```bash
# Test timeout with slow response
curl --max-time 35 http://localhost:8081/v1/slow-endpoint
# Should timeout after 30 seconds
```

**Acceptance Criteria:**
- [ ] 30-second timeout on general endpoints
- [ ] WebSocket connections excluded
- [ ] Long-running operations have custom timeouts
- [ ] 408 Request Timeout returned correctly

---

### Task 7: Move Tokens Out of localStorage
**Issue ID:** #8  
**Severity:** High  
**Effort:** 4-6 hours  
**Files:** `remote-frontend/src/auth.ts`, backend token endpoints

**Description:**
Move authentication tokens from localStorage to httpOnly cookies for improved XSS protection.

**Implementation Steps:**
1. Update backend to set httpOnly cookies
2. Remove localStorage token storage
3. Update API client to use credentials: 'include'
4. Handle token refresh with cookies
5. Update logout to clear cookies

**Code Changes:**
```rust
// In crates/remote/src/routes/oauth.rs
use axum::http::{header, HeaderValue};
use cookie::{Cookie, SameSite};

// After generating tokens
let access_cookie = Cookie::build(("access_token", tokens.access_token))
    .path("/")
    .http_only(true)
    .secure(true) // Only over HTTPS
    .same_site(SameSite::Strict)
    .max_age(time::Duration::minutes(15))
    .build();

let refresh_cookie = Cookie::build(("refresh_token", tokens.refresh_token))
    .path("/v1/tokens/refresh") // Only sent to refresh endpoint
    .http_only(true)
    .secure(true)
    .same_site(SameSite::Strict)
    .max_age(time::Duration::days(365))
    .build();

let mut response = Response::new(Body::from(success_html));
response.headers_mut().insert(
    header::SET_COOKIE,
    HeaderValue::from_str(&access_cookie.to_string()).unwrap()
);
response.headers_mut().append(
    header::SET_COOKIE,
    HeaderValue::from_str(&refresh_cookie.to_string()).unwrap()
);
```

```typescript
// In remote-frontend/src/auth.ts
// Remove localStorage usage entirely

// In remote-frontend/src/api/client.ts
const client = axios.create({
    baseURL: '/v1',
    withCredentials: true, // Send cookies
});

// Token refresh now automatic via cookie
client.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            // Backend will automatically use refresh_token cookie
            const refreshResponse = await axios.post(
                '/v1/tokens/refresh',
                {},
                { withCredentials: true }
            );
            
            if (refreshResponse.status === 200) {
                // Retry original request
                return client.request(error.config);
            }
        }
        throw error;
    }
);
```

**Testing:**
```bash
# Check cookies are set
curl -v http://localhost:8081/v1/oauth/callback/...
# Should see Set-Cookie headers with HttpOnly flag

# Test that tokens aren't accessible via JavaScript
# Open browser console:
document.cookie
# Should not show access_token or refresh_token
```

**Acceptance Criteria:**
- [ ] Tokens stored in httpOnly cookies
- [ ] Cookies have Secure flag in production
- [ ] SameSite=Strict prevents CSRF
- [ ] JavaScript cannot access tokens
- [ ] Token refresh works automatically
- [ ] Logout clears cookies

---

## Medium Priority Tasks

### Task 8: Enhance Session Management
**Issue ID:** #9  
**Severity:** Medium  
**Effort:** 2-3 hours

**Description:**
Review and document session inactivity timeouts.

**Implementation:**
```rust
// In crates/remote/src/db/auth.rs
pub const MAX_SESSION_INACTIVITY_DURATION: Duration = Duration::days(30);
pub const SESSION_ABSOLUTE_TIMEOUT: Duration = Duration::days(90);

// Add to AuthSession
impl AuthSession {
    pub fn is_expired(&self, now: DateTime<Utc>) -> bool {
        // Check inactivity
        if self.inactivity_duration(now) > MAX_SESSION_INACTIVITY_DURATION {
            return true;
        }
        
        // Check absolute timeout
        let age = now - self.created_at;
        if age > SESSION_ABSOLUTE_TIMEOUT {
            return true;
        }
        
        false
    }
}
```

---

### Task 9: Add Input Validation
**Issue ID:** #10  
**Severity:** Medium  
**Effort:** 3-4 hours

**Description:**
Implement comprehensive input validation using the validator crate.

**Implementation:**
```toml
# Add to Cargo.toml
validator = { version = "0.18", features = ["derive"] }
```

```rust
use validator::{Validate, ValidationError};

#[derive(Validate, Deserialize)]
pub struct CreateUserInput {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    
    #[validate(length(min = 3, max = 50, message = "Username must be 3-50 characters"))]
    #[validate(regex(path = "USERNAME_REGEX", message = "Username contains invalid characters"))]
    pub username: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
}

lazy_static! {
    static ref USERNAME_REGEX: Regex = Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap();
}

// In handler
pub async fn create_user(
    State(state): State<AppState>,
    Json(input): Json<CreateUserInput>,
) -> Result<Response, ApiError> {
    input.validate()?; // Validate before processing
    // ... rest of handler
}
```

---

### Task 10: Secure Docker Credentials
**Issue ID:** #11  
**Severity:** Medium  
**Effort:** 1 hour

**Implementation:**
```yaml
# docker-compose.dev.yml
services:
  sentry-postgres:
    environment:
      POSTGRES_USER: ${SENTRY_DB_USER:-sentry}
      POSTGRES_PASSWORD: ${SENTRY_DB_PASSWORD:?SENTRY_DB_PASSWORD must be set}
      POSTGRES_DB: ${SENTRY_DB_NAME:-sentry}
```

**Documentation:**
```bash
# .env.example update
SENTRY_DB_PASSWORD=changeme-generate-strong-password
```

---

### Task 11: Add Audit Logging
**Issue ID:** #13  
**Severity:** Medium  
**Effort:** 6-8 hours

**Implementation:**
```rust
// Create crates/remote/src/audit.rs
#[derive(Debug, Serialize)]
pub struct AuditEvent {
    pub event_type: AuditEventType,
    pub user_id: Option<Uuid>,
    pub session_id: Option<Uuid>,
    pub ip_address: Option<IpAddr>,
    pub timestamp: DateTime<Utc>,
    pub details: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub enum AuditEventType {
    UserLogin,
    UserLogout,
    TokenRefresh,
    SessionRevoked,
    PermissionChanged,
    DataAccessed,
    DataModified,
}

pub async fn log_audit_event(pool: &PgPool, event: AuditEvent) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO audit_log (event_type, user_id, session_id, ip_address, timestamp, details)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
        serde_json::to_string(&event.event_type).unwrap(),
        event.user_id,
        event.session_id,
        event.ip_address.map(|ip| ip.to_string()),
        event.timestamp,
        event.details,
    )
    .execute(pool)
    .await?;
    
    Ok(())
}
```

**Migration:**
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID,
    session_id UUID,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
```

---

### Task 12: Implement CSRF Protection
**Issue ID:** #16  
**Severity:** Medium  
**Effort:** 3-4 hours

**Implementation:**
```rust
// Create crates/remote/src/middleware/csrf.rs
use axum::{
    extract::State,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use rand::{thread_rng, Rng};
use sha2::{Digest, Sha256};

pub async fn csrf_middleware(
    req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // Skip CSRF for safe methods
    if matches!(req.method(), &Method::GET | &Method::HEAD | &Method::OPTIONS) {
        return Ok(next.run(req).await);
    }
    
    // Verify CSRF token
    let token = req
        .headers()
        .get("X-CSRF-Token")
        .and_then(|v| v.to_str().ok());
    
    // Validate against session
    // ... implementation
    
    Ok(next.run(req).await)
}
```

---

## Low Priority Tasks

### Task 13: Add Dependency Scanning
**Issue ID:** #18  
**Severity:** Low  
**Effort:** 2 hours

**Implementation:**
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  cargo-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/audit-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
  
  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm audit
```

---

### Task 14: Create security.txt
**Issue ID:** #19  
**Severity:** Low  
**Effort:** 30 minutes

**Implementation:**
Create `frontend/public/.well-known/security.txt`:
```
Contact: security@taskcopilot.com
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://taskcopilot.com/.well-known/security.txt
Policy: https://taskcopilot.com/security-policy
```

---

## Testing Strategy

### Unit Tests
```bash
cargo test --workspace
pnpm test
```

### Integration Tests
```bash
# Test authentication flow
pytest tests/integration/test_auth.py

# Test rate limiting
pytest tests/integration/test_rate_limit.py

# Test file uploads
pytest tests/integration/test_uploads.py
```

### Security Tests
```bash
# OWASP ZAP scan
zap-cli quick-scan http://localhost:8081

# Dependency scanning
cargo audit
pnpm audit

# Container scanning
trivy image task-copilot:latest
```

---

## Documentation Updates

### Required Documentation
1. **Security Configuration Guide**
   - Environment variables
   - Secret generation
   - CORS configuration
   - Rate limiting tuning

2. **Deployment Security Checklist**
   - SSL/TLS configuration
   - Firewall rules
   - Secret rotation
   - Backup encryption

3. **Incident Response Plan**
   - Contact information
   - Escalation procedures
   - Recovery steps

---

## Success Metrics

- [ ] All critical issues resolved
- [ ] All high priority issues resolved  
- [ ] 80%+ medium priority issues resolved
- [ ] Security headers score A+ on securityheaders.com
- [ ] Zero high/critical vulnerabilities in dependencies
- [ ] Penetration test passed
- [ ] Documentation complete

---

## Timeline

- **Week 1:** Critical issues (#1-#3)
- **Week 2-3:** High priority issues (#4-#7)
- **Week 4-6:** Medium priority issues (#8-#12)
- **Week 7-8:** Low priority issues, testing, documentation

**Total Estimated Effort:** 40-55 hours
