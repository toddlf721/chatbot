package com.milestone.controller;

import com.milestone.service.ScrapService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scraps")
@RequiredArgsConstructor
public class ScrapController {

    private static final Logger logger = LoggerFactory.getLogger(ScrapController.class);
    private final ScrapService scrapService;

    /**
     * 게시물 스크랩 API
     */
    @PostMapping("/{boardNo}")
    public ResponseEntity<Object> scrapBoard(@PathVariable Long boardNo, HttpSession session) {
        try {
            logger.info("게시물 스크랩 요청 - 게시물 ID: {}", boardNo);
            scrapService.scrapBoard(boardNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "게시물을 스크랩했습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("게시물 스크랩 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 게시물 스크랩 취소 API
     */
    @DeleteMapping("/{boardNo}")
    public ResponseEntity<Object> unscrapBoard(@PathVariable Long boardNo, HttpSession session) {
        try {
            logger.info("게시물 스크랩 취소 요청 - 게시물 ID: {}", boardNo);
            scrapService.unscrapBoard(boardNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "게시물 스크랩을 취소했습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("게시물 스크랩 취소 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 사용자의 스크랩 목록 조회 API
     */
    @GetMapping
    public ResponseEntity<List<Long>> getScrapsByMember(HttpSession session) {
        logger.info("사용자별 스크랩 목록 조회 요청");
        List<Long> scrappedBoards = scrapService.getScrapsByMember(session);
        return ResponseEntity.ok(scrappedBoards);
    }

    /**
     * 특정 게시물 스크랩 상태 조회 API
     */
    @GetMapping("/{boardNo}/status")
    public ResponseEntity<Map<String, Boolean>> checkScrapStatus(@PathVariable Long boardNo, HttpSession session) {
        logger.info("게시물 스크랩 상태 확인 요청 - 게시물 ID: {}", boardNo);
        boolean isScrapped = scrapService.checkScrapStatus(boardNo, session);

        Map<String, Boolean> response = new HashMap<>();
        response.put("isScrapped", isScrapped);
        return ResponseEntity.ok(response);
    }
}