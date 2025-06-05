package com.milestone.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberJoinRequest {

    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    @Size(max = 20, message = "이름은 최대 20자까지 입력 가능합니다.")
    private String memberName;

    @NotBlank(message = "닉네임은 필수 입력 항목입니다.")
    @Size(max = 20, message = "닉네임은 최대 20자까지 입력 가능합니다.")
    private String memberNickname;

    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    @Size(max = 30, message = "이메일은 최대 30자까지 입력 가능합니다.")
    private String memberEmail;

    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    @Size(min = 6, max = 20, message = "비밀번호는 6자 이상 20자 이하로 입력해주세요.")
    private String memberPassword;

    @NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    private String memberPhone;

    private String memberPhoto;

    @Size(max = 500, message = "자기소개는 최대 500자까지 입력 가능합니다.")
    private String memberIntroduce;

    private String memberVisible = "public";
}