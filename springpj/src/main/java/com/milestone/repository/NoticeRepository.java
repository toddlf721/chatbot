package com.milestone.repository;

import com.milestone.entity.Member;
import com.milestone.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 회원별 알림 목록 조회 (최신순)
    List<Notice> findByMemberMemberNoOrderByNoticeInputdateDesc(Long memberNo);

    // 회원별 읽지 않은 알림 목록 조회
    List<Notice> findByMemberMemberNoAndNoticeReadFalse(Long memberNo);

    // 회원별 읽지 않은 알림 수 조회
    long countByMemberMemberNoAndNoticeReadFalse(Long memberNo);

    // 알림 타입별 목록 조회
    List<Notice> findByMemberAndNoticeType(Member member, String noticeType);

    // 특정 회원이 받은 알림 삭제
    void deleteByMember(Member member);

    // 특정 회원이 보낸 알림 삭제
    void deleteByNoticeSender(Long noticeSender);
}