package com.milestone.repository;

import com.milestone.entity.BoardTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardTagRepository extends JpaRepository<BoardTag, Long> {

    // 게시물별 태그 조회
    List<BoardTag> findByBoardBoardNo(Long boardNo);

    // 태그명으로 게시물 태그 조회
    List<BoardTag> findByTagName(String tagName);

    // 게시물별 태그 삭제
    void deleteByBoardBoardNo(Long boardNo);

    // 특정 게시물의 특정 태그 삭제
    void deleteByBoardBoardNoAndTagName(Long boardNo, String tagName);

    // 태그명별 게시물 태그 삭제
    void deleteByTagName(String tagName);

    // 가장 많이 사용된 태그 조회
    @Query(value = "SELECT tag_name FROM board_tag GROUP BY tag_name ORDER BY COUNT(tag_name) DESC LIMIT :limit", nativeQuery = true)
    List<String> findMostUsedTags(@Param("limit") int limit);

    // 특정 게시물에 대한 태그 존재 여부 확인
    boolean existsByBoardBoardNoAndTagName(Long boardNo, String tagName);

    // 특정 태그를 포함하는 게시물 ID 목록 조회
    @Query(value = "SELECT DISTINCT board_no FROM board_tag WHERE tag_name = :tagName", nativeQuery = true)
    List<Long> findBoardIdsByTagName(@Param("tagName") String tagName);

    // 특정 태그 목록에 해당하는 게시물 ID 조회
    @Query(value = "SELECT DISTINCT bt.board_no FROM board_tag bt WHERE bt.tag_name IN :tagNames GROUP BY bt.board_no", nativeQuery = true)
    List<Long> findBoardIdsByTagNames(@Param("tagNames") List<String> tagNames);
}