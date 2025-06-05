package com.milestone.repository;

import com.milestone.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    // 게시물 최신순 정렬 조회
    List<Board> findAllByOrderByBoardInputdateDesc();

    // 타입별 게시물 조회
    List<Board> findByBoardTypeOrderByBoardInputdateDesc(String boardType);

    // 회원별 게시물 조회
    List<Board> findByMemberMemberNoOrderByBoardInputdateDesc(Long memberNo);

    // 카테고리별 게시물 조회
    List<Board> findByBoardCategoryOrderByBoardInputdateDesc(String category);

    // 공개 범위별 게시물 조회
    List<Board> findByBoardVisibleOrderByBoardInputdateDesc(String visible);

    // 멤버와 타입으로 게시물 조회
    List<Board> findByMemberMemberNoAndBoardTypeOrderByBoardInputdateDesc(Long memberNo, String boardType);

    // ID 목록으로 게시물 조회
    List<Board> findByBoardNoIn(List<Long> boardIds);

    Board findByBoardNo(Long boardNo);


    // 📌 월별 게시글 수를 집계하는 쿼리
    // - FUNCTION('MONTH', b.boardInputdate): 게시글의 등록일(boardInputdate)에서 월만 추출
    // - COUNT(b): 해당 월에 작성된 게시글 수
    // - GROUP BY month: 월 기준으로 그룹핑
    // - ORDER BY month: 월 순서대로 정렬
    @Query("SELECT FUNCTION('MONTH', b.boardInputdate) AS month, COUNT(b) FROM Board b GROUP BY month ORDER BY month")
    List<Object[]> countMonthlyPosts();

    // 📌 일별 게시글 수를 집계하는 쿼리
    // - FUNCTION('DATE', b.boardInputdate): 날짜만 추출
    @Query("SELECT FUNCTION('DATE', b.boardInputdate) AS day, COUNT(b) FROM Board b GROUP BY day ORDER BY day")
    List<Object[]> countDailyPosts();

    @Query("SELECT COUNT(b) FROM Board b")
    int countTotalPosts();

    /**
     * 스터디 타입 게시물만 조회
     */
    @Query("SELECT b FROM Board b WHERE b.boardType = 'study' ORDER BY b.boardInputdate DESC")
    List<Board> findStudyBoardsOrderByBoardInputdateDesc();
}