package com.cravedash.controller;

import com.cravedash.model.AuthenticatedUser;
import com.cravedash.model.Order;
import com.cravedash.model.OrderStatus;
import com.cravedash.model.OrderStatusHistory;
import com.cravedash.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {
    private final OrderService orderService;
    private final String redisHost;

    public OrderController(
            OrderService orderService,
            @Value("${spring.data.redis.host:localhost}") String redisHost) {
        this.orderService = orderService;
        this.redisHost = redisHost;
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public Order createOrder(@Valid @RequestBody CreateOrderRequest request, HttpServletRequest httpRequest) {
        return orderService.createOrder(request.restaurant(), request.amount(), authenticatedUser(httpRequest));
    }

    @GetMapping("/orders/{orderId}")
    public Order getOrder(@PathVariable String orderId, HttpServletRequest request) {
        return orderService.getOrder(orderId, authenticatedUser(request));
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders(HttpServletRequest request) {
        return orderService.getAllOrders(authenticatedUser(request));
    }

    @PutMapping("/orders/{orderId}/status")
    public Order updateStatus(@PathVariable String orderId,
                              @Valid @RequestBody UpdateStatusRequest request,
                              HttpServletRequest httpRequest) {
        return orderService.updateStatus(orderId, request.status(), authenticatedUser(httpRequest));
    }

    @GetMapping("/orders/{orderId}/history")
    public List<OrderStatusHistory> getHistory(@PathVariable String orderId, HttpServletRequest request) {
        return orderService.getHistory(orderId, authenticatedUser(request));
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
                "UP",
                orderService.isMemoryDbConnected() ? "CONNECTED" : "DISCONNECTED",
                isLocalRedis() ? "LOCAL_REDIS" : "CONFIGURED_REDIS_ENDPOINT");
    }

    private boolean isLocalRedis() {
        return "localhost".equalsIgnoreCase(redisHost)
                || "127.0.0.1".equals(redisHost)
                || "::1".equals(redisHost);
    }

    public record CreateOrderRequest(
            @NotBlank String userName,
            @NotBlank String restaurant,
            @NotNull @DecimalMin("0.01") BigDecimal amount) {
    }

    public record UpdateStatusRequest(@NotNull OrderStatus status) {
    }

    public record HealthResponse(String status, String memoryDB, String storageTarget) {
    }

    private AuthenticatedUser authenticatedUser(HttpServletRequest request) {
        Object value = request.getAttribute("cravedash.authenticatedUser");
        if (value instanceof AuthenticatedUser user) {
            return user;
        }
        throw new IllegalStateException("Authenticated user is missing from the request.");
    }
}
