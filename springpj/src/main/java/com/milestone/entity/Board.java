package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_no")
    private Long boardNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_no", nullable = false)
    private Member member;

    @Column(name = "board_type", columnDefinition = "ENUM('daily','study') DEFAULT 'daily'")
    private String boardType;

    @Column(name = "board_category", length = 10)
    private String boardCategory;

    @Column(name = "board_title", length = 50)
    private String boardTitle;

    @Column(name = "board_content", nullable = false, length = 2000)
    private String boardContent;

    @Column(name = "board_like", nullable = false)
    private Long boardLike;

    @Column(name = "board_scrap")
    private Long boardScrap;

    @Column(name = "board_readhit", nullable = false)
    private Long boardReadhit;

    @Column(name = "board_visible", nullable = false, columnDefinition = "ENUM('public', 'private', 'follow') DEFAULT 'public'")
    private String boardVisible;

    @CreationTimestamp
    @Column(name = "board_inputdate", nullable = false, updatable = false)
    private LocalDateTime boardInputdate;

    @Column(nullable = false)
    private boolean visible = true;

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }
}