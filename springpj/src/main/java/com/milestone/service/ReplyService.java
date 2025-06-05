package com.milestone.service;

import com.milestone.dto.ReplyRequest;
import com.milestone.dto.ReplyResponse;
import com.milestone.entity.Board;
import com.milestone.entity.Member;
import com.milestone.entity.Reply;
import com.milestone.repository.BoardRepository;
import com.milestone.repository.MemberRepository;
import com.milestone.repository.ReplyRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReplyService {

    private static final Logger logger = LoggerFactory.getLogger(ReplyService.class);
    private final ReplyRepository replyRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 게시물에 대한 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ReplyResponse> getRepliesByBoard(Long boardNo) {
        List<Reply> replies = replyRepository.findByBoardBoardNoAndReplyStatusOrderByReplyInputdateAsc(boardNo,
                "active");
        return replies.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 댓글 작성
     */
    @Transactional
    public ReplyResponse createReply(ReplyRequest request, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 🔒 정지 상태 검사 추가
        if ("suspended".equals(member.getMemberStatus())) {
            throw new IllegalStateException("정지된 회원은 댓글을 작성할 수 없습니다.");
        }

        Board board = boardRepository.findById(request.getBoardNo())
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 부모 댓글 설정 (대댓글인 경우)
        Reply parentReply = null;
        if (request.getReplyParentNo() != null) {
            parentReply = replyRepository.findById(request.getReplyParentNo())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        // 댓글 엔티티 생성
        Reply reply = Reply.builder()
                .member(member)
                .board(board)
                .replyParent(parentReply)
                .replyContent(request.getReplyContent())
                .replyLike(0L)
                .replyStatus("active")
                .build();

        Reply savedReply = replyRepository.save(reply);

        // 본인 게시물이 아닌 경우에만 알림 생성
        if (!board.getMember().getMemberNo().equals(memberNo)) {
            notificationService.createReplyNotification(member, board.getMember(), board.getBoardNo(),
                    savedReply.getReplyNo());
        }

        // 부모 댓글이 있는 경우 대댓글 알림 생성
        if (parentReply != null && !parentReply.getMember().getMemberNo().equals(memberNo)) {
            notificationService.createReplyNotification(member, parentReply.getMember(), board.getBoardNo(),
                    savedReply.getReplyNo());
        }

        return convertToDto(savedReply);
    }

    /**
     * 댓글 수정
     */
    @Transactional
    public ReplyResponse updateReply(Long replyNo, ReplyRequest request, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Reply reply = replyRepository.findById(replyNo)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 댓글 작성자 확인
        if (!reply.getMember().getMemberNo().equals(memberNo)) {
            throw new IllegalArgumentException("댓글을 수정할 권한이 없습니다.");
        }

        // 댓글 내용 업데이트
        reply.setReplyContent(request.getReplyContent());

        Reply updatedReply = replyRepository.save(reply);
        return convertToDto(updatedReply);
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteReply(Long replyNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Reply reply = replyRepository.findById(replyNo)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 댓글 작성자 확인
        if (!reply.getMember().getMemberNo().equals(memberNo)) {
            throw new IllegalArgumentException("댓글을 삭제할 권한이 없습니다.");
        }

        // 답글이 있는 경우 상태만 "deleted"로 변경
        List<Reply> childReplies = replyRepository.findByReplyParentReplyNo(replyNo);
        if (!childReplies.isEmpty()) {
            reply.setReplyStatus("deleted");
            replyRepository.save(reply);
        } else {
            replyRepository.delete(reply);
        }
    }

    /**
     * 댓글 엔티티를 DTO로 변환
     */
    private ReplyResponse convertToDto(Reply reply) {
        return ReplyResponse.builder()
                .replyNo(reply.getReplyNo())
                .memberNo(reply.getMember().getMemberNo())
                .memberNickname(reply.getMember().getMemberNickname())
                .boardNo(reply.getBoard().getBoardNo())
                .replyParentNo(reply.getReplyParent() != null ? reply.getReplyParent().getReplyNo() : null)
                .replyContent(reply.getReplyContent())
                .replyLike(reply.getReplyLike())
                .replyStatus(reply.getReplyStatus())
                .replyInputdate(reply.getReplyInputdate())
                .replyUpdatedate(reply.getReplyUpdatedate())
                .build();
    }
}