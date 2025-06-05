package com.milestone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest { /**
 * 쪽지 내용
 */
@NotBlank(message = "쪽지 내용은 필수입니다")
@Size(max = 2000, message = "쪽지 내용은 최대 2000자까지 입력 가능합니다")
private String content;

    /**
     * 수신자 회원 번호 목록
     */
    @NotEmpty(message = "최소 한 명 이상의 수신자가 필요합니다")
    private List<Long> recipients;
}
