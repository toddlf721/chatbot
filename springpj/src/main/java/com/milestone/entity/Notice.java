package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_no")
    private Long noticeNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_no", nullable = false)
    private Member member; // 알림을 받는 사람

    @Column(name = "notice_sender", nullable = false)
    private Long noticeSender; // 알림을 보내는 사람 ID

    @Column(name = "notice_type", nullable = false, columnDefinition = "ENUM('likes', 'follow', 'mention', 'reply', 'tag', 'dm') NOT NULL")
    private String noticeType;

    @Column(name = "notice_type_no", nullable = false)
    private Long noticeTypeNo;

    @Column(name = "notice_message", nullable = false, length = 100)
    private String noticeMessage;

    @Column(name = "notice_read", nullable = false)
    private Boolean noticeRead;

    @CreationTimestamp
    @Column(name = "notice_inputdate", nullable = false, updatable = false)
    private LocalDateTime noticeInputdate;
}