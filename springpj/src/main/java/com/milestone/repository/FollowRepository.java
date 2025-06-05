package com.milestone.repository;

import com.milestone.entity.Follow;
import com.milestone.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    // 내가 팔로우하는 사람들 조회 (팔로잉)
    List<Follow> findByFollowerAndFollowStatus(Member follower, String status);

    // 나를 팔로우하는 사람들 조회 (팔로워)
    List<Follow> findByFollowMemberAndFollowStatus(Member followMember, String status);

    // 특정 팔로우 관계 조회
    Optional<Follow> findByFollowerAndFollowMember(Member follower, Member followMember);

    // 팔로우 관계 존재 여부 확인
    boolean existsByFollowerAndFollowMember(Member follower, Member followMember);

    // 팔로우 관계 존재 여부 확인 (ID 기준)
    boolean existsByFollowerMemberNoAndFollowMemberMemberNo(Long followerNo, Long followMemberNo);

    // 팔로우 상태에 따른 관계 존재 여부 확인
    boolean existsByFollowerMemberNoAndFollowMemberMemberNoAndFollowStatus(Long followerNo, Long followMemberNo, String status);

    // 팔로워 수 조회
    long countByFollowMemberAndFollowStatus(Member followMember, String status);

    // 팔로잉 수 조회
    long countByFollowerAndFollowStatus(Member follower, String status);

    // 회원 기준 팔로우 삭제
    void deleteByFollowerOrFollowMember(Member follower, Member followMember);

    boolean existsByFollowMemberMemberNoAndFollowerMemberNoAndFollowStatus(Long memberNo, Long currentMemberNo, String accepted);
}