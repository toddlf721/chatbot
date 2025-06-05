package com.milestone.entity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_no")
    private Long memberNo;

    @Column(name = "member_name", nullable = false, length = 20)
    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String memberName;

    @Column(name = "member_nickname", nullable = false, length = 20, unique = true)
    @NotBlank(message = "닉네임은 필수 입력 항목입니다.")
    @Size(max = 20, message = "닉네임은 최대 20글자까지 입력 가능합니다.")
    private String memberNickname;

    @Column(name = "member_email", nullable = false, length = 30, unique = true)
    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "유효한 이메일 주소를 입력해주세요.")
    private String memberEmail;

    @Column(name = "member_password", nullable = false, length = 100)
    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    private String memberPassword;

    @Column(name = "member_phone", length = 20)
    @NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    private String memberPhone;

    @Column(name = "member_photo", length = 1000)
    private String memberPhoto;

    // 이미지 바이너리 데이터 추가
    @Lob
    @Column(name = "member_photo_data", columnDefinition = "LONGBLOB")
    private byte[] memberPhotoData;

    // 이미지 MIME 타입 추가
    @Column(name = "member_photo_type", length = 100)
    private String memberPhotoType;

    @Column(name = "member_introduce", length = 500)
    private String memberIntroduce;

    @Column(name = "member_visible", nullable = false, columnDefinition = "ENUM('public', 'follow', 'private') DEFAULT 'public'")
    private String memberVisible = "public";

    @Column(name = "member_qualify", length = 10)
    private String memberQualify;

    @Column(name = "member_status", nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'active'")
    private String memberStatus = "active";

    @CreationTimestamp
    @Column(name = "member_joindate", nullable = false, updatable = false)
    private LocalDateTime memberJoindate;

    @Column(name = "member_lastlogin")
    private LocalDateTime memberLastlogin;

    @Column(name = "member_role", nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'USER'")
    private String memberRole = "USER";

    @Column(name = "member_suspend_until")
    private LocalDateTime memberSuspendUntil;

    public boolean isSuspended() {
        return "suspended".equals(this.memberStatus) &&
                this.memberSuspendUntil != null &&
                this.memberSuspendUntil.isAfter(LocalDateTime.now());
    }

    @Column(length = 255)
    private String memberSuspendReason;

    public String getMemberSuspendReason() {
        return memberSuspendReason;
    }

    public void setMemberSuspendReason(String reason) {
        this.memberSuspendReason = reason;
    }
    public String getNickname() {
        return this.memberNickname;
    }

    @Column(name = "role", nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'USER'")
    private String role; // ADMIN or USER
    
    public boolean isAdmin() {
        // 기존: return "ADMIN".equals(this.role);
        return "ADMIN".equals(this.memberRole); // 🔧 수정
    }



}