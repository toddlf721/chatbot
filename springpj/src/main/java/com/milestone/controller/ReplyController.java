package com.milestone.controller;

import com.milestone.dto.ReplyRequest;
import com.milestone.dto.ReplyResponse;
import com.milestone.service.ReplyService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/replies")
@RequiredArgsConstructor
public class ReplyController {

    private static final Logger logger = LoggerFactory.getLogger(ReplyController.class);
    private final ReplyService replyService;

    /**
     * 게시물에 대한 댓글 조회 API
     */
    @GetMapping("/board/{boardNo}")
    public ResponseEntity<List<ReplyResponse>> getRepliesByBoard(@PathVariable Long boardNo) {
        logger.info("게시물 댓글 조회 요청 - 게시물 ID: {}", boardNo);
        List<ReplyResponse> replies = replyService.getRepliesByBoard(boardNo);
        return ResponseEntity.ok(replies);
    }

    /**
     * 댓글 작성 API
     */
    @PostMapping
    public ResponseEntity<Object> createReply(@RequestBody @Valid ReplyRequest replyRequest, HttpSession session) {
        try {
            logger.info("댓글 작성 요청 - 게시물 ID: {}", replyRequest.getBoardNo());
            ReplyResponse response = replyService.createReply(replyRequest, session);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("댓글 작성 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("댓글 작성 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "댓글 작성 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 댓글 수정 API
     */
    @PutMapping("/{replyNo}")
    public ResponseEntity<Object> updateReply(
            @PathVariable Long replyNo,
            @RequestBody @Valid ReplyRequest replyRequest,
            HttpSession session) {

        try {
            logger.info("댓글 수정 요청 - 댓글 ID: {}", replyNo);
            ReplyResponse response = replyService.updateReply(replyNo, replyRequest, session);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("댓글 수정 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("댓글 수정 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "댓글 수정 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 댓글 삭제 API
     */
    @DeleteMapping("/{replyNo}")
    public ResponseEntity<Object> deleteReply(@PathVariable Long replyNo, HttpSession session) {
        try {
            logger.info("댓글 삭제 요청 - 댓글 ID: {}", replyNo);
            replyService.deleteReply(replyNo, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "댓글이 삭제되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("댓글 삭제 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("댓글 삭제 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "댓글 삭제 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}