package com.milestone.service;

import com.milestone.dto.NoticeDto;
import com.milestone.entity.Member;
import com.milestone.entity.Notice;
import com.milestone.repository.MemberRepository;
import com.milestone.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final NoticeRepository noticeRepository;
    private final MemberRepository memberRepository;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 좋아요 알림 생성
     */
    @Transactional
    public void createLikeNotification(Member sender, Member receiver, String likeType, Long likeTypeNo) {
        // 자신의 게시물에 좋아요를 누른 경우 알림 생성하지 않음
        if (sender.getMemberNo().equals(receiver.getMemberNo())) {
            logger.debug("자신의 게시물에 좋아요를 누른 경우 알림 생성하지 않음 - 사용자: {}", sender.getMemberNo());
            return;
        }

        String message = "";
        if ("board".equals(likeType)) {
            message = sender.getMemberNickname() + "님이 회원님의 게시물을 좋아합니다.";
        } else if ("reply".equals(likeType)) {
            message = sender.getMemberNickname() + "님이 회원님의 댓글을 좋아합니다.";
        }

        Notice notification = Notice.builder()
                .member(receiver)
                .noticeSender(sender.getMemberNo())
                .noticeType("likes")
                .noticeTypeNo(likeTypeNo)
                .noticeMessage(message)
                .noticeRead(false)
                .build();

        noticeRepository.save(notification);
        logger.info("좋아요 알림 생성 - 발신자: {}, 수신자: {}, 타입: {}", sender.getMemberNo(), receiver.getMemberNo(), likeType);
    }

    /**
     * 댓글 알림 생성
     */
    @Transactional
    public void createReplyNotification(Member sender, Member receiver, Long boardNo, Long replyNo) {
        // 자신의 게시물에 댓글을 작성한 경우 알림 생성하지 않음
        if (sender.getMemberNo().equals(receiver.getMemberNo())) {
            logger.debug("자신의 게시물에 댓글을 작성한 경우 알림 생성하지 않음 - 사용자: {}", sender.getMemberNo());
            return;
        }

        String message = sender.getMemberNickname() + "님이 회원님의 게시물에 댓글을 남겼습니다.";

        Notice notification = Notice.builder()
                .member(receiver)
                .noticeSender(sender.getMemberNo())
                .noticeType("reply")
                .noticeTypeNo(replyNo)
                .noticeMessage(message)
                .noticeRead(false)
                .build();

        noticeRepository.save(notification);
        logger.info("댓글 알림 생성 - 발신자: {}, 수신자: {}, 게시물: {}", sender.getMemberNo(), receiver.getMemberNo(), boardNo);
    }

    /**
     * 팔로우 알림 생성
     */
    @Transactional
    public void createFollowNotification(Member sender, Member receiver) {
        // 자기 자신을 팔로우하는 경우 알림 생성하지 않음 (이런 경우가 없어야 하지만 안전장치로)
        if (sender.getMemberNo().equals(receiver.getMemberNo())) {
            logger.debug("자기 자신을 팔로우하는 경우 알림 생성하지 않음 - 사용자: {}", sender.getMemberNo());
            return;
        }

        String message = sender.getMemberNickname() + "님이 회원님을 팔로우하기 시작했습니다.";

        Notice notification = Notice.builder()
                .member(receiver)
                .noticeSender(sender.getMemberNo())
                .noticeType("follow")
                .noticeTypeNo(sender.getMemberNo())
                .noticeMessage(message)
                .noticeRead(false)
                .build();

        noticeRepository.save(notification);
        logger.info("팔로우 알림 생성 - 발신자: {}, 수신자: {}", sender.getMemberNo(), receiver.getMemberNo());
    }

    /**
     * 멘션 알림 생성
     */
    @Transactional
    public void createMentionNotification(Member sender, Member receiver, String mentionType, Long mentionTypeNo) {
        // 자기 자신을 멘션하는 경우 알림 생성하지 않음
        if (sender.getMemberNo().equals(receiver.getMemberNo())) {
            logger.debug("자기 자신을 멘션하는 경우 알림 생성하지 않음 - 사용자: {}", sender.getMemberNo());
            return;
        }

        String message = "";
        if ("board".equals(mentionType)) {
            message = sender.getMemberNickname() + "님이 게시물에서 회원님을 언급했습니다.";
        } else if ("reply".equals(mentionType)) {
            message = sender.getMemberNickname() + "님이 댓글에서 회원님을 언급했습니다.";
        }

        Notice notification = Notice.builder()
                .member(receiver)
                .noticeSender(sender.getMemberNo())
                .noticeType("mention")
                .noticeTypeNo(mentionTypeNo)
                .noticeMessage(message)
                .noticeRead(false)
                .build();

        noticeRepository.save(notification);
        logger.info("멘션 알림 생성 - 발신자: {}, 수신자: {}, 타입: {}", sender.getMemberNo(), receiver.getMemberNo(), mentionType);
    }

    /**
     * 현재 로그인한 사용자의 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Notice> getNotifications(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        List<Notice> noticelist = noticeRepository.findByMemberMemberNoOrderByNoticeInputdateDesc(memberNo);

        return noticelist;
    }

    /**
     * 알림 읽음 처리
     */
    @Transactional
    public void markNotificationAsRead(Long noticeNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Notice notification = noticeRepository.findById(noticeNo)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        // 알림 소유자 확인
        if (!notification.getMember().getMemberNo().equals(memberNo)) {
            throw new IllegalArgumentException("알림을 수정할 권한이 없습니다.");
        }

        notification.setNoticeRead(true);
        noticeRepository.save(notification);
    }

    /**
     * 알림 삭제
     */
    @Transactional
    public void deleteNotification(Long noticeNo, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Notice notification = noticeRepository.findById(noticeNo)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        // 알림 소유자 확인
        if (!notification.getMember().getMemberNo().equals(memberNo)) {
            throw new IllegalArgumentException("알림을 삭제할 권한이 없습니다.");
        }

        noticeRepository.delete(notification);
    }

    /**
     * 사용자의 모든 알림 읽음 처리
     */
    @Transactional
    public void markAllNotificationsAsRead(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        List<Notice> unreadNotifications = noticeRepository.findByMemberMemberNoAndNoticeReadFalse(memberNo);
        unreadNotifications.forEach(notification -> notification.setNoticeRead(true));
        noticeRepository.saveAll(unreadNotifications);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(Long memberNo) {
        if (memberNo == null) {
            throw new IllegalArgumentException("회원 ID가 유효하지 않습니다.");
        }

        return noticeRepository.countByMemberMemberNoAndNoticeReadFalse(memberNo);
    }
}