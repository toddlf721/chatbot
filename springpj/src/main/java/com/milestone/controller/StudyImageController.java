package com.milestone.controller;

import com.milestone.entity.StudyImage;
import com.milestone.service.StudyImageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images/study")
@RequiredArgsConstructor
public class StudyImageController {

    private static final Logger logger = LoggerFactory.getLogger(StudyImageController.class);
    private final StudyImageService studyImageService;

    /**
     * 스터디 이미지 업로드 API
     * TinyMCE 에디터에서 호출
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadStudyImage(
            @RequestParam("file") MultipartFile file,
            HttpSession session) {

        try {
            // 세션 ID 생성 또는 가져오기
            String sessionId = (String) session.getAttribute("STUDY_SESSION_ID");
            if (sessionId == null) {
                sessionId = UUID.randomUUID().toString();
                session.setAttribute("STUDY_SESSION_ID", sessionId);
            }

            // 이미지 저장
            StudyImage studyImage = studyImageService.saveStudyImage(file, sessionId);

            // 이미지 URL 생성
            String imageUrl = "/api/images/study/" + studyImage.getStudyImageNo();

            // 응답 데이터
            Map<String, String> response = new HashMap<>();
            response.put("location", imageUrl);
            response.put("imageUrl", imageUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("스터디 이미지 업로드 실패: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "이미지 업로드 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 스터디 이미지 조회 API
     */
    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> getStudyImage(@PathVariable Long imageId) {
        try {
            StudyImage image = studyImageService.getStudyImageById(imageId);

            if (image == null) {
                return ResponseEntity.notFound().build();
            }

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(image.getStudyImageType()));
            headers.setCacheControl("max-age=86400"); // 1일 캐싱

            // 이미지 바이너리 데이터 반환
            return new ResponseEntity<>(image.getStudyImageData(), headers, HttpStatus.OK);

        } catch (Exception e) {
            logger.error("스터디 이미지 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}