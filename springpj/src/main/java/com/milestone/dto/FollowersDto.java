package com.milestone.dto;

import com.milestone.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowersDto {


    private Long memberNo;
    private String memberName;
    private String memberNickname;
    private String memberEmail;
    private String memberPhoto;
    private String memberIntroduce;
    private String memberVisible;
    private LocalDateTime memberJoindate;
    private Long boardCount;

    // Entity를 DTO로 변환하는 정적 메서드
    public static MemberResponse fromEntity(Member member) {
        return MemberResponse.builder()
                .memberNo(member.getMemberNo())
                .memberName(member.getMemberName())
                .memberNickname(member.getMemberNickname())
                .memberEmail(member.getMemberEmail())
                .memberPhoto(member.getMemberPhoto())
                .memberIntroduce(member.getMemberIntroduce())
                .memberVisible(member.getMemberVisible())
                .memberJoindate(member.getMemberJoindate())
                .build();
    }
}
