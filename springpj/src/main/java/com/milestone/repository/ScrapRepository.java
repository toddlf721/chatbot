package com.milestone.repository;

import com.milestone.entity.Board;
import com.milestone.entity.Member;
import com.milestone.entity.Scrap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScrapRepository extends JpaRepository<Scrap, Long> {

    // 회원별 스크랩 목록 조회
    List<Scrap> findByMember(Member member);

    // 게시물별 스크랩 목록 조회
    List<Scrap> findByBoard(Board board);

    // 회원과 게시물로 스크랩 조회
    Optional<Scrap> findByMemberAndBoard(Member member, Board board);

    // 회원과 게시물로 스크랩 존재 여부 확인
    boolean existsByMemberAndBoard(Member member, Board board);

    // 회원ID와 게시물ID로 스크랩 존재 여부 확인
    boolean existsByMemberMemberNoAndBoardBoardNo(Long memberNo, Long boardNo);

    // 회원별 스크랩 수 조회
    long countByMember(Member member);

    // 게시물별 스크랩 수 조회
    long countByBoard(Board board);

    // 회원별 스크랩 삭제
    void deleteByMember(Member member);

    // 게시물별 스크랩 삭제
    void deleteByBoard(Board board);
}