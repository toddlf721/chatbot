package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_image")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_image_no")
    private Long boardImageNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_no", nullable = false)
    private Board board;

    @Column(name = "board_image_name", nullable = false, length = 1000)
    private String boardImageName;

    // 이미지 경로 (선택적으로 유지)
    @Column(name = "board_image_path", length = 1000)
    private String boardImagePath;

    // 이미지 바이너리 데이터
    @Lob
    @Column(name = "board_image_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] boardImageData;

    // 이미지 MIME 타입
    @Column(name = "board_image_type", nullable = false, length = 100)
    private String boardImageType;

    @Column(name = "board_image_order", nullable = false)
    private Integer boardImageOrder;

    @CreationTimestamp
    @Column(name = "board_image_inputdate", nullable = false, updatable = false)
    private LocalDateTime boardImageInputdate;
}