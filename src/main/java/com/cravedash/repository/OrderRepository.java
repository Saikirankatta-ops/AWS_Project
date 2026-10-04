package com.cravedash.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cravedash.model.Order;
import com.cravedash.model.OrderStatusHistory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Repository
public class OrderRepository {
    private static final String ORDER_KEY_PREFIX = "order:";
    private static final String HISTORY_KEY_SUFFIX = ":history";
    private static final String ORDER_IDS_KEY = "orders:ids";
    private static final String ID_SEQUENCE_KEY = "orders:id-sequence";

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public OrderRepository(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public String nextOrderId() {
        while (true) {
            Long sequence = Objects.requireNonNull(redisTemplate.opsForValue().increment(ID_SEQUENCE_KEY));
            String orderId = String.valueOf(5000 + sequence);
            if (findById(orderId).isEmpty()) {
                return orderId;
            }
        }
    }

    public void save(Order order) {
        redisTemplate.opsForValue().set(orderKey(order.orderId()), order);
        redisTemplate.opsForSet().add(ORDER_IDS_KEY, order.orderId());
    }

    public Optional<Order> findById(String orderId) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(orderKey(orderId)))
                .map(this::toOrder);
    }

    public List<Order> findAll() {
        Set<Object> ids = redisTemplate.opsForSet().members(ORDER_IDS_KEY);
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Order> orders = new ArrayList<>();
        for (Object id : ids) {
            findById(String.valueOf(id)).ifPresent(orders::add);
        }
        orders.sort((first, second) -> second.createdAt().compareTo(first.createdAt()));
        return orders;
    }

    public void appendHistory(String orderId, OrderStatusHistory history) {
        redisTemplate.opsForList().rightPush(historyKey(orderId), history);
    }

    public List<OrderStatusHistory> findHistory(String orderId) {
        List<Object> values = redisTemplate.opsForList().range(historyKey(orderId), 0, -1);
        if (values == null) {
            return List.of();
        }
        List<OrderStatusHistory> history = new ArrayList<>();
        for (Object value : values) {
            history.add(toOrderStatusHistory(value));
        }
        return history;
    }

    private Order toOrder(Object value) {
        return value instanceof Order order ? order : objectMapper.convertValue(value, Order.class);
    }

    private OrderStatusHistory toOrderStatusHistory(Object value) {
        return value instanceof OrderStatusHistory history
                ? history
                : objectMapper.convertValue(value, OrderStatusHistory.class);
    }

    public boolean isConnected() {
        try {
            return "PONG".equalsIgnoreCase(redisTemplate.getConnectionFactory().getConnection().ping());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private String orderKey(String orderId) {
        return ORDER_KEY_PREFIX + orderId;
    }

    private String historyKey(String orderId) {
        return orderKey(orderId) + HISTORY_KEY_SUFFIX;
    }
}
