package com.milestone.controller;

import com.milestone.dto.MemberResponse;
import com.milestone.dto.SuspendMemberRequest;
import com.milestone.entity.Member;
import com.milestone.repository.MemberRepository;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final MemberRepository memberRepository;

    // 전체 회원 조회
    @GetMapping
    public ResponseEntity<List<MemberResponse>> getAllMembers() {
        List<Member> members = memberRepository.findAll();
        List<MemberResponse> response = members.stream()
                .map(MemberResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // 정지 상태 토글 (정지 ↔ 해제)
    @PostMapping("/{memberNo}/ban-toggle")
    public ResponseEntity<Void> toggleBanStatus(@PathVariable Long memberNo) {
        Optional<Member> optionalMember = memberRepository.findById(memberNo);
        if (optionalMember.isPresent()) {
            Member member = optionalMember.get();
            if ("banned".equals(member.getMemberStatus())) {
                member.setMemberStatus("active");
            } else {
                member.setMemberStatus("banned");
            }
            memberRepository.save(member);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/admin/members")
    public ResponseEntity<List<MemberResponse>> getAllMembers(HttpSession session) {
        Long memberNo = (Long) session.getAttribute("LOGGED_IN_MEMBER");
        if (memberNo == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 로그인 안 됨
        }

        Member member = memberRepository.findById(memberNo)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        if (!"ADMIN".equals(member.getMemberRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 관리자 아님
        }

        List<MemberResponse> response = memberRepository.findAll()
                .stream()
                .map(MemberResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{memberNo}/suspend")
    public ResponseEntity<Void> suspendMember(
            @PathVariable Long memberNo,
            @RequestBody SuspendMemberRequest request) {
    
        Optional<Member> optionalMember = memberRepository.findById(memberNo);
        if (optionalMember.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
    
        Member member = optionalMember.get();
        member.setMemberStatus("suspended");
        member.setMemberSuspendUntil(request.getSuspendUntil());
    
        // 🔥 정지 사유 저장
        member.setMemberSuspendReason(request.getReason());
    
        memberRepository.save(member);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{memberNo}/unsuspend")
public ResponseEntity<Void> unsuspendMember(@PathVariable Long memberNo) {
    Optional<Member> optionalMember = memberRepository.findById(memberNo);
    if (optionalMember.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    Member member = optionalMember.get();
    member.setMemberStatus("active");
    member.setMemberSuspendUntil(null);
    member.setMemberSuspendReason(null);
    memberRepository.save(member);

    return ResponseEntity.ok().build();
}

}
