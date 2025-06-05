package com.milestone.controller;

import com.milestone.entity.BoardImage;
import com.milestone.entity.Member;
import com.milestone.service.BoardService;
import com.milestone.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);
    private final BoardService boardService;
    private final MemberService memberService;

    private static final String UPLOAD_DIR = "uploads";

    /**
     * 게시물 ID로 이미지 데이터 제공 API
     * 프론트엔드에서 /api/images/{boardNo}로 접근
     */
    @GetMapping("/{boardNo}")
    public ResponseEntity<byte[]> getBoardImage(@PathVariable Long boardNo) {
        try {
            // 게시물 ID로 첫 번째 이미지 가져오기 (대표 이미지)
            BoardImage image = boardService.getBoardFirstImage(boardNo);

            if (image == null) {
                logger.warn("이미지를 찾을 수 없음: boardNo={}", boardNo);
                return ResponseEntity.notFound().build();
            }

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();

            // Content-Type 설정 (이미지 MIME 타입)
            headers.setContentType(MediaType.parseMediaType(image.getBoardImageType()));

            // 캐시 제어 헤더 설정
            headers.setCacheControl("max-age=86400"); // 하루 동안 캐싱

            // 이미지 바이너리 데이터와 함께 응답 반환
            return new ResponseEntity<>(image.getBoardImageData(), headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("이미지 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 이미지 ID로 이미지 데이터 제공 API
     * 특정 이미지 ID로 접근하는 경우
     */
    @GetMapping("/id/{imageId}")
    public ResponseEntity<byte[]> getImageById(@PathVariable Long imageId) {
        try {
            // 이미지 ID로 이미지 정보 조회
            BoardImage image = boardService.getBoardImageInfo(imageId);

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(image.getBoardImageType()));
            headers.setCacheControl("max-age=86400"); // 하루 동안 캐싱

            // 이미지 바이너리 데이터와 함께 응답 반환
            return new ResponseEntity<>(image.getBoardImageData(), headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.warn("이미지 조회 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("이미지 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 회원 프로필 이미지 제공 API
     * 프론트엔드에서 /api/images/profile/{memberNo}로 접근
     */
    @GetMapping("/profile/{memberNo}")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable Long memberNo) {
        try {
            // 회원 ID로 회원 정보 조회
            Member member = memberService.getMemberProfileImage(memberNo);

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();

            // 이미지 데이터가 없거나 기본 이미지인 경우
            if (member.getMemberPhotoData() == null || member.getMemberPhotoType() == null ||
                    "/icon/profileimage.png".equals(member.getMemberPhoto())) {
                // 기본 이미지 데이터 반환
                byte[] defaultImageData = memberService.getDefaultProfileImageData();
                headers.setContentType(MediaType.IMAGE_PNG);
                headers.setCacheControl("max-age=86400"); // 하루 동안 캐싱
                return new ResponseEntity<>(defaultImageData, headers, HttpStatus.OK);
            }

            // Content-Type 설정 (이미지 MIME 타입)
            headers.setContentType(MediaType.parseMediaType(member.getMemberPhotoType()));

            // 캐시 제어 헤더 설정 - 프로필 이미지는 변경이 자주 일어날 수 있으므로 캐시 제한
            headers.setCacheControl("no-cache, no-store, must-revalidate"); // 캐시 사용 안함
            headers.setPragma("no-cache");
            headers.setExpires(0); // 즉시 만료

            // 이미지 바이너리 데이터와 함께 응답 반환
            return new ResponseEntity<>(member.getMemberPhotoData(), headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.warn("프로필 이미지 조회 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("프로필 이미지 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 콘텐츠 이미지 제공 API
     * 업로드된 이미지를 /api/images/content/{filename} 경로로 접근
     */
    @GetMapping("/content/{filename:.+}")
    public ResponseEntity<byte[]> getContentImage(@PathVariable String filename) {
        try {
            // 파일 경로 설정
            Path filePath = Paths.get(UPLOAD_DIR, filename);

            logger.info("콘텐츠 이미지 요청: {}, 경로: {}", filename, filePath);

            // 파일이 존재하는지 확인
            if (!Files.exists(filePath)) {
                logger.warn("파일을 찾을 수 없음: {}", filename);
                return ResponseEntity.notFound().build();
            }

            // 파일의 MIME 타입 결정
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                // 알 수 없는 경우 기본값 설정
                contentType = "application/octet-stream";
            }

            // 파일 읽기
            byte[] fileData = Files.readAllBytes(filePath);

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl("max-age=86400"); // 하루 동안 캐싱

            return new ResponseEntity<>(fileData, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("이미지 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}