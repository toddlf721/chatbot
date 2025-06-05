package com.milestone.repository;

import com.milestone.entity.BoardImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardImageRepository extends JpaRepository<BoardImage, Long> {

    // 게시물별 이미지 조회 (정렬: 이미지 순서)
    List<BoardImage> findByBoardBoardNoOrderByBoardImageOrderAsc(Long boardNo);

    // 게시물별 이미지 삭제
    void deleteByBoardBoardNo(Long boardNo);

    // 파일명으로 이미지 조회
    Optional<BoardImage> findByBoardImageName(String imageName);
}