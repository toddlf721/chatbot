package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "follow")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "follow_no")
    private Long followNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follow_member_no", nullable = false)
    private Member followMember; // 팔로우 당하는 사람 (내가 팔로우하는 사람)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_member_no", nullable = false)
    private Member follower; // 팔로우 하는 사람 (나)

    @Column(name = "follow_status", nullable = false, columnDefinition = "ENUM('pending', 'accepted', 'rejected') DEFAULT 'accepted'")
    private String followStatus;

    @CreationTimestamp
    @Column(name = "follow_inputdate", nullable = false, updatable = false)
    private LocalDateTime followInputdate;
}