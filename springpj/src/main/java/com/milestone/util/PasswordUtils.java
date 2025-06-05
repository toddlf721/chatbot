package com.milestone.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 비밀번호 해싱 및 검증을 위한 유틸리티 클래스
 * (Spring Security를 사용하지 않는 경우를 위한 대체 구현)
 */
public class PasswordUtils {

    private static final int SALT_LENGTH = 16;
    private static final String HASH_ALGORITHM = "SHA-256";
    private static final String SALT_PASSWORD_SEPARATOR = ":";

    /**
     * 비밀번호를 해싱하여 저장 형식으로 반환
     * 저장 형식: salt:hashedPassword
     */
    public static String hashPassword(String password) {
        try {
            // 랜덤 솔트 생성
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[SALT_LENGTH];
            random.nextBytes(salt);

            // 비밀번호 해싱
            MessageDigest md = MessageDigest.getInstance(HASH_ALGORITHM);
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes());

            // Base64로 인코딩하여 저장 형식으로 변환
            String saltStr = Base64.getEncoder().encodeToString(salt);
            String hashedPasswordStr = Base64.getEncoder().encodeToString(hashedPassword);

            return saltStr + SALT_PASSWORD_SEPARATOR + hashedPasswordStr;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("해싱 알고리즘을 찾을 수 없습니다.", e);
        }
    }

    /**
     * 입력된 비밀번호와 저장된 해시 값을 비교하여 일치 여부 확인
     */
    public static boolean verifyPassword(String password, String storedHash) {
        try {
            // 저장된 해시에서 솔트와 해시 값 분리
            String[] parts = storedHash.split(SALT_PASSWORD_SEPARATOR);
            if (parts.length != 2) {
                return false;
            }

            String saltStr = parts[0];
            String storedHashedPasswordStr = parts[1];

            // Base64 디코딩
            byte[] salt = Base64.getDecoder().decode(saltStr);

            // 입력된 비밀번호 해싱
            MessageDigest md = MessageDigest.getInstance(HASH_ALGORITHM);
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes());
            String hashedPasswordStr = Base64.getEncoder().encodeToString(hashedPassword);

            // 해시 값 비교
            return storedHashedPasswordStr.equals(hashedPasswordStr);
        } catch (NoSuchAlgorithmException | IllegalArgumentException e) {
            return false;
        }
    }
}