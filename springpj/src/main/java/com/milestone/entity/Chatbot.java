package com.milestone.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chatbot_response")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Chatbot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String hashtag;

    @Column(columnDefinition = "TEXT")
    private String response;

    
}
