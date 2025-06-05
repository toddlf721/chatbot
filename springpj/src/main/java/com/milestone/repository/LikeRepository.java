package com.milestone.repository;

import com.milestone.entity.Likes;
import com.milestone.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Likes, Long> {

    // 특정 멤버와 타입에 따른 좋아요 검색
    List<Likes> findByMemberAndLikeType(Member member, String likeType);

    // 멤버, 타입, 타입번호에 따른 좋아요 검색
    Optional<Likes> findByMemberAndLikeTypeAndLikeTypeNo(Member member, String likeType, Long likeTypeNo);

    // 멤버, 타입, 타입번호에 따른 좋아요 존재 여부 확인
    boolean existsByMemberAndLikeTypeAndLikeTypeNo(Member member, String likeType, Long likeTypeNo);

    // 멤버ID, 타입, 타입번호에 따른 좋아요 존재 여부 확인
    boolean existsByMemberMemberNoAndLikeTypeAndLikeTypeNo(Long memberNo, String likeType, Long likeTypeNo);

    // 타입과 타입번호에 따른 좋아요 목록 조회
    List<Likes> findByLikeTypeAndLikeTypeNo(String likeType, Long likeTypeNo);

    // 타입과 타입번호에 따른 좋아요 수 조회
    long countByLikeTypeAndLikeTypeNo(String likeType, Long likeTypeNo);

    // 멤버별 특정 타입의 좋아요 목록 삭제
    void deleteByMemberAndLikeType(Member member, String likeType);

    void deleteByMember(Member member);

    List<Likes> findByMember(Member member);
}