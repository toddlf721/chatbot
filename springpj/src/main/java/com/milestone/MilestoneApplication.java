package com.milestone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MilestoneApplication {

    public static void main(String[] args) {
        SpringApplication.run(MilestoneApplication.class, args);
    }
}