package com.milestone.controller;

import com.milestone.dto.MemberFollowDto;
import com.milestone.service.FollowService;
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
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private static final Logger logger = LoggerFactory.getLogger(FollowController.class);
    private final FollowService followService;

    /**
     * 사용자 팔로우 API
     */
    @PostMapping("/{username}")
    public ResponseEntity<Object> followUser(@PathVariable String username, HttpSession session) {
        try {
            logger.info("사용자 팔로우 요청 - 팔로우할 사용자: {}", username);
            followService.followUser(username, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", username + "님을 팔로우했습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("사용자 팔로우 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 사용자 언팔로우 API
     */
    @DeleteMapping("/{username}")
    public ResponseEntity<Object> unfollowUser(@PathVariable String username, HttpSession session) {
        try {
            logger.info("사용자 언팔로우 요청 - 언팔로우할 사용자: {}", username);
            followService.unfollowUser(username, session);

            Map<String, String> response = new HashMap<>();
            response.put("message", username + "님을 언팔로우했습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("사용자 언팔로우 실패: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 특정 사용자의 팔로워 목록 조회 API
     */
    @GetMapping("/{username}/followers")
    public ResponseEntity<List<MemberFollowDto>> getFollowers(@PathVariable String username) {
        logger.info("팔로워 목록 조회 요청 - 사용자: {}", username);
        List<MemberFollowDto> followers = followService.getFollowers(username);
        return ResponseEntity.ok(followers);
    }

    /**
     * 특정 사용자의 팔로잉 목록 조회 API
     */
    @GetMapping("/{username}/following")
    public ResponseEntity<List<MemberFollowDto>> getFollowing(@PathVariable String username) {
        logger.info("팔로잉 목록 조회 요청 - 사용자: {}", username);
        List<MemberFollowDto> following = followService.getFollowing(username);
        return ResponseEntity.ok(following);
    }

    /**
     * 팔로우 상태 확인 API
     */
    @GetMapping("/{username}/status")
    public ResponseEntity<Map<String, Boolean>> checkFollowStatus(@PathVariable String username, HttpSession session) {
        logger.info("팔로우 상태 확인 요청 - 사용자: {}", username);
        boolean isFollowing = followService.isFollowing(username, session);

        Map<String, Boolean> response = new HashMap<>();
        response.put("isFollowing", isFollowing);
        return ResponseEntity.ok(response);
    }

    /**
     * 추천 사용자 목록 조회 API
     */
    @GetMapping("/suggested")
    public ResponseEntity<List<Map<String, Object>>> getSuggestedUsers(HttpSession session) {
        logger.info("추천 사용자 목록 조회 요청");
        List<Map<String, Object>> suggestedUsers = followService.getSuggestedUsers(session);
        return ResponseEntity.ok(suggestedUsers);
    }
}