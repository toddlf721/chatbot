package com.milestone.util;

import com.milestone.dto.HashtagResponse;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class HashtagCsvLoader {
    private static final String FILE_PATH = "/static/chatbot_study_hashtags.csv";

    public List<HashtagResponse> loadHashtags() {
        try (
            BufferedReader reader = new BufferedReader(new InputStreamReader(
                    getClass().getResourceAsStream(FILE_PATH), StandardCharsets.UTF_8
            ))
        ) {
            return reader.lines().skip(1).map(line -> {
                String[] tokens = line.split(",", 2);
                return new HashtagResponse(tokens[0].trim(), tokens[1].trim());
            }).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}
