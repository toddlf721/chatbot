export const formatTimestamp = (dateInput) => {
    try {
        let date;

        // 입력이 없는 경우
        if (!dateInput) {
            return '날짜 정보 없음';
        }

        // dateInput이 Date 객체인 경우
        if (dateInput instanceof Date) {
            date = isNaN(dateInput.getTime()) ? new Date() : dateInput;
        }
        // dateInput이 배열인 경우 (MySQL 타임스탬프 배열)
        else if (Array.isArray(dateInput)) {
            const month = dateInput[1] !== undefined ? dateInput[1] - 1 : 0; // 월은 0부터 시작하므로 -1
            date = new Date(
                dateInput[0] || 0,  // 연도 (없으면 0년)
                month,              // 월 (0-11)
                dateInput[2] || 1,  // 일 (없으면 1일)
                dateInput[3] || 0,  // 시 (없으면 0시)
                dateInput[4] || 0,  // 분 (없으면 0분)
                dateInput[5] || 0   // 초 (없으면 0초)
            );
        }
        // dateInput이 문자열 또는 타임스탬프인 경우
        else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            // MySQL datetime 형식 처리 (YYYY-MM-DD HH:MM:SS)
            if (typeof dateInput === 'string' && dateInput.includes('-') && dateInput.includes(':')) {
                // 문자열 그대로 Date 객체 생성
                date = new Date(dateInput);
            } else {
                // 일반 타임스탬프(숫자) 또는 다른 형식의 문자열
                date = new Date(dateInput);
            }
            
            // 유효하지 않은 날짜면 현재 날짜 사용
            if (isNaN(date.getTime())) {
                console.warn('유효하지 않은 날짜 형식:', dateInput);
                date = new Date(); // 현재 날짜로 대체
            }
        }
        else {
            console.warn('알 수 없는 날짜 형식:', dateInput);
            return '날짜 정보 없음';
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000); // 현재 시각과 입력받은 시각 차이 (초)

        // 시간 차이에 따라 포맷을 결정
        if (diffInSeconds < 60) {
            return '방금 전';
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)}분 전`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)}시간 전`;
        } else if (diffInSeconds < 604800) {
            return `${Math.floor(diffInSeconds / 86400)}일 전`;
        } else {
            // 7일 이상 차이 나는 경우 날짜 문자열로 반환 (년월일 형식)
            return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
        }
    } catch (error) {
        console.error('날짜 포맷팅 중 오류 발생:', error, dateInput);
        return '날짜 정보 없음';
    }
};