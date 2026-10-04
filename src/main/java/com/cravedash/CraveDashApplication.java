package com.cravedash;

import com.cravedash.service.OrderService;
import org.springframework.dao.DataAccessException;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CraveDashApplication {

    public static void main(String[] args) {
        SpringApplication.run(CraveDashApplication.class, args);
    }

    @Bean
    CommandLineRunner seedDemoOrders(OrderService orderService) {
        return args -> {
            try {
                orderService.seedDemoOrders();
            } catch (DataAccessException exception) {
            }
        };
    }
}
