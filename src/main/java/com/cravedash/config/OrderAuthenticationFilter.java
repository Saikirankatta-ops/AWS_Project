package com.cravedash.config;

import com.cravedash.model.AuthenticatedUser;
import com.cravedash.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class OrderAuthenticationFilter extends OncePerRequestFilter {
    private static final String ORDERS_PATH = "/api/orders";
    private final AuthService authService;

    public OrderAuthenticationFilter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || "/api/health".equals(path)
                || path.startsWith("/api/auth/")
                || !("/api/orders".equals(path) || path.startsWith(ORDERS_PATH + "/"));
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = readSessionCookie(request);
        try {
            AuthenticatedUser user = authService.getSessionUser(token);
            request.setAttribute("cravedash.authenticatedUser", user);
        } catch (com.cravedash.service.InvalidCredentialsException exception) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"message\":\"Authentication required\"}");
            return;
        }
        filterChain.doFilter(request, response);
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
}
