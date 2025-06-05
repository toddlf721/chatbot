import './Login.css';
import React, { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import APIService from '../services/APIService';

function Login({ isDarkMode, setIsLoggedIn, setCurrentUser  }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [saveEmail, setSaveEmail] = useState(false); // 이메일 저장 여부

    // 컴포넌트 마운트 시 저장된 이메일 가져오기
    useEffect(() => {
      const storedEmail = localStorage.getItem('savedEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        setSaveEmail(true);
      }
    }, []);
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // API 서비스를 통한 로그인 요청
      const response = await APIService.login({
        memberEmail: email,
        memberPassword: password,
      });

      if(saveEmail){
        localStorage.setItem('savedEmail',email);
      }else{
        localStorage.removeItem('savedEmail');
      }

      // 로그인 성공 시
      setCurrentUser(response.data)
      
      setIsLoggedIn(true);
      
      // 로그인 후 페이지 새로고침 (캐시된 데이터 초기화)
      setTimeout(() => {
        window.location.href = '/home';
      }, 100);
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);

      // 오류 메시지 설정
      setError(error.message || '이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="overlay"></div>
      <div className="main-container">
        <div className="login-container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Link to="/">
              <div className="milestone-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="logo-circle" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src="/icon/logo.png" alt="Milestone Logo" style={{ width: '24px', height: '24px' }} />
                </div>
                <span className="logo-subtext">MILESTONE</span>
              </div>
            </Link>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginTop: '10px' }}>
              친구들과 소통하려면 로그인하세요.
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                placeholder="이메일 주소"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <input
                placeholder="비밀번호"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {/* 이메일 저장 체크박스 */}
            <div className="checkbox-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={saveEmail}
                  onChange={(e) => setSaveEmail(e.target.checked)}
                  disabled={loading}
                  style={{ marginRight: '6px' }}
                />
                이메일 주소 저장
              </label>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? '처리 중...' : '로그인'}
            </button>
          </form>

          
                {/* 비밀번호 찾기 영역 */}
                <div className="forgot-password" style={{ marginTop: '15px' }}>
            <Link to="/findpassword">비밀번호를 잊으셨나요?</Link>
          </div>

          {/* 회원가입 유도 */}
          <div className="forgot-password" style={{ marginTop: '10px' }}>
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;