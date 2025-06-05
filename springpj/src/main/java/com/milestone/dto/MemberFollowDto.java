package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberFollowDto {
    private Long memberNo;
    private String memberNickname;
    private String memberName;
    private String memberPhoto;
}