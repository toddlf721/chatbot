package com.milestone.service;

import com.milestone.repository.BoardRepository;
import com.milestone.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.milestone.entity.Member;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final MemberRepository memberRepository;
    private final BoardRepository boardRepository;

    // 전체 가입자 수 조회
    public int getTotalUserCount() {
        return memberRepository.countTotalMembers();
    }

    // 월별 게시글 통계 조회
    public Map<String, Object> getMonthlyPostStats() {
        List<Object[]> result = boardRepository.countMonthlyPosts();

        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();

        for (Object[] row : result) {
            Integer month = (Integer) row[0];
            Long count = (Long) row[1];
            labels.add(month + "월");
            data.add(count);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("labels", labels);
        response.put("data", data);

        return response;
    }

    public List<Member> getRecentMembers() {
        return memberRepository.findTop5ByOrderByMemberJoindateDesc();
    }

    public Map<String, Object> getDailyPostStats() {
        List<Object[]> result = boardRepository.countDailyPosts();

        List<String> labels = new ArrayList<>();
        List<Long> data = new ArrayList<>();

        for (Object[] row : result) {
            LocalDate date = ((java.sql.Date) row[0]).toLocalDate();
            Long count = (Long) row[1];
            labels.add(date.toString());
            data.add(count);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("labels", labels);
        response.put("data", data);
        return response;
    }

    /**
     * 최근 10분 이내 로그인한 사용자 수 반환
     */
    public int getRecentlyLoggedInUserCount() {
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        return (int) memberRepository.countLoggedInUsersSince(tenMinutesAgo);
    }

    public int getTotalPostCount() {
        return boardRepository.countTotalPosts(); // 👉 리포지토리 호출
    }

}
