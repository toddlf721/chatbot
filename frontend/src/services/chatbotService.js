import axios from 'axios';

const BASE_URL = 'http://localhost:5050/api/chatbot';

export const sendChatMessage = async (message) => {
  try {
    const response = await axios.post(`${BASE_URL}/chat`, {
      message: message
    });
    return response.data.response;
  } catch (err) {
    console.error("챗봇 API 오류:", err);
    return "서버 응답에 실패했어요 😢";
  }
};
