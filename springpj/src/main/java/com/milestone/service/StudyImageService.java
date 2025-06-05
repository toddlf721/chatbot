package com.milestone.service;

import com.milestone.entity.Board;
import com.milestone.entity.StudyImage;
import com.milestone.repository.BoardRepository;
import com.milestone.repository.StudyImageRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudyImageService {

    private static final Logger logger = LoggerFactory.getLogger(StudyImageService.class);
    private final StudyImageRepository studyImageRepository;
    private final BoardRepository boardRepository;

    /**
     * 스터디 이미지 저장
     */
    @Transactional
    public StudyImage saveStudyImage(MultipartFile file, String sessionId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("이미지 파일이 없습니다.");
        }

        // 파일 이름 및 확장자
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = "study_" + UUID.randomUUID() + fileExtension;

        // 이미지 데이터 및 타입
        byte[] imageData = file.getBytes();
        String contentType = file.getContentType();

        // StudyImage 엔티티 생성 및 저장
        StudyImage studyImage = StudyImage.builder()
                .studyImageName(fileName)
                .studyImagePath("/api/images/study/")
                .studyImageData(imageData)
                .studyImageType(contentType != null ? contentType : "image/jpeg")
                .studyImageOrder(0) // 기본값
                .sessionId(sessionId)
                .build();

        return studyImageRepository.save(studyImage);
    }

    /**
     * 임시 이미지를 게시물에 연결
     */
    @Transactional
    public void linkImagesToBoard(String sessionId, Board board) {
        List<StudyImage> images = studyImageRepository.findBySessionIdAndBoardIsNull(sessionId);

        for (StudyImage image : images) {
            image.setBoard(board);
            studyImageRepository.save(image);
        }

        logger.info("세션 {} 의 {} 개 이미지를 게시물 {}에 연결했습니다.",
                sessionId, images.size(), board.getBoardNo());
    }

    /**
     * 이미지 ID로 이미지 조회
     */
    @Transactional(readOnly = true)
    public StudyImage getStudyImageById(Long imageId) {
        return studyImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다: " + imageId));
    }

    /**
     * 게시물의 모든 이미지 조회
     */
    @Transactional(readOnly = true)
    public List<StudyImage> getStudyImagesByBoardId(Long boardId) {
        return studyImageRepository.findByBoardBoardNoOrderByStudyImageOrderAsc(boardId);
    }

    /**
     * 세션 ID로 모든 이미지 조회
     */
    @Transactional(readOnly = true)
    public List<StudyImage> getStudyImagesBySessionId(String sessionId) {
        return studyImageRepository.findBySessionIdOrderByStudyImageOrderAsc(sessionId);
    }
}