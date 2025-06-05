package com.milestone.service;

import com.milestone.dto.MemberFollowDto;
import com.milestone.entity.Follow;
import com.milestone.entity.Member;
import com.milestone.repository.FollowRepository;
import com.milestone.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private static final Logger logger = LoggerFactory.getLogger(FollowService.class);
    private final FollowRepository followRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";

    /**
     * 사용자 팔로우
     */
    @Transactional
    public void followUser(String username, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member follower = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Member following = memberRepository.findByMemberNicknameAndMemberStatus(username, "active")
                .orElseThrow(() -> new IllegalArgumentException("팔로우할 사용자를 찾을 수 없거나 탈퇴한 회원입니다."));

        // 자기 자신을 팔로우할 수 없음
        if (follower.getMemberNo().equals(following.getMemberNo())) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        // 이미 팔로우 중인지 확인
        boolean alreadyFollowing = followRepository.existsByFollowerMemberNoAndFollowMemberMemberNo(follower.getMemberNo(), following.getMemberNo());
        if (alreadyFollowing) {
            throw new IllegalArgumentException("이미 팔로우한 사용자입니다.");
        }

        // 팔로우 생성
        Follow follow = Follow.builder()
                .follower(follower)
                .followMember(following)
                .followStatus("accepted") // 기본적으로 승인 상태
                .build();

        followRepository.save(follow);

        // 알림 생성
        notificationService.createFollowNotification(follower, following);

        logger.info("사용자 팔로우 완료 - 팔로워: {}, 팔로잉: {}", follower.getMemberNickname(), following.getMemberNickname());
    }

    /**
     * 사용자 언팔로우
     */
    @Transactional
    public void unfollowUser(String username, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member follower = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        Member following = memberRepository.findByMemberNickname(username)
                .orElseThrow(() -> new IllegalArgumentException("언팔로우할 사용자를 찾을 수 없습니다."));

        // 팔로우 관계 조회
        Follow follow = followRepository.findByFollowerAndFollowMember(follower, following)
                .orElseThrow(() -> new IllegalArgumentException("팔로우한 기록이 없습니다."));

        // 팔로우 삭제
        followRepository.delete(follow);

        logger.info("사용자 언팔로우 완료 - 팔로워: {}, 팔로잉: {}", follower.getMemberNickname(), following.getMemberNickname());
    }

    /**
     * 특정 사용자의 팔로워 목록 조회 (나를 팔로우하는 사람들)
     */
    @Transactional(readOnly = true)
    public List<MemberFollowDto> getFollowers(String username) {
        Member member = memberRepository.findByMemberNickname(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 팔로워 목록 조회
        List<Follow> followers = followRepository.findByFollowMemberAndFollowStatus(member, "accepted");
        return followers.stream()
                .map(follow -> {
                    Member follower = follow.getFollower();
                    return MemberFollowDto.builder()
                            .memberNo(follower.getMemberNo())
                            .memberNickname(follower.getMemberNickname())
                            .memberName(follower.getMemberName())
                            .memberPhoto(follower.getMemberPhoto())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 특정 사용자의 팔로잉 목록 조회 (내가 팔로우하는 사람들)
     */
    @Transactional(readOnly = true)
    public List<MemberFollowDto> getFollowing(String username) {
        Member member = memberRepository.findByMemberNickname(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 팔로잉 목록 조회
        List<Follow> following = followRepository.findByFollowerAndFollowStatus(member, "accepted");
        return following.stream()
                .map(follow -> {
                    Member followMember = follow.getFollowMember();
                    return MemberFollowDto.builder()
                            .memberNo(followMember.getMemberNo())
                            .memberNickname(followMember.getMemberNickname())
                            .memberName(followMember.getMemberName())
                            .memberPhoto(followMember.getMemberPhoto())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 현재 로그인한 사용자의 팔로잉 목록 조회
     */
    @Transactional(readOnly = true)
    public List<String> getMyFollowing(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 팔로잉 목록 조회
        List<Follow> following = followRepository.findByFollowerAndFollowStatus(member, "accepted");
        return following.stream()
                .map(follow -> follow.getFollowMember().getMemberNickname())
                .collect(Collectors.toList());
    }

    /**
     * 팔로우 상태 확인
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(String username, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            return false;
        }

        Member following = memberRepository.findByMemberNickname(username)
                .orElseThrow(() -> new IllegalArgumentException("확인할 사용자를 찾을 수 없습니다."));

        return followRepository.existsByFollowerMemberNoAndFollowMemberMemberNoAndFollowStatus(
                memberNo, following.getMemberNo(), "accepted");
    }

    /**
     * 추천 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSuggestedUsers(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member currentMember = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 이미 팔로우한 사용자 목록
        List<Long> followingIds = followRepository.findByFollowerAndFollowStatus(currentMember, "accepted")
                .stream()
                .map(follow -> follow.getFollowMember().getMemberNo())
                .collect(Collectors.toList());

        // 자신을 제외하고 팔로우하지 않은 사용자 목록
        List<Member> suggestedMembers = memberRepository.findTop10ByMemberNoNotInAndMemberNoNotAndMemberStatus(
                followingIds.isEmpty() ? Collections.singletonList(-1L) : followingIds,
                memberNo,
                "active");

        // 반환 데이터 구성
        List<Map<String, Object>> result = new ArrayList<>();
        for (Member member : suggestedMembers) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("memberNo", member.getMemberNo());
            userInfo.put("memberNickname", member.getMemberNickname());
            userInfo.put("memberName", member.getMemberName());
            userInfo.put("memberPhoto", member.getMemberPhoto());
            userInfo.put("memberIntroduce", member.getMemberIntroduce());
            userInfo.put("memberStatus", member.getMemberStatus());
            userInfo.put("isFollowed", false); // 추천 목록이므로 팔로우되지 않은 상태

            result.add(userInfo);
        }

        return result;
    }
}