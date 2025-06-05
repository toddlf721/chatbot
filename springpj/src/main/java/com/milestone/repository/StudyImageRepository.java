package com.milestone.repository;

import com.milestone.entity.StudyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyImageRepository extends JpaRepository<StudyImage, Long> {

    // 게시물별 이미지 조회 (정렬: 이미지 순서)
    List<StudyImage> findByBoardBoardNoOrderByStudyImageOrderAsc(Long boardNo);

    // 세션 ID로 연결되지 않은 이미지 조회
    List<StudyImage> findBySessionIdAndBoardIsNull(String sessionId);

    // 세션 ID로 이미지 조회
    List<StudyImage> findBySessionIdOrderByStudyImageOrderAsc(String sessionId);

    // 세션 ID로 이미지 삭제
    void deleteBySessionId(String sessionId);

    // 파일명으로 이미지 조회
    Optional<StudyImage> findByStudyImageName(String imageName);

    // 게시물 ID로 이미지 삭제
    void deleteByBoardBoardNo(Long boardNo);
}