import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './FindPassword.css'; // 스타일 파일은 별도로 만들어야 합니다

function FindPassword({ isDarkMode }) {
  const navigate = useNavigate();
  
  // 상태 관리
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 단계 관리
  const [step, setStep] = useState(1); // 1: 이름/이메일 입력, 2: 인증코드 입력, 3: 새 비밀번호 설정
  
  // 상태 메시지
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 유효성 검사 상태
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // 이메일 유효성 검사
  useEffect(() => {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('유효한 이메일 주소를 입력해주세요.');
      } else if (email.length > 30) {
        setEmailError('이메일은 최대 30글자까지 입력 가능합니다.');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [email]);
  
  // 비밀번호 유효성 검사
  useEffect(() => {
    if (newPassword) {
      const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const isLongEnough = newPassword.length >= 8;
      const hasNoSpace = !/\s/.test(newPassword);
      
      if (!isLongEnough || !hasSpecialChar || !hasNumber || !hasNoSpace) {
        let errorMsg = '비밀번호는 ';
        if (!isLongEnough) errorMsg += '최소 8글자 이상, ';
        if (!hasSpecialChar) errorMsg += '특수문자(!@#$%^&*) 1개 이상, ';
        if (!hasNumber) errorMsg += '숫자 1개 이상, ';
        if (!hasNoSpace) errorMsg += '공백 문자 없이, ';
        errorMsg = errorMsg.slice(0, -2) + ' 포함해야 합니다.';
        
        setPasswordError(errorMsg);
      } else {
        setPasswordError('');
      }
      
      // 비밀번호 확인 일치 검사
      if (confirmPassword && newPassword !== confirmPassword) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
      }
    } else {
      setPasswordError('');
    }
  }, [newPassword, confirmPassword]);
  
  // 인증번호 요청
  const requestVerificationCode = async (e) => {
    e.preventDefault();
    
    // 이메일 유효성 검사
    if (emailError) {
      setMessage(emailError);
      return;
    }
    
    setLoading(true);
    setMessage('');
    console.log(name,email);
    try {
      // 이름과 이메일로 사용자 존재 확인
      const checkResponse = await axios.post('http://localhost:9000/api/auth/check-user', {
        memberName: name,
        memberEmail: email
      });
      console.log(name,email);
      
      if (!checkResponse.data.exists) {
        setMessage('등록된 정보와 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      
      // 인증번호 발송 요청
      const verifyResponse = await axios.post('http://localhost:9000/api/auth/send-email-verification', {
        email: email
      });
      
      if (verifyResponse.data.success) {
        Swal.fire({
          title: '인증번호 발송!',
          text: '이메일로 인증번호가 발송되었습니다.',
          icon: 'success',
          confirmButtonText: '확인'
        });
        setStep(2); // 인증코드 입력 단계로 이동
      } else {
        setMessage('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('인증번호 요청 중 오류:', error);
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  // 인증번호 확인
  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
        const response = await axios.post('http://localhost:9000/api/auth/verify-email-code', {
        email: email,
        code: verificationCode
      });
      
      if (response.data.verified) {
        Swal.fire({
          title: '인증 성공!',
          text: '이메일 인증이 완료되었습니다.',
          icon: 'success',
          confirmButtonText: '확인'
        });
        setStep(3); // 새 비밀번호 설정 단계로 이동
      } else {
        setMessage('인증번호가 일치하지 않습니다. 다시 확인해주세요.');
      }
    } catch (error) {
      console.error('인증번호 확인 중 오류:', error);
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 변경
  const resetPassword = async (e) => {
    e.preventDefault();
    
    // 비밀번호 유효성 검사
    if (passwordError) {
      setMessage(passwordError);
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:9000/api/auth/reset-password', {
        email: email,
        newPassword: newPassword
      });
      
      if (response.data.success) {
        Swal.fire({
          title: '비밀번호 변경 완료!',
          text: '비밀번호가 성공적으로 변경되었습니다.',
          icon: 'success',
          confirmButtonText: '로그인하기'
        }).then(() => {
          navigate('/login');
        });
      } else {
        setMessage('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('비밀번호 변경 중 오류:', error);
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`find-password-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="overlay"></div>
      <div className="main-container">
        <div className="find-password-container">
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
              비밀번호 찾기
            </div>
          </div>
          
          {message && (
            <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              {message}
            </div>
          )}
          
          {/* 단계 1: 이름, 이메일 입력 */}
          {step === 1 && (
            <form onSubmit={requestVerificationCode}>
              <div className="input-group">
                <input
                  placeholder="이름"
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <input
                  placeholder="이메일 주소"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  maxLength={30}
                />
              </div>
              
              {emailError && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '-5px', marginBottom: '10px' }}>
                  {emailError}
                </div>
              )}
              
              <button 
                className="submit-btn" 
                type="submit" 
                disabled={loading || emailError}
              >
                {loading ? '처리 중...' : '인증번호 받기'}
              </button>
            </form>
          )}
          
          {/* 단계 2: 인증코드 입력 */}
          {step === 2 && (
            <form onSubmit={verifyCode}>
              <p className="instruction">
                {email}로 인증번호가 발송되었습니다.<br />
                이메일을 확인하고 인증번호를 입력해주세요.
              </p>
              <div className="input-group">
                <input
                  placeholder="인증번호 6자리"
                  required
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                />
              </div>
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? '처리 중...' : '인증하기'}
              </button>
              <div className="back-link">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#0095f6', cursor: 'pointer', padding: 0 }}
                >
                  이전으로 돌아가기
                </button>
              </div>
            </form>
          )}
          
          {/* 단계 3: 새 비밀번호 설정 */}
          {step === 3 && (
            <form onSubmit={resetPassword}>
              <p className="instruction">
                새로운 비밀번호를 설정해주세요.<br />
                비밀번호는 최소 8글자 이상이며, 특수문자와 숫자를 포함해야 합니다.
              </p>
              <div className="input-group">
                <input
                  placeholder="새 비밀번호 (특수문자, 숫자 포함 8자 이상, 공백 없이)"
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  minLength={8}
                  maxLength={100}
                />
              </div>
              <div className="input-group">
                <input
                  placeholder="새 비밀번호 확인"
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {passwordError && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '-5px', marginBottom: '10px' }}>
                  {passwordError}
                </div>
              )}
              
              <button 
                className="submit-btn" 
                type="submit" 
                disabled={loading || passwordError || !newPassword || !confirmPassword}
              >
                {loading ? '처리 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
          
          {/* 로그인 페이지 링크 */}
          <div className="login-link" style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/login">로그인 페이지로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FindPassword;