package com.cravedash.controller;

import com.cravedash.service.AuthService;
import com.cravedash.model.AuthenticatedUser;
import com.cravedash.model.UserRole;
import com.cravedash.service.AuthService.AuthenticatedSession;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Objects;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Duration COOKIE_TTL = Duration.ofHours(8);

    private final AuthService authService;
    private final boolean secureCookie;

    public AuthController(
            AuthService authService,
            @Value("${app.auth.secure-cookie:false}") boolean secureCookie) {
        this.authService = authService;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthenticatedSession session = authService.login(request.username(), request.password());
        writeSessionCookie(session.token(), response);
        return responseFor(session.user());
    }

    @PostMapping("/register")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthenticatedSession session = authService.register(request.username(), request.password());
        writeSessionCookie(session.token(), response);
        return responseFor(session.user());
    }

    @GetMapping("/me")
    public AuthResponse me(HttpServletRequest request) {
        return responseFor(authService.getSessionUser(readSessionCookie(request)));
    }

    @PostMapping("/logout")
    public AuthResponse logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(readSessionCookie(request));
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookie("", Objects.requireNonNull(Duration.ZERO)).toString());
        return new AuthResponse("logged out", null);
    }

    private void writeSessionCookie(@NonNull String token, HttpServletResponse response) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                sessionCookie(token, Objects.requireNonNull(COOKIE_TTL)).toString());
    }

    private AuthResponse responseFor(AuthenticatedUser user) {
        return new AuthResponse(user.username(), user.role());
    }

    private ResponseCookie sessionCookie(String value, @NonNull Duration maxAge) {
        return ResponseCookie.from(AuthService.SESSION_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(secureCookie ? "None" : "Lax")
                .path("/api")
                .maxAge(maxAge)
                .build();
    }

    private String readSessionCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (AuthService.SESSION_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public record LoginRequest(
            @NonNull @NotBlank @Size(max = 100) String username,
            @NonNull @NotBlank @Size(max = 200) String password) {
    }

    public record RegisterRequest(
            @NonNull @NotBlank @Size(min = 3, max = 32) @Pattern(regexp = "[A-Za-z0-9._-]+") String username,
            @NonNull @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record AuthResponse(String username, UserRole role) {
    }
}
