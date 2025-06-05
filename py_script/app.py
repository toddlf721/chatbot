from flask import Flask, request, jsonify
import pandas as pd
import os

app = Flask(__name__)

# CSV 파일 로드 함수 (경로에 's' 없음)
def load_hashtag_responses():
    csv_path = os.path.join("py_script", "data", "chatbot_study_hashtags.csv")
    if not os.path.exists(csv_path):
        return {}
    df = pd.read_csv(csv_path)
    return dict(zip(df["hashtag"], df["response"]))

# 서버 시작 시 CSV 데이터 로딩
hashtag_responses = load_hashtag_responses()

@app.route('/api/chatbot/chat', methods=['POST'])
def chatbot_reply():
    user_message = request.json.get('message', '').strip().lower()
    
    # 단축어 포함 여부 확인
    for hashtag, response in hashtag_responses.items():
        if hashtag.lower() in user_message:
            return jsonify({ "response": response })

    # 기본 응답
    return jsonify({ "response": "🤖 죄송해요! 해당 질문은 아직 학습되지 않았어요." })

@app.route('/api/chatbot/hashtags', methods=['GET'])
def get_hashtag_list():
    return jsonify({ "hashtags": list(hashtag_responses.keys()) })


if __name__ == '__main__':
    app.run(port=5050)
