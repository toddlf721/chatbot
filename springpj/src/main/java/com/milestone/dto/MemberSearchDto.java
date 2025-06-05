package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberSearchDto {

    public Long memberNo;
    public String memberNickname;
    public String memberName;
    public String memberEmail;
    public String memberPhoto;
    public String memberPhotoType;

    

}
