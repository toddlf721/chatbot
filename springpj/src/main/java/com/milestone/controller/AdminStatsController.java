package com.milestone.controller;

import com.milestone.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.milestone.dto.MemberResponse;
import com.milestone.entity.Member;
import com.milestone.repository.BoardRepository;
import com.milestone.repository.MemberRepository;

import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminStatsService adminStatsService;
    private final BoardRepository boardRepository; // ✅ 이 줄 추가
    private final MemberRepository memberRepository;

    // 전체 가입자 수
    @GetMapping("/users")
    public ResponseEntity<Integer> getTotalUserCount() {
        int count = adminStatsService.getTotalUserCount();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/users/logged-in-recently")
    public ResponseEntity<Integer> getRecentlyLoggedInUserCount() {
        int count = adminStatsService.getRecentlyLoggedInUserCount();
        return ResponseEntity.ok(count);
    }

    // 월별 게시글 수 통계
    @GetMapping("/posts/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyPostStats() {
        Map<String, Object> result = adminStatsService.getMonthlyPostStats();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/recent")
    public ResponseEntity<List<Member>> getRecentMembers() {
        List<Member> members = adminStatsService.getRecentMembers();
        return ResponseEntity.ok(members);
    }

    @GetMapping("/posts/daily")
    public ResponseEntity<Map<String, Object>> getDailyPostStats() {
        Map<String, Object> result = adminStatsService.getDailyPostStats();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/posts/count")
    public ResponseEntity<Integer> getTotalPostCount() {
        int count = adminStatsService.getTotalPostCount();
        return ResponseEntity.ok(count);
    }

}
