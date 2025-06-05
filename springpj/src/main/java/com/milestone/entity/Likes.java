package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "likes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Likes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "like_no")
    private Long likeNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_no", nullable = false)
    private Member member;

    @Column(name = "like_type", nullable = false, columnDefinition = "ENUM('board', 'reply') NOT NULL")
    private String likeType;

    @Column(name = "like_type_no", nullable = false)
    private Long likeTypeNo;

    @CreationTimestamp
    @Column(name = "like_inputdate", nullable = false, updatable = false)
    private LocalDateTime likeInputdate;
}