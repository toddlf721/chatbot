package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reply")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reply_no")
    private Long replyNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_no", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_no", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_parent_no")
    private Reply replyParent;

    @Column(name = "reply_content", nullable = false, length = 1000)
    private String replyContent;

    @Column(name = "reply_like", nullable = false)
    private Long replyLike;

    @Column(name = "reply_status", nullable = false, columnDefinition = "ENUM('active', 'deleted', 'reported') DEFAULT 'active'")
    private String replyStatus;

    @CreationTimestamp
    @Column(name = "reply_inputdate", nullable = false, updatable = false)
    private LocalDateTime replyInputdate;

    @UpdateTimestamp
    @Column(name = "reply_updatedate")
    private LocalDateTime replyUpdatedate;
}