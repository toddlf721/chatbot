package com.milestone.init;

import com.milestone.entity.Chatbot;
import com.milestone.entity.Chatbot;
import com.milestone.repository.ChatbotRepository;
import com.milestone.repository.ChatbotRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class ChatbotCsvImporter {

    private final ChatbotRepository repository;

    @PostConstruct
    public void importCsv() {
        if (repository.count() > 0) return; // ✅ 이미 데이터가 있으면 실행 안 함

        try (
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                    getClass().getResourceAsStream("/data/chatbot.csv"),
                    StandardCharsets.UTF_8
                )
            )
        ) {
            reader.lines().skip(1).forEach(line -> {
                String[] parts = line.split(",", 2);
                if (parts.length == 2) {
                    repository.save(new Chatbot(null, parts[0].trim(), parts[1].trim()));
                }
            });
            System.out.println("✅ CSV 데이터가 DB에 성공적으로 저장되었습니다!");
        } catch (Exception e) {
            System.err.println("❌ CSV 로딩 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
