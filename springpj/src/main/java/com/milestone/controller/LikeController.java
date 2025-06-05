package com.milestone.controller;

import com.milestone.service.LikeService;
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
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private static final Logger logger = LoggerFactory.getLogger(LikeController.class);
    private final LikeService likeService;

    /**
     * 좋아요 생성 API
     */
    @PostMapping("/boards/{boardNo}")
    public ResponseEntity<Object> likeBoard(@PathVariable Long boardNo, HttpSession session) {
        try {
            logger.info("게시물 좋아요 요청 - 게시물 ID: {}", boardNo);
            likeService.likeBoard(boardNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "게시물을 좋아합니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("게시물 좋아요 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 좋아요 취소 API
     */
    @DeleteMapping("/boards/{boardNo}")
    public ResponseEntity<Object> unlikeBoard(@PathVariable Long boardNo, HttpSession session) {
        try {
            logger.info("게시물 좋아요 취소 요청 - 게시물 ID: {}", boardNo);
            likeService.unlikeBoard(boardNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "게시물 좋아요를 취소했습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("게시물 좋아요 취소 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 댓글 좋아요 API
     */
    @PostMapping("/replies/{replyNo}")
    public ResponseEntity<Object> likeReply(@PathVariable Long replyNo, HttpSession session) {
        try {
            logger.info("댓글 좋아요 요청 - 댓글 ID: {}", replyNo);
            likeService.likeReply(replyNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "댓글을 좋아합니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("댓글 좋아요 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 댓글 좋아요 취소 API
     */
    @DeleteMapping("/replies/{replyNo}")
    public ResponseEntity<Object> unlikeReply(@PathVariable Long replyNo, HttpSession session) {
        try {
            logger.info("댓글 좋아요 취소 요청 - 댓글 ID: {}", replyNo);
            likeService.unlikeReply(replyNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "댓글 좋아요를 취소했습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("댓글 좋아요 취소 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 사용자가 좋아요한 게시물 조회 API
     */
    @GetMapping("/boards")
    public ResponseEntity<List<Long>> getLikedBoards(HttpSession session) {
        logger.info("좋아요한 게시물 조회 요청");
        List<Long> likedBoards = likeService.getLikedBoardsByMember(session);
        return ResponseEntity.ok(likedBoards);
    }

    /**
     * 특정 게시물 좋아요 상태 확인 API
     */
    @GetMapping("/boards/{boardNo}/status")
    public ResponseEntity<Map<String, Boolean>> checkBoardLikeStatus(@PathVariable Long boardNo, HttpSession session) {
        logger.info("게시물 좋아요 상태 확인 요청 - 게시물 ID: {}", boardNo);
        boolean isLiked = likeService.checkBoardLikeStatus(boardNo, session);

        Map<String, Boolean> response = new HashMap<>();
        response.put("isLiked", isLiked);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 댓글 좋아요 상태 확인 API
     */
    @GetMapping("/replies/{replyNo}/status")
    public ResponseEntity<Map<String, Boolean>> checkReplyLikeStatus(@PathVariable Long replyNo, HttpSession session) {
        logger.info("댓글 좋아요 상태 확인 요청 - 댓글 ID: {}", replyNo);
        boolean isLiked = likeService.checkReplyLikeStatus(replyNo, session);

        Map<String, Boolean> response = new HashMap<>();
        response.put("isLiked", isLiked);
        return ResponseEntity.ok(response);
    }
}