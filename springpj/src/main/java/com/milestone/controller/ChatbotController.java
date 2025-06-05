package com.milestone.controller;

import com.milestone.entity.Chatbot;
import com.milestone.repository.ChatbotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotRepository chatbotRepository;

    @GetMapping("/hashtags")
    public List<String> getHashtags() {
        return chatbotRepository.findAll().stream()
                .map(Chatbot::getHashtag)
                .distinct()
                .toList();
    }

    @PostMapping("/chat")
    public ResponseEntity<String> reply(@RequestBody Map<String, String> body) {
        String message = body.get("message").toLowerCase();

        // 메시지에 포함된 해시태그 후보 리스트
        List<String> hashtags = chatbotRepository.findAll()
                .stream()
                .map(Chatbot::getHashtag)
                .filter(tag -> tag != null && !tag.isBlank())
                .toList();

        for (String tag : hashtags) {
            if (message.contains(tag.toLowerCase())) {
                List<Chatbot> matches = chatbotRepository.findByHashtagContainingIgnoreCase(tag);
                if (!matches.isEmpty()) {
                    return wrapUtf8(matches.get(0).getResponse());
                }
            }
        }

        return wrapUtf8("🤖 아직 학습되지 않은 질문이에요.");
    }

    private ResponseEntity<String> wrapUtf8(String responseText) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", java.nio.charset.StandardCharsets.UTF_8));
        return ResponseEntity.ok().headers(headers).body(responseText);
    }
}
