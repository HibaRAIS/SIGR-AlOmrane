package com.alomrane.sigr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class SigrApplication {
    public static void main(String[] args) {
        SpringApplication.run(SigrApplication.class, args);
    }
}