package com.milestone.service;

import com.milestone.dto.MemberJoinRequest;
import com.milestone.dto.MemberLoginRequest;
import com.milestone.dto.MemberResponse;
import com.milestone.dto.MemberUpdateRequest;
import com.milestone.entity.Board;
import com.milestone.entity.Likes;
import com.milestone.entity.Member;
import com.milestone.entity.Reply;
import com.milestone.repository.*;
import com.milestone.util.PasswordUtils;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private static final Logger logger = LoggerFactory.getLogger(MemberService.class);
    private final MemberRepository memberRepository;
    private final BoardRepository boardRepository;
    private final BoardImageRepository boardImageRepository;
    private final LikeRepository likeRepository;
    private final ScrapRepository scrapRepository;
    private final ReplyRepository replyRepository;
    private final FollowRepository followRepository;
    private final TagRepository tagRepository;
    private static final String SESSION_KEY = "LOGGED_IN_MEMBER";
    private static final String DEFAULT_PROFILE_IMAGE_PATH = "/icon/profileimage.png";

    /**
     * 회원 가입
     */

    public boolean isNicknameExists(String nickname) {
        return memberRepository.existsByMemberNickname(nickname);
    }

    public boolean isEmailExists(String email) {
        return memberRepository.existsByMemberEmail(email);
    }
    @Transactional
    public MemberResponse join(MemberJoinRequest request) {
    
        try {
            // 비밀번호 암호화
            String hashedPassword = PasswordUtils.hashPassword(request.getMemberPassword());
            System.out.println("회원가입 여기임?");
            // Member 엔티티 생성 및 저장
            Member member = Member.builder()
                    .memberName(request.getMemberName())
                    .memberNickname(request.getMemberNickname())
                    .memberEmail(request.getMemberEmail())
                    .memberPassword(hashedPassword)
                    .memberPhone(request.getMemberPhone())
                    .memberPhoto(DEFAULT_PROFILE_IMAGE_PATH) // 기본 프로필 이미지 설정
                    .memberIntroduce(request.getMemberIntroduce())
                    .memberVisible(request.getMemberVisible())
                    .memberStatus("active")
                    .build();

            Member savedMember = memberRepository.save(member);
            logger.info("회원가입 성공: ID={}", savedMember.getMemberNo());

            // 저장된 엔티티를 DTO로 변환하여 반환
            return MemberResponse.fromEntity(savedMember);
        } catch (Exception e) {
            logger.error("회원가입 실패: {}", e.getMessage(), e);
            throw new RuntimeException("회원가입 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 로그인
     */
    @Transactional
    public MemberResponse login(MemberLoginRequest request, HttpSession session) {
        logger.info("로그인 시도: {}", request.getMemberEmail());

        try {
            // 이메일로 회원 조회
            Member member = memberRepository.findByMemberEmail(request.getMemberEmail())
                    .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

            // 회원 상태 확인
            if ("inactive".equals(member.getMemberStatus())) {
                throw new IllegalArgumentException("탈퇴한 회원입니다.");
            }

            // 비밀번호 검증
            if (!PasswordUtils.verifyPassword(request.getMemberPassword(), member.getMemberPassword())) {
                logger.warn("비밀번호 불일치: {}", request.getMemberEmail());
                throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
            }

            // 마지막 로그인 시간 업데이트
            member.setMemberLastlogin(LocalDateTime.now());
            memberRepository.save(member);

            // DTO로 변환
            MemberResponse loginUserDto = MemberResponse.fromEntity(member);

            // 세션에 로그인 정보 저장
            session.setAttribute(SESSION_KEY, member.getMemberNo());
            session.setAttribute("loginUser", loginUserDto);

            logger.info("로그인 성공: ID={}", member.getMemberNo());

            // 사용자 정보를 DTO로 변환하여 반환
            return loginUserDto;
        } catch (IllegalArgumentException e) {
            logger.warn("로그인 실패: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("로그인 처리 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 로그아웃
     */
    public void logout(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo != null) {
            logger.info("로그아웃: ID={}", memberNo);
        }
        // 세션 무효화
        session.invalidate();
    }

    /**
     * 현재 로그인한 회원 정보 조회
     */
    @Transactional(readOnly = true)
    public Optional<MemberResponse> getCurrentMember(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);

        if (memberNo == null) {
            return Optional.empty();
        }

        return memberRepository.findById(memberNo)
                .map(MemberResponse::fromEntity);
    }

    /**
     * 회원 정보 수정 - 이미지를 바이너리 데이터로 저장하도록 변경
     */
    @Transactional
    public MemberResponse updateMember(MemberUpdateRequest request, MultipartFile profileImage, HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 닉네임 변경 시 중복 체크
        if (request.getMemberNickname() != null && !request.getMemberNickname().equals(member.getMemberNickname())) {
            if (memberRepository.existsByMemberNickname(request.getMemberNickname())) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            member.setMemberNickname(request.getMemberNickname());
        }

        // 이름 변경
        if (request.getMemberName() != null && !request.getMemberName().isEmpty()) {
            member.setMemberName(request.getMemberName());
        }

        // 자기소개 변경
        if (request.getMemberIntroduce() != null) {
            member.setMemberIntroduce(request.getMemberIntroduce());
        }

        // 공개 설정 변경
        if (request.getMemberVisible() != null && !request.getMemberVisible().isEmpty()) {
            member.setMemberVisible(request.getMemberVisible());

            // 공개 설정 변경 시 해당 회원의 모든 게시물에도 같은 설정 적용
            // 회원 프로필의 공개 설정이 변경되면 기존 게시물도 모두 동일하게 변경
            List<Board> memberBoards = boardRepository
                    .findByMemberMemberNoOrderByBoardInputdateDesc(member.getMemberNo());
            for (Board board : memberBoards) {
                board.setBoardVisible(request.getMemberVisible());
            }
            if (!memberBoards.isEmpty()) {
                boardRepository.saveAll(memberBoards);
            }
        }

        // 알림 설정 변경
        if (request.getNotificationSettings() != null) {
            // 알림 설정을 저장하는 추가 로직
            // 예: 별도의 알림 설정 테이블이 있다면 여기서 처리
            logger.info("알림 설정 업데이트: {}", request.getNotificationSettings());
            // 현재는 프론트엔드에서만 관리하는 것으로 가정
        }

        // 프로필 이미지 초기화 요청 확인
        boolean resetToDefault = request.getResetProfileImage() != null &&
                request.getResetProfileImage().equals("true");

        if (resetToDefault) {
            // 기본 이미지로 설정
            member.setMemberPhoto(DEFAULT_PROFILE_IMAGE_PATH);
            // 이미지 데이터가 있다면 null로 설정
            member.setMemberPhotoData(null);
            member.setMemberPhotoType(null);
            logger.info("프로필 이미지 초기화: {}", member.getMemberNo());
        }
        // 새 프로필 이미지 업로드 요청 확인
        else if (profileImage != null && !profileImage.isEmpty()) {
            try {
                // 이미지 바이너리 데이터 및 MIME 타입 얻기
                byte[] imageData = profileImage.getBytes();
                String contentType = profileImage.getContentType();

                // API 경로 생성 (이미지 접근 URL)
                String apiPath = "/api/images/profile/" + member.getMemberNo();

                // 이미지 데이터 및 MIME 타입 저장
                member.setMemberPhotoData(imageData);
                member.setMemberPhotoType(contentType != null ? contentType : "image/jpeg");
                member.setMemberPhoto(apiPath); // API 접근 경로로 설정

                logger.info("프로필 이미지 업데이트 성공: {}", member.getMemberNo());
            } catch (IOException e) {
                logger.error("프로필 이미지 처리 중 오류: {}", e.getMessage(), e);
                throw new RuntimeException("프로필 이미지 저장 중 오류가 발생했습니다.", e);
            }
        }

        // 회원 정보 업데이트
        Member updatedMember = memberRepository.save(member);
        logger.info("회원 정보 업데이트 성공: ID={}", updatedMember.getMemberNo());

        return MemberResponse.fromEntity(updatedMember);
    }

    /**
     * 회원 탈퇴 - 회원 데이터 및 관련 데이터 모두 삭제
     */
    @Transactional
    public void withdrawMember(HttpSession session) {
        Long memberNo = (Long) session.getAttribute(SESSION_KEY);
        if (memberNo == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        try {
            // 2. 좋아요 삭제 및 카운트 감소
            List<Likes> userLikes = likeRepository.findByMember(member);
            for (Likes like : userLikes) {
                // 좋아요 타입에 따라 카운트 감소
                if ("board".equals(like.getLikeType())) {
                    // 게시물 좋아요 감소
                    Board board = boardRepository.findById(like.getLikeTypeNo())
                            .orElse(null);
                    if (board != null && board.getBoardLike() > 0) {
                        board.setBoardLike(board.getBoardLike() - 1);
                        boardRepository.save(board);
                    }
                } else if ("reply".equals(like.getLikeType())) {
                    // 댓글 좋아요 감소
                    Reply reply = replyRepository.findById(like.getLikeTypeNo())
                            .orElse(null);
                    if (reply != null && reply.getReplyLike() > 0) {
                        reply.setReplyLike(reply.getReplyLike() - 1);
                        replyRepository.save(reply);
                    }
                }
            }
            // 좋아요 레코드 삭제
            likeRepository.deleteByMember(member);
            logger.info("회원 관련 좋아요 삭제 및 카운트 감소 완료 - ID={}", memberNo);

            // 3. 스크랩(북마크) 삭제 - 해당 회원이 스크랩한 모든 게시물 연결 삭제
            scrapRepository.deleteByMember(member);
            logger.info("회원 관련 스크랩 삭제 완료 - ID={}", memberNo);

            // 4. 팔로우/팔로워 관계 삭제 - 해당 회원의 모든 팔로우 관계 삭제
            followRepository.deleteByFollowerOrFollowMember(member, member);
            logger.info("회원 관련 팔로우 관계 삭제 완료 - ID={}", memberNo);

            // 5. 댓글 처리 - 대댓글이 있는 경우 내용만 익명화, 없으면 삭제
            List<Reply> replies = replyRepository.findByMemberMemberNoOrderByReplyInputdateDesc(memberNo);
            for (Reply reply : replies) {
                List<Reply> childReplies = replyRepository.findByReplyParentReplyNo(reply.getReplyNo());
                if (!childReplies.isEmpty()) {
                    // 대댓글이 있으면 내용만 익명화 처리
                    reply.setReplyContent("탈퇴한 회원의 댓글입니다.");
                    reply.setReplyStatus("deleted");
                    replyRepository.save(reply);
                } else {
                    // 대댓글이 없으면 완전 삭제
                    replyRepository.delete(reply);
                }
            }
            logger.info("회원 관련 댓글 처리 완료 - ID={}", memberNo);

            // 6. 게시물 및 관련 데이터 삭제
            List<Board> boards = boardRepository.findByMemberMemberNoOrderByBoardInputdateDesc(memberNo);
            for (Board board : boards) {
                // 게시물에 연결된 이미지 삭제
                boardImageRepository.deleteByBoardBoardNo(board.getBoardNo());

                // 게시물에 연결된 태그 삭제
                tagRepository.deleteByBoardBoardNo(board.getBoardNo());

                // 게시물 삭제
                boardRepository.delete(board);
            }
            logger.info("회원 관련 게시물 및 이미지, 태그 삭제 완료 - ID={}", memberNo);

            // 7. 회원 정보 익명화 및 상태 변경
            member.setMemberStatus("inactive");
            member.setMemberName("탈퇴한 회원");
            member.setMemberNickname("탈퇴한 회원" + memberNo); // 닉네임 중복 방지
            member.setMemberEmail("withdrawn" + memberNo + "@example.com");
            member.setMemberPassword(""); // 비밀번호 초기화
            member.setMemberPhone("");
            member.setMemberPhoto(DEFAULT_PROFILE_IMAGE_PATH); // 기본 이미지로 변경
            member.setMemberPhotoData(null);
            member.setMemberPhotoType(null);
            member.setMemberIntroduce("");

            memberRepository.save(member);
            logger.info("회원 정보 익명화 및 상태 변경 완료 - ID={}", memberNo);

        } catch (Exception e) {
            logger.error("회원 탈퇴 처리 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("회원 탈퇴 처리 중 오류가 발생했습니다.", e);
        }

        // 세션 무효화
        session.invalidate();
        logger.info("회원 탈퇴 프로세스 완료 - ID={}, 관련 데이터 모두 삭제 또는 익명화됨", memberNo);
    }

    /**
     * 닉네임으로 회원 정보 조회
     */
    @Transactional(readOnly = true)
    public MemberResponse getMemberByNickname(String nickname) {
        Member member = memberRepository.findByMemberNicknameAndMemberStatus(nickname, "active")
                .orElseThrow(() -> new IllegalArgumentException("해당 닉네임의 회원을 찾을 수 없습니다."));

        return MemberResponse.fromEntity(member);
    }

    /**
     * 회원 프로필 이미지 조회
     */
    @Transactional(readOnly = true)
    public Member getMemberProfileImage(Long memberNo) {
        return memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다: " + memberNo));
    }

    /**
     * 기본 프로필 이미지 데이터 로드
     */
    public byte[] getDefaultProfileImageData() {
        try {
            // 클래스패스에서 기본 이미지 로드
            Resource resource = new ClassPathResource("/static/icon/profileimage.png");
            return Files.readAllBytes(resource.getFile().toPath());
        } catch (IOException e) {
            logger.error("기본 프로필 이미지 로드 중 오류: {}", e.getMessage(), e);
            return new byte[0]; // 빈 바이트 배열 반환
        }
    }

    public Member loginMember(MemberLoginRequest request) {
        Member member = memberRepository.findByMemberEmail(request.getMemberEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        // PasswordUtils를 사용하여 비밀번호 검증
        if (!PasswordUtils.verifyPassword(request.getMemberPassword(), member.getMemberPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return member;
    }

    public Member findByMemberNo(Long memberNo) {
        return memberRepository.findByMemberNo(memberNo);
    }

    public int updatePassword(Member member) {
        return memberRepository.updatePasswordById(member.getMemberPassword(), member.getMemberNo());
    }
}