package com.cravedash.model;

import java.time.LocalDateTime;

public record OrderStatusHistory(OrderStatus status, LocalDateTime timestamp) {
}
