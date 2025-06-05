package com.milestone.controller;

import com.milestone.dto.CheckUserRequest;
import com.milestone.dto.PasswordResetRequest;
import com.milestone.entity.Member;
import com.milestone.repository.MemberRepository;
import com.milestone.service.MemberService;
import com.milestone.util.PasswordUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;


import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // 이메일 인증번호 저장소 (실제로는 Redis 등을 사용하는 것이 좋습니다)
    private final Map<String, String> emailVerificationCodes = new ConcurrentHashMap<>();

    // JavaMailSender 주입
    private final JavaMailSender mailSender;
    private final MemberRepository memberRepository;
    private final MemberService memberService;

    /**
     * 이메일 인증번호 발송 API
     */
    @PostMapping("/send-email-verification")
    public ResponseEntity<Map<String, Object>> sendEmailVerification(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        System.out.println(email);

        try {
            // 이메일 유효성 검사
            if (email == null || email.isEmpty()) {
                response.put("success", false);
                response.put("error", "이메일 주소를 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }

            // 인증번호 생성 (6자리)
            String verificationCode = generateRandomCode();
            emailVerificationCodes.put(email, verificationCode);

            // 이메일 발송
            boolean sent = sendEmail(email, verificationCode);

            if (sent) {
                response.put("success", true);
                response.put("message", "인증번호가 발송되었습니다.");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "인증번호 발송에 실패했습니다.");
                return ResponseEntity.internalServerError().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "이메일 인증번호 발송 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 이메일 인증번호 검증 API
     */
    @PostMapping("/verify-email-code")
    public ResponseEntity<Map<String, Object>> verifyEmailCode(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        String code = request.get("code");

        try {
            // 이메일과 코드 유효성 검사
            if (email == null || email.isEmpty() || code == null || code.isEmpty()) {
                response.put("verified", false);
                response.put("error", "이메일 주소와 인증번호를 모두 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }

            // 저장된 인증번호 확인
            String storedCode = emailVerificationCodes.get(email);
            boolean isValid = storedCode != null && storedCode.equals(code);

            if (isValid) {
                // 인증 성공 시 저장된 코드 제거
                emailVerificationCodes.remove(email);
                response.put("verified", true);
            } else {
                response.put("verified", false);
                response.put("error", "유효하지 않은 인증번호입니다.");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("verified", false);
            response.put("error", "인증번호 확인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 이메일 발송 메소드
     */
    private boolean sendEmail(String toEmail, String verificationCode) {
        try {
            System.out.println("tomail:" + toEmail);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("neosteam@naver.com");  // 발신자 이메일
            System.out.println("message setfrom :" + message.getFrom());
            message.setTo(toEmail);
            message.setSubject("Milestone 회원가입 이메일 인증");
            message.setText("안녕하세요!\n\n" +
                    "Milestone 회원가입을 위한 이메일 인증번호입니다.\n\n" +
                    "인증번호: " + verificationCode + "\n\n" +
                    "인증번호는 10분간 유효합니다.\n" +
                    "감사합니다.\n\n" +
                    "Milestone 팀 드림");

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 6자리 랜덤 숫자 코드 생성
     */
    private String generateRandomCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000 ~ 999999 범위의 숫자
        return String.valueOf(code);
    }


    /**
     * 닉네임 중복 확인
     */
    @PostMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNicknameAvailability(@RequestBody Map<String, String> request) {
        String nickname = request.get("nickname");

        // 닉네임 유효성 검사 (필요시)
        if (nickname == null || nickname.trim().isEmpty()) {
            Map<String, Boolean> response = new HashMap<>();
            response.put("available", false);
            return ResponseEntity.ok(response);
        }

        // 닉네임 중복 검사
        boolean isAvailable = !memberRepository.existsByMemberNickname(nickname);

        Map<String, Boolean> response = new HashMap<>();
        response.put("available", isAvailable);

        return ResponseEntity.ok(response);
    }

    // 이메일 중복 확인 API
    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "이메일이 제공되지 않았습니다."));
        }

        boolean isAvailable = !memberRepository.existsByMemberEmail(email);

        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    @PostMapping("/check-user")
    public ResponseEntity<?> checkUser(@RequestBody CheckUserRequest request) {

        // 입력값 검증
        if (request.getMemberName() == null || request.getMemberEmail() == null ||
                request.getMemberName().trim().isEmpty() || request.getMemberEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", "이름과 이메일을 모두 입력해주세요.")
            );
        }

        // 사용자 확인
        boolean exists = memberRepository.existsByMemberNameAndMemberEmail(
                request.getMemberName(),
                request.getMemberEmail()
        );

        // 응답 반환
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        // 입력값 검증
        if (request.getEmail() == null || request.getNewPassword() == null ||
                request.getEmail().trim().isEmpty() || request.getNewPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", "이메일과 새 비밀번호를 모두 입력해주세요.")
            );
        }

        try {
            // 해당 이메일의 회원 조회
            Optional<Member> member = memberRepository.findByMemberEmail(request.getEmail());

            if (member.get() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of("success", false, "error", "해당 이메일로 등록된 회원이 없습니다.")
                );
            }

            // 비밀번호 유효성 검사 (서버 측에서도 한 번 더 확인)
            if (!isValidPassword(request.getNewPassword())) {
                return ResponseEntity.badRequest().body(
                        Map.of("success", false, "error", "비밀번호는 최소 8글자 이상이어야 하며, 숫자와 특수문자를 포함해야 합니다.")
                );
            }

            // 비밀번호 암호화 및 업데이트
            String hashedPassword = PasswordUtils.hashPassword(request.getNewPassword());

            member.get().setMemberPassword(hashedPassword);
            // 회원 정보 저장
            int num = memberService.updatePassword(member.get());
            if (num > 0){
                return ResponseEntity.ok(Map.of("success", true, "message", "비밀번호가 성공적으로 변경되었습니다."));
            }else{
                return ResponseEntity.badRequest().body("비밀번호 변경 시도 중 오류가 발생하였습니다");
            }

        } catch (Exception e) {
            // 로그에 오류 기록
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("success", false, "error", "비밀번호 변경 중 오류가 발생했습니다.")
            );
        }
    }

    /**
     * 비밀번호 유효성 검사 메소드
     * @param password 검사할 비밀번호
     * @return 유효성 여부
     */
    private boolean isValidPassword(String password) {
        // 비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 함
        String passwordRegex = "^(?=.*[0-9])(?=.*[!@#$%^&*])(?=\\S+$).{8,}$";
        return password != null && password.matches(passwordRegex);
    }
}
