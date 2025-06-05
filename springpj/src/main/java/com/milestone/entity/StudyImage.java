package com.milestone.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_image")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "study_image_no")
    private Long studyImageNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_no", nullable = true)
    private Board board;

    @Column(name = "study_image_name", nullable = false, length = 1000)
    private String studyImageName;

    @Column(name = "study_image_path", length = 1000)
    private String studyImagePath;

    @Lob
    @Column(name = "study_image_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] studyImageData;

    @Column(name = "study_image_type", nullable = false, length = 100)
    private String studyImageType;

    @Column(name = "study_image_order", nullable = false)
    private Integer studyImageOrder;

    @CreationTimestamp
    @Column(name = "study_image_inputdate", nullable = false, updatable = false)
    private LocalDateTime studyImageInputdate;

    // 임시 저장을 위한 세션 ID (게시물 생성 전 이미지를 연결하기 위함)
    @Column(name = "session_id", length = 100)
    private String sessionId;
}