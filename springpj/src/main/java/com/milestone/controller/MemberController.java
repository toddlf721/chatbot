package com.milestone.controller;

import com.milestone.dto.*;
import com.milestone.entity.Member;
import com.milestone.service.MemberService;
import com.milestone.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import java.util.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private static final Logger logger = LoggerFactory.getLogger(MemberController.class);
    private final MemberService memberService;
    private final SearchService searchService;

    /**
     * 회원 가입 API
     */
    @PostMapping("/join")
    public ResponseEntity<Object> join(@RequestBody @Valid MemberJoinRequest request, BindingResult bindingResult) {

        System.out.println("request : " + request);

        // 유효성 검사 에러 처리
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error ->
                    errors.put(error.getField(), error.getDefaultMessage())
            );
            return ResponseEntity.badRequest().body(errors);
        }

        // 닉네임 중복 검사
        if (memberService.isNicknameExists(request.getMemberNickname())) {
            return ResponseEntity.badRequest().body(
                    Collections.singletonMap("memberNickname", "이미 사용 중인 닉네임입니다.")
            );
        }

        // 이메일 중복 검사
        if (memberService.isEmailExists(request.getMemberEmail())) {
            return ResponseEntity.badRequest().body(
                    Collections.singletonMap("memberEmail", "이미 사용 중인 이메일입니다.")
            );
        }


        MemberResponse response = memberService.join(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);


    }

    /**
     * 로그인 API
     */
    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody @Valid MemberLoginRequest request,
                                        HttpSession session) {
        try {
            logger.info("로그인 요청 - 이메일: {}", request.getMemberEmail());

            // login 메서드만 사용하여 처리 (loginMember 사용하지 않음)
            MemberResponse response = memberService.login(request, session);
            logger.info("로그인 성공 - ID: {}", response.getMemberNo());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("로그인 실패 - 인증 오류: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (Exception e) {
            logger.error("로그인 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "로그인 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 로그아웃 API
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        memberService.logout(session);

        Map<String, String> response = new HashMap<>();
        response.put("message", "로그아웃 되었습니다.");

        return ResponseEntity.ok(response);
    }

    /**
     * 현재 로그인한 회원 정보 조회 API
     */
    @GetMapping("/me")
    public ResponseEntity<Object> getCurrentMember(HttpSession session) {
        Optional<MemberResponse> currentMember = memberService.getCurrentMember(session);

        if (currentMember.isPresent()) {
            return ResponseEntity.ok(currentMember.get());
        }

        // 로그인되지 않은 경우
        Map<String, String> response = new HashMap<>();
        response.put("message", "로그인이 필요합니다.");
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    /**
     * 회원 정보 수정 API
     */
    @PutMapping("/update")
    public ResponseEntity<Object> updateMember(
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "memberName", required = false) String memberName,
            @RequestParam(value = "memberNickname", required = false) String memberNickname,
            @RequestParam(value = "memberIntroduce", required = false) String memberIntroduce,
            @RequestParam(value = "resetProfileImage", required = false) String resetProfileImage,
            @RequestParam(value = "memberVisible", required = false) String memberVisible,
            @RequestParam(value = "notificationSettings", required = false) String notificationSettings,
            HttpSession session) {

        try {
            logger.info("회원 정보 수정 요청");

            MemberUpdateRequest request = MemberUpdateRequest.builder()
                    .memberName(memberName)
                    .memberNickname(memberNickname)
                    .memberIntroduce(memberIntroduce)
                    .resetProfileImage(resetProfileImage)
                    .memberVisible(memberVisible)
                    .notificationSettings(notificationSettings)
                    .build();

            MemberResponse response = memberService.updateMember(request, profileImage, session);
            logger.info("회원 정보 수정 성공 - ID: {}", response.getMemberNo());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("회원 정보 수정 실패 - 잘못된 요청: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("회원 정보 수정 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "회원 정보 수정 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 회원 탈퇴 API
     */
    @DeleteMapping("/withdraw")
    public ResponseEntity<Object> withdrawMember(HttpSession session) {
        try {
            logger.info("회원 탈퇴 요청");
            memberService.withdrawMember(session);

            Map<String, String> response = new HashMap<>();
            response.put("message", "회원 탈퇴가 완료되었습니다.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("회원 탈퇴 실패 - 잘못된 요청: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            logger.error("회원 탈퇴 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "회원 탈퇴 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 서버 상태 확인 API (디버깅용)
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "서버가 정상적으로 동작 중입니다.");
        return ResponseEntity.ok(response);
    }

    /**
     * 닉네임으로 회원 정보 조회 API
     */
    @GetMapping("/profile/{nickname}")
    public ResponseEntity<Object> getMemberByNickname(@PathVariable String nickname) {
        try {
            logger.info("닉네임으로 회원 정보 조회 요청 - 닉네임: {}", nickname);
            MemberResponse response = memberService.getMemberByNickname(nickname);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("회원 정보 조회 실패 - 잘못된 요청: {}", e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            logger.error("회원 정보 조회 실패 - 서버 오류: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "회원 정보 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<MemberSearchDto>> searchMembers(@RequestParam String query) {
        List<Member> members = searchService.memberIdSearch(query);
        List<MemberSearchDto> results = new ArrayList<>();

        if (members != null && !members.isEmpty()) {
            for (Member mem : members) {
                MemberSearchDto dto = new MemberSearchDto(); // ★ 객체 생성 위치 변경
                dto.setMemberNo(mem.getMemberNo());
                dto.setMemberName(mem.getMemberName());
                dto.setMemberEmail(mem.getMemberEmail());
                dto.setMemberNickname(mem.getMemberNickname());
                dto.setMemberPhoto(mem.getMemberPhoto());
                dto.setMemberPhotoType(mem.getMemberPhotoType());
                results.add(dto);
            }

            System.out.println("닉넴 검색 결과 : " + results);
            return ResponseEntity.ok(results);
        } else {
            return ResponseEntity.ok(results); // 빈 리스트 반환
        }
    }
}