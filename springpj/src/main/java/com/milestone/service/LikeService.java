package com.milestone.service;

import com.milestone.entity.Board;
import com.milestone.entity.Likes;
import com.milestone.entity.Member;
import com.milestone.entity.Reply;
import com.milestone.repository.BoardRepository;
import com.milestone.repository.LikeRepository;
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
public class LikeService {

    private static final Logger logger = LoggerFactory.getLogger(LikeService.class);
    private final LikeRepository likeRepository;
    private final MemberRepository memberRepository;
    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;
    private final NotificationService notificationService;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 게시물 좋아요
     */
    @Transactional
    public void likeBoard(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 이미 좋아요한 경우 체크
        boolean alreadyLiked = likeRepository.existsByMemberAndLikeTypeAndLikeTypeNo(member, "board", boardNo);
        if (alreadyLiked) {
            throw new IllegalArgumentException("이미 좋아요한 게시물입니다.");
        }

        // 좋아요 생성
        Likes like = Likes.builder()
                .member(member)
                .likeType("board")
                .likeTypeNo(boardNo)
                .build();

        likeRepository.save(like);

        // 게시물 좋아요 수 증가
        board.setBoardLike(board.getBoardLike() + 1);
        boardRepository.save(board);

        // 본인 게시물이 아닌 경우에만 알림 생성
        if (!board.getMember().getMemberNo().equals(memberNo)) {
            notificationService.createLikeNotification(member, board.getMember(), "board", boardNo);
        }
    }

    /**
     * 게시물 좋아요 취소
     */
    @Transactional
    public void unlikeBoard(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 좋아요 조회
        Likes like = likeRepository.findByMemberAndLikeTypeAndLikeTypeNo(member, "board", boardNo)
                .orElseThrow(() -> new IllegalArgumentException("좋아요한 기록이 없습니다."));

        // 좋아요 삭제
        likeRepository.delete(like);

        // 게시물 좋아요 수 감소
        if (board.getBoardLike() > 0) {
            board.setBoardLike(board.getBoardLike() - 1);
            boardRepository.save(board);
        }
    }

    /**
     * 댓글 좋아요
     */
    @Transactional
    public void likeReply(Long replyNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Reply reply = replyRepository.findById(replyNo)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 이미 좋아요한 경우 체크
        boolean alreadyLiked = likeRepository.existsByMemberAndLikeTypeAndLikeTypeNo(member, "reply", replyNo);
        if (alreadyLiked) {
            throw new IllegalArgumentException("이미 좋아요한 댓글입니다.");
        }

        // 좋아요 생성
        Likes like = Likes.builder()
                .member(member)
                .likeType("reply")
                .likeTypeNo(replyNo)
                .build();

        likeRepository.save(like);

        // 댓글 좋아요 수 증가
        reply.setReplyLike(reply.getReplyLike() + 1);
        replyRepository.save(reply);

        // 본인 댓글이 아닌 경우에만 알림 생성
        if (!reply.getMember().getMemberNo().equals(memberNo)) {
            notificationService.createLikeNotification(member, reply.getMember(), "reply", replyNo);
        }
    }

    /**
     * 댓글 좋아요 취소
     */
    @Transactional
    public void unlikeReply(Long replyNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Reply reply = replyRepository.findById(replyNo)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 좋아요 조회
        Likes like = likeRepository.findByMemberAndLikeTypeAndLikeTypeNo(member, "reply", replyNo)
                .orElseThrow(() -> new IllegalArgumentException("좋아요한 기록이 없습니다."));

        // 좋아요 삭제
        likeRepository.delete(like);

        // 댓글 좋아요 수 감소
        if (reply.getReplyLike() > 0) {
            reply.setReplyLike(reply.getReplyLike() - 1);
            replyRepository.save(reply);
        }
    }

    /**
     * 현재 로그인한 사용자가 좋아요한 게시물 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Long> getLikedBoardsByMember(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 사용자가 좋아요한 게시물 ID 목록 조회
        List<Likes> likes = likeRepository.findByMemberAndLikeType(member, "board");
        return likes.stream()
                .map(Likes::getLikeTypeNo)
                .collect(Collectors.toList());
    }

    /**
     * 특정 게시물에 대해 현재 로그인한 사용자의 좋아요 상태 확인
     */
    @Transactional(readOnly = true)
    public boolean checkBoardLikeStatus(Long boardNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            return false;
        }

        return likeRepository.existsByMemberMemberNoAndLikeTypeAndLikeTypeNo(memberNo, "board", boardNo);
    }

    /**
     * 특정 댓글에 대해 현재 로그인한 사용자의 좋아요 상태 확인
     */
    @Transactional(readOnly = true)
    public boolean checkReplyLikeStatus(Long replyNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            return false;
        }

        return likeRepository.existsByMemberMemberNoAndLikeTypeAndLikeTypeNo(memberNo, "reply", replyNo);
    }
}