package com.cravedash.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record Order(
        String orderId,
        String userName,
        String restaurant,
        BigDecimal amount,
        OrderStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String customerUsername) {
}
