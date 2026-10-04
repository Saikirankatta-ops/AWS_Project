package com.cravedash.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiHomeController {

    @GetMapping("/")
    public ApiInfo apiInfo() {
        return new ApiInfo("CraveDash Backend", "/api/health", "/api/orders");
    }

    public record ApiInfo(String service, String health, String orders) {
    }
}
