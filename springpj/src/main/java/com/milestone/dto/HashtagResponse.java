package com.milestone.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HashtagResponse {
    private String hashtag;
    private String response;
}
