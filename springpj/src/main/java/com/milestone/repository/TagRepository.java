package com.milestone.repository;

import com.milestone.dto.TagBoardCountDto;
import com.milestone.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    // 태그명으로 태그 조회
    // Optional<Tag> findByTagName(String tagName);

    // 태그명 존재 여부 확인
    boolean existsByTagName(String tagName);

    // 게시물별 태그 삭제
    void deleteByBoardBoardNo(Long boardNo);

    // 태그명으로 태그 목록 조회
    List<Tag> findByTagName(String tagName);

    @Query("SELECT new com.milestone.dto.TagBoardCountDto(t.tagName, COUNT(DISTINCT t.board.boardNo)) " +
            "FROM Tag t " +
            "WHERE t.tagName LIKE %:query% " +
            "GROUP BY t.tagName " +
            "ORDER BY COUNT(DISTINCT t.board.boardNo) DESC")
    List<TagBoardCountDto> findTagNameWithBoardCount(@Param("query") String query);


    int countByTagName(String tagName);


    @Query("SELECT t FROM Tag t WHERE t.tagName = :tagName")
    List<Tag> findTagsByTagName(@Param("tagName") String tagName);

    List<Tag> findByBoardBoardNo(Long boardNo);

    boolean existsByBoardBoardNoAndTagName(Long boardNo, String normalizedTagName);
}