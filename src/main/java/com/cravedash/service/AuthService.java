package com.cravedash.service;

import com.cravedash.model.AuthenticatedUser;
import com.cravedash.model.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Objects;

@Service
public class AuthService {
    public static final String SESSION_COOKIE_NAME = "CRAVEDASH_SESSION";
    private static final String USER_KEY_PREFIX = "auth:user:";
    private static final String SESSION_KEY_PREFIX = "auth:session:";
    private static final Duration SESSION_TTL = Duration.ofHours(8);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder passwordEncoder;
    @NonNull
    private final String ownerUsername;
    @NonNull
    private final String ownerPassword;
    @NonNull
    private final String ownerAccountValue;

    public AuthService(
            StringRedisTemplate redisTemplate,
            PasswordEncoder passwordEncoder,
            @Value("${app.auth.bootstrap-username:}") @NonNull String ownerUsername,
            @Value("${app.auth.bootstrap-password:}") @NonNull String ownerPassword) {
        this.redisTemplate = redisTemplate;
        this.passwordEncoder = passwordEncoder;
        this.ownerUsername = Objects.requireNonNull(ownerUsername.trim());
        this.ownerPassword = Objects.requireNonNull(ownerPassword);
        validatePasswordLength(ownerPassword);
        this.ownerAccountValue = Objects.requireNonNull(ownerPassword.isBlank()
                ? ""
                : accountValue(UserRole.OWNER, passwordEncoder.encode(ownerPassword)));
    }

    public AuthenticatedSession register(@NonNull String username, @NonNull String password) {
        validatePasswordLength(password);
        String normalizedUsername = username.trim();
        if (normalizedUsername.equalsIgnoreCase(ownerUsername) && !ownerUsername.isBlank()) {
            throw new UsernameAlreadyExistsException();
        }
        String value = accountValue(UserRole.CUSTOMER, passwordEncoder.encode(password));
        Boolean created = redisTemplate.opsForValue().setIfAbsent(
                Objects.requireNonNull(userKey(normalizedUsername)),
                Objects.requireNonNull(value));
        if (!Boolean.TRUE.equals(created)) {
            throw new UsernameAlreadyExistsException();
        }
        return createSession(new AuthenticatedUser(normalizedUsername, UserRole.CUSTOMER));
    }

    public AuthenticatedSession login(@NonNull String username, @NonNull String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new InvalidCredentialsException();
        }
        bootstrapOwner();
        String normalizedUsername = username.trim();
        String storedAccount = readAccount(normalizedUsername);
        Account account = parseAccount(storedAccount);
        if (account == null || !passwordEncoder.matches(password, account.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        return createSession(new AuthenticatedUser(normalizedUsername, account.role()));
    }

    public AuthenticatedUser getSessionUser(@Nullable String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidCredentialsException();
        }
        String username = redisTemplate.opsForValue().get(Objects.requireNonNull(sessionKey(token)));
        if (username == null) {
            throw new InvalidCredentialsException();
        }
        Account account = parseAccount(redisTemplate.opsForValue().get(userKey(username)));
        if (account == null) {
            throw new InvalidCredentialsException();
        }
        return new AuthenticatedUser(username, account.role());
    }

    public void logout(@Nullable String token) {
        if (token != null && !token.isBlank()) {
            redisTemplate.delete(Objects.requireNonNull(sessionKey(token)));
        }
    }

    private void bootstrapOwner() {
        if (!ownerUsername.isBlank() && !ownerPassword.isBlank()) {
            redisTemplate.opsForValue().setIfAbsent(
                    Objects.requireNonNull(userKey(ownerUsername)),
                    Objects.requireNonNull(ownerAccountValue));
        }
    }

    private AuthenticatedSession createSession(AuthenticatedUser user) {
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        saveSession(token, user.username());
        return new AuthenticatedSession(Objects.requireNonNull(token), user);
    }

    @SuppressWarnings("null")
    private void saveSession(String token, String username) {
        redisTemplate.opsForValue().set(SESSION_KEY_PREFIX.concat(token), username, SESSION_TTL);
    }

    @SuppressWarnings("null")
    private String readAccount(String username) {
        return redisTemplate.opsForValue().get(USER_KEY_PREFIX.concat(username));
    }

    private String accountValue(UserRole role, String passwordHash) {
        return role.name() + ":" + passwordHash;
    }

    private void validatePasswordLength(String password) {
        if (!password.isBlank() && password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Passwords must be no longer than 72 UTF-8 bytes.");
        }
    }

    @Nullable
    private Account parseAccount(@Nullable String value) {
        if (value == null) {
            return null;
        }
        int separator = value.indexOf(':');
        if (separator < 1 || separator == value.length() - 1) {
            return null;
        }
        try {
            return new Account(UserRole.valueOf(value.substring(0, separator)), value.substring(separator + 1));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    @NonNull
    private String userKey(@NonNull String username) {
        return USER_KEY_PREFIX + username;
    }

    @NonNull
    private String sessionKey(@NonNull String token) {
        return SESSION_KEY_PREFIX + token;
    }

    public record AuthenticatedSession(@NonNull String token, AuthenticatedUser user) {
    }

    private record Account(UserRole role, String passwordHash) {
    }
}
