package com.milestone.repository;

import com.milestone.entity.Reply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Long> {

    // 게시물별 댓글 조회 (활성 상태만, 작성일 오름차순)
    List<Reply> findByBoardBoardNoAndReplyStatusOrderByReplyInputdateAsc(Long boardNo, String replyStatus);

    // 부모 댓글별 답글 조회
    List<Reply> findByReplyParentReplyNo(Long replyParentNo);

    // 회원별 댓글 조회
    List<Reply> findByMemberMemberNoOrderByReplyInputdateDesc(Long memberNo);

    // 게시물별 댓글 수 조회
    long countByBoardBoardNoAndReplyStatus(Long boardNo, String replyStatus);
}