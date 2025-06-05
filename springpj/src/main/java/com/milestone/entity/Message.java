package com.milestone.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "message")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_no")
    private Long messageNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_from")
    private Member messageFrom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_to")
    private Member messageTo;

    @Column(name = "message_content", length = 2000, nullable = false)
    private String messageContent;

    @Column(name = "message_to_visible")
    private Boolean messageToVisible = true;

    @Column(name = "message_from_visible")
    private Boolean messageFromVisible = true;

    @Column(name = "message_to_check")
    private Boolean messageToCheck = false;

    @Column(name = "message_inputdate")
    private LocalDateTime messageInputdate = LocalDateTime.now();




}
