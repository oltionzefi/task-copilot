# Security Assessment Report
**Project:** Vibe Kanban / Task Copilot  
**Date:** 2026-01-03  
**Assessment Type:** Comprehensive Code Security Review

## Executive Summary

This security assessment identified **23 security findings** across multiple categories, ranging from critical to informational severity. The project demonstrates several strong security practices including JWT implementation with refresh token rotation, HMAC webhook verification, and SQL injection prevention via parameterized queries. However, there are notable areas requiring immediate attention, particularly around CORS configuration, rate limiting, and security headers.

### Key Findings Summary
- **Critical:** 3 issues
- **High:** 5 issues  
- **Medium:** 8 issues
- **Low:** 7 issues

---

## Critical Security Issues

### 1. **Overly Permissive CORS Configuration**
**Severity:** Critical  
**Location:** `crates/remote/src/routes/mod.rs:81-85`

**Issue:**
```rust
CorsLayer::new()
    .allow_origin(AllowOrigin::mirror_request())
    .allow_methods(AllowMethods::mirror_request())
    .allow_headers(AllowHeaders::mirror_request())
    .allow_credentials(true)
```

The CORS configuration uses `mirror_request()` for all settings while allowing credentials. This effectively allows any origin to make authenticated requests, defeating the purpose of CORS protection.

**Risk:** Complete CORS bypass, allowing malicious websites to make authenticated requests on behalf of users.

**Recommendation:**
```rust
CorsLayer::new()
    .allow_origin([
        "https://app.taskcopilot.com".parse().unwrap(),
        "http://localhost:3000".parse().unwrap(),
    ])
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::PATCH])
    .allow_headers([
        header::AUTHORIZATION,
        header::CONTENT_TYPE,
        header::ACCEPT,
    ])
    .allow_credentials(true)
```

---

### 2. **Missing Security Headers**
**Severity:** Critical  
**Location:** `crates/remote/src/routes/mod.rs`, `crates/server/src/main.rs`

**Issue:** No security headers are configured (X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Strict-Transport-Security, etc.)

**Risk:** 
- Clickjacking attacks
- MIME-type confusion attacks
- XSS vulnerabilities
- Man-in-the-middle attacks

**Recommendation:**
Add security headers middleware:
```rust
use tower_http::set_header::SetResponseHeaderLayer;

Router::new()
    .layer(SetResponseHeaderLayer::overriding(
        header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::STRICT_TRANSPORT_SECURITY,
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"),
    ))
```

---

### 3. **Insufficient JWT Secret Validation**
**Severity:** Critical  
**Location:** `crates/remote/src/config.rs:266-276`

**Issue:** JWT secret only requires 32 bytes minimum, with no entropy validation.

**Risk:** Weak secrets could be brute-forced, compromising all sessions.

**Recommendation:**
```rust
fn validate_jwt_secret(secret: &str) -> Result<(), ConfigError> {
    let decoded = BASE64_STANDARD
        .decode(secret.as_bytes())
        .map_err(|_| ConfigError::InvalidVar("VIBEKANBAN_REMOTE_JWT_SECRET"))?;

    // Require at least 64 bytes (512 bits) for HS256
    if decoded.len() < 64 {
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

    Ok(())
}
```

---

## High Severity Issues

### 4. **No Global Rate Limiting**
**Severity:** High  
**Location:** Multiple API endpoints

**Issue:** Only the review endpoint has rate limiting. Authentication endpoints and general API endpoints lack rate limiting protection.

**Risk:** 
- Brute force attacks on authentication
- API abuse and DoS
- Resource exhaustion

**Recommendation:**
Implement tower-governor for rate limiting:
```rust
use tower_governor::{GovernorConfigBuilder, GovernorLayer};

let governor_conf = Box::new(
    GovernorConfigBuilder::default()
        .per_second(10)
        .burst_size(20)
        .finish()
        .unwrap(),
);

Router::new()
    .layer(GovernorLayer {
        config: Box::leak(governor_conf),
    })
```

Add stricter limits for sensitive endpoints:
- `/v1/tokens/refresh`: 5 requests per minute
- `/v1/oauth/*`: 10 requests per minute  
- General API: 100 requests per minute

---

### 5. **Weak Access Token TTL**
**Severity:** High  
**Location:** `crates/remote/src/auth/jwt.rs:24`

**Issue:** 
```rust
pub const ACCESS_TOKEN_TTL_SECONDS: i64 = 120; // 2 minutes
```

While short-lived tokens are good, 2 minutes is potentially too short and may cause excessive refresh requests.

**Risk:** UX issues leading to developers extending the TTL too much, or excessive refresh token traffic.

**Recommendation:**
```rust
pub const ACCESS_TOKEN_TTL_SECONDS: i64 = 900; // 15 minutes
```
This balances security with usability. Combined with refresh token rotation, this provides adequate security.

---

### 6. **Missing File Upload Size Limits**
**Severity:** High  
**Location:** `crates/server/src/routes/images.rs`

**Issue:** No explicit file size limits for image uploads.

**Risk:** 
- Resource exhaustion
- DoS via large file uploads
- Storage abuse

**Recommendation:**
```rust
Router::new()
    .route("/images/upload", 
        post(upload_image)
            .layer(DefaultBodyLimit::max(10 * 1024 * 1024)) // 10MB limit
    )
```

Also add validation:
```rust
const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: &[&str] = &[
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
];

if data.len() > MAX_IMAGE_SIZE {
    return Err(ApiError::PayloadTooLarge);
}
```

---

### 7. **No Request Timeout Configuration**
**Severity:** High  
**Location:** `crates/server/src/main.rs`, `crates/remote/src/app.rs`

**Issue:** No global request timeout configured for HTTP server.

**Risk:** Slowloris attacks and resource exhaustion.

**Recommendation:**
```rust
use tower_http::timeout::TimeoutLayer;

Router::new()
    .layer(TimeoutLayer::new(Duration::from_secs(30)))
```

---

### 8. **Sensitive Data in localStorage**
**Severity:** High  
**Location:** `remote-frontend/src/auth.ts:7-8`

**Issue:**
```typescript
localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
```

**Risk:** Tokens persist across browser sessions and are vulnerable to XSS attacks.

**Recommendation:**
```typescript
// Use httpOnly cookies for tokens (set server-side)
// Or at minimum, use sessionStorage instead of localStorage
sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
```

Better approach: Set tokens as httpOnly cookies from the server.

---

## Medium Severity Issues

### 9. **Session Inactivity Duration**
**Severity:** Medium  
**Location:** `crates/remote/src/db/auth.rs`

**Issue:** Session inactivity timeout value not visible in provided code.

**Recommendation:** Ensure `MAX_SESSION_INACTIVITY_DURATION` is set appropriately (e.g., 30 days max).

---

### 10. **Missing Input Validation on User-Supplied Data**
**Severity:** Medium  
**Location:** Multiple endpoints

**Issue:** Limited validation on user inputs (email format, username length, etc.)

**Recommendation:**
```rust
use validator::{Validate, ValidationError};

#[derive(Validate)]
struct UserInput {
    #[validate(email)]
    email: String,
    
    #[validate(length(min = 3, max = 50))]
    username: Option<String>,
    
    #[validate(length(min = 1, max = 100))]
    first_name: Option<String>,
}
```

---

### 11. **Weak Docker Default Credentials**
**Severity:** Medium  
**Location:** `docker-compose.dev.yml:16-18`

**Issue:**
```yaml
POSTGRES_USER: sentry
POSTGRES_PASSWORD: sentry
POSTGRES_DB: sentry
```

**Risk:** Default credentials in development could be accidentally used in production.

**Recommendation:**
```yaml
POSTGRES_USER: ${SENTRY_DB_USER:-sentry}
POSTGRES_PASSWORD: ${SENTRY_DB_PASSWORD:?error: SENTRY_DB_PASSWORD must be set}
POSTGRES_DB: ${SENTRY_DB_NAME:-sentry}
```

Require password to be set via environment variable.

---

### 12. **No Password Complexity Requirements**
**Severity:** Medium  
**Location:** OAuth providers only, no native password auth

**Note:** Project uses OAuth only, but if password auth is added later, implement requirements.

**Recommendation:** Document that any future password authentication must enforce:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, special chars
- Integration with haveibeenpwned API

---

### 13. **Missing Audit Logging**
**Severity:** Medium  
**Location:** Multiple critical operations

**Issue:** No comprehensive audit trail for security events.

**Recommendation:** Implement audit logging for:
```rust
pub enum AuditEvent {
    UserLogin { user_id: Uuid, ip: IpAddr },
    UserLogout { user_id: Uuid },
    TokenRefresh { user_id: Uuid, ip: IpAddr },
    SessionRevoked { user_id: Uuid, reason: String },
    PasswordChanged { user_id: Uuid },
    PermissionChanged { user_id: Uuid, resource: String },
}
```

---

### 14. **No Content-Type Validation**
**Severity:** Medium  
**Location:** File upload endpoints

**Issue:** MIME type validation based only on client-provided data.

**Recommendation:**
```rust
// Use infer or tree_magic crates for magic number detection
use infer;

let kind = infer::get(&data)
    .ok_or(ApiError::InvalidFileType)?;

if !["image/jpeg", "image/png", "image/gif", "image/webp"]
    .contains(&kind.mime_type()) {
    return Err(ApiError::InvalidFileType);
}
```

---

### 15. **Hardcoded Sentry Secret in Docker Compose**
**Severity:** Medium  
**Location:** `docker-compose.dev.yml:39`

**Issue:**
```yaml
SENTRY_SECRET_KEY: ${SENTRY_SECRET_KEY:-task-copilot-local-dev-secret-key-change-in-production}
```

**Risk:** Weak default could be used in production.

**Recommendation:**
```yaml
SENTRY_SECRET_KEY: ${SENTRY_SECRET_KEY:?error: SENTRY_SECRET_KEY must be set}
```

---

### 16. **Missing CSRF Protection**
**Severity:** Medium  
**Location:** State-changing endpoints

**Issue:** No CSRF token validation for state-changing operations.

**Recommendation:**
Implement CSRF protection using the `axum-csrf` crate or custom middleware:
```rust
use tower_csrf::CsrfLayer;

Router::new()
    .layer(CsrfLayer::new())
```

---

## Low Severity Issues

### 17. **Verbose Error Messages**
**Severity:** Low  
**Location:** Various error handling

**Issue:** Some error messages may expose internal system details.

**Recommendation:** Ensure production error responses are generic:
```rust
fn user_facing_error(err: &ApiError) -> String {
    match err {
        ApiError::Database(_) => "An internal error occurred".to_string(),
        ApiError::NotFound => "Resource not found".to_string(),
        // Don't expose internal details
        _ => "An error occurred".to_string(),
    }
}
```

---

### 18. **No Dependency Vulnerability Scanning**
**Severity:** Low  

**Issue:** No automated dependency scanning in CI/CD.

**Recommendation:**
Add to CI pipeline:
```yaml
- name: Cargo Audit
  run: cargo audit

- name: NPM Audit
  run: pnpm audit
```

---

### 19. **Missing Security.txt**
**Severity:** Low  

**Issue:** No security.txt file for responsible disclosure.

**Recommendation:**
Create `frontend/public/.well-known/security.txt`:
```
Contact: security@taskcopilot.com
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: en
Canonical: https://taskcopilot.com/.well-known/security.txt
```

---

### 20. **Docker Image Running as Root Initially**
**Severity:** Low  
**Location:** `Dockerfile:66`

**Issue:** Multi-stage build eventually switches to non-root, but build stage runs as root.

**Note:** This is acceptable for multi-stage builds, but worth noting.

---

### 21. **No Subresource Integrity (SRI)**
**Severity:** Low  
**Location:** Frontend HTML

**Issue:** External resources loaded without integrity checks.

**Recommendation:** Add SRI hashes to any CDN-loaded resources.

---

### 22. **Missing HTTP Security Headers Documentation**
**Severity:** Low  

**Issue:** No security headers documented in deployment guides.

**Recommendation:** Document recommended nginx/reverse proxy configuration.

---

### 23. **No Secrets Rotation Policy**
**Severity:** Low  

**Issue:** No documented policy for rotating secrets.

**Recommendation:** Document rotation policy:
- JWT secrets: Annual rotation
- OAuth client secrets: When compromised
- Database passwords: Quarterly rotation
- API keys: 90-day rotation

---

## Strengths Identified

The following security practices are well-implemented:

1. ✅ **JWT Implementation**: Proper use of refresh token rotation with reuse detection
2. ✅ **Webhook Signature Verification**: Correct HMAC-SHA256 implementation with constant-time comparison
3. ✅ **SQL Injection Prevention**: Consistent use of parameterized queries via SQLx
4. ✅ **Path Traversal Protection**: Proper canonicalization and validation in file operations
5. ✅ **Secret Management**: Use of `secrecy` crate for sensitive data
6. ✅ **Session Management**: Proper session validation and revocation mechanisms
7. ✅ **Encrypted Provider Tokens**: AES-256-GCM encryption for OAuth tokens in refresh tokens
8. ✅ **Environment Variable Pattern**: Clear separation of config from code

---

## Prioritized Remediation Plan

### Phase 1: Immediate (Week 1)
1. Fix CORS configuration (#1) - **Critical**
2. Add security headers (#2) - **Critical**
3. Improve JWT secret validation (#3) - **Critical**
4. Implement rate limiting (#4) - **High**

### Phase 2: Short-term (Weeks 2-4)
5. Add file upload size limits (#6) - **High**
6. Configure request timeouts (#7) - **High**
7. Move tokens from localStorage (#8) - **High**
8. Fix Docker credentials (#11) - **Medium**
9. Implement CSRF protection (#16) - **Medium**

### Phase 3: Medium-term (Months 2-3)
10. Add comprehensive audit logging (#13) - **Medium**
11. Implement content-type validation (#14) - **Medium**
12. Set up dependency scanning (#18) - **Low**
13. Create security.txt (#19) - **Low**

### Phase 4: Ongoing
14. Regular security reviews
15. Penetration testing
16. Dependency updates
17. Secret rotation

---

## Testing Recommendations

### Security Testing Checklist

- [ ] OWASP ZAP automated scan
- [ ] Manual penetration testing
- [ ] Dependency vulnerability scanning (cargo audit, pnpm audit)
- [ ] SAST tool integration (Semgrep, Clippy with security lints)
- [ ] Secret scanning (TruffleHog, git-secrets)
- [ ] Container security scanning (Trivy, Clair)
- [ ] Load testing for DoS resilience
- [ ] JWT token testing (jwt.io validation)
- [ ] CORS policy testing
- [ ] SQL injection testing (SQLMap)

---

## Compliance Considerations

If handling user data subject to regulations:

- **GDPR**: Implement data deletion, export capabilities
- **CCPA**: Similar data rights
- **SOC 2**: Audit logging, access controls
- **ISO 27001**: Document security policies

---

## Conclusion

The project demonstrates several strong security foundations, particularly in authentication and database security. The critical issues identified are primarily configuration-related and can be addressed quickly. Implementing the recommendations in this report will significantly improve the security posture of the application.

**Key Priorities:**
1. Restrict CORS to known origins
2. Add comprehensive security headers
3. Implement rate limiting across all endpoints
4. Move sensitive tokens out of localStorage

With these changes, the application will have a robust security foundation suitable for production deployment.

---

**Report Prepared By:** Security Analysis Tool  
**Next Review Recommended:** 6 months
