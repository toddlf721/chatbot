package com.milestone.repository;

import com.milestone.dto.MemberSearchDto;
import com.milestone.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

        // 이메일로 회원 찾기
        Optional<Member> findByMemberEmail(String memberEmail);

        // 닉네임으로 회원 찾기
        Optional<Member> findByMemberNickname(String memberNickname);

        // 이메일 존재 여부 확인
        boolean existsByMemberEmail(String memberEmail);

        // 닉네임 존재 여부 확인
        boolean existsByMemberNickname(String memberNickname);

        // 추천 사용자 조회 (팔로우하지 않은 활성 사용자들 중 10명)
        List<Member> findTop10ByMemberNoNotInAndMemberNoNotAndMemberStatus(List<Long> followingIds, Long memberNo,
                        String memberStatus);

        // 닉네임과 상태로 회원 찾기
        Optional<Member> findByMemberNicknameAndMemberStatus(String memberNickname, String memberStatus);

        // 전체 회원 수 카운트 (관리자 통계용)
        @Query("SELECT COUNT(m) FROM Member m")
        int countTotalMembers();

        Optional<List<Member>> findByMemberNicknameContainingAndMemberVisibleAndMemberStatusOrderByMemberLastloginDesc(
                        String query, String aPublic, String active);

        // 📌 최근 가입 회원 5명 조회 (관리자 대시보드용)
        List<Member> findTop5ByOrderByMemberJoindateDesc();

        // 📌 10분 이내 로그인한 사용자 수 (관리자 대시보드용)
        @Query("SELECT COUNT(m) FROM Member m WHERE m.memberLastlogin IS NOT NULL AND m.memberLastlogin >= :since")
        long countLoggedInUsersSince(java.time.LocalDateTime since);

        Member findByMemberNo(Long memberNo);


        boolean existsByMemberNameAndMemberEmail(String memberName, String memberEmail);

        @Modifying
        @Transactional
        @Query("UPDATE Member m SET m.memberPassword = :password WHERE m.memberNo = :id")
        int updatePasswordById(@Param("password") String password, @Param("id") Long id);
}