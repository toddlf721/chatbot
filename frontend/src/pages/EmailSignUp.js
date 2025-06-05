import './EmailSignUp.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import APIService from '../services/APIService';
import Swal from 'sweetalert2';

function EmailSignUp({ isDarkMode, setIsLoggedIn }) {
  // 기본 입력 필드 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  
  // 이메일 인증 관련 상태
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  
  // 닉네임 중복 확인 상태
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  
  // 유효성 검사 상태
  const [nameError, setNameError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // 로딩 및 에러 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // 이름 유효성 검사
  useEffect(() => {
    if (name) {
      if (name.length > 20) {
        setNameError('이름은 최대 20글자까지 입력 가능합니다.');
      } else {
        setNameError('');
      }
    } else {
      setNameError('');
    }
  }, [name]);

  // 닉네임 유효성 검사
  useEffect(() => {
    if (nickname) {
      if (nickname.length > 20) {
        setNicknameError('닉네임은 최대 20글자까지 입력 가능합니다.');
        setIsNicknameAvailable(false);
      } else {
        setNicknameError('');
      }
    } else {
      setNicknameError('');
      setIsNicknameAvailable(false);
    }
  }, [nickname]);

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
    if (password) {
      const hasSpecialChar = /[!@#$%^&*]/.test(password);
    const hasNumber = /\d/.test(password);
    const isLongEnough = password.length >= 8;
    const hasNoSpace = !/\s/.test(password);  // 공백 문자가 없는지 확인
    
    if (!isLongEnough || !hasSpecialChar || !hasNumber || !hasNoSpace) {
      let errorMsg = '비밀번호는 ';
      if (!isLongEnough) errorMsg += '최소 8글자 이상, ';
      if (!hasSpecialChar) errorMsg += '특수문자(!@#$%^&*) 1개 이상, ';
      if (!hasNumber) errorMsg += '숫자 1개 이상, ';
      if (!hasNoSpace) errorMsg += '공백 문자 없이, ';
      errorMsg = errorMsg.slice(0, -2) + ' 포함해야 합니다.';
        
        setPasswordError(errorMsg);
      } else if (password.length > 100) {
        setPasswordError('비밀번호는 최대 100글자까지 입력 가능합니다.');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
  }, [password]);

  // 비밀번호 확인 일치 검사
  useEffect(() => {
    if (confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [password, confirmPassword]);

  // 전화번호 유효성 검사
  useEffect(() => {
    if (phone) {
      if (phone.length > 20) {
        setPhoneError('전화번호는 최대 20글자까지 입력 가능합니다.');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  }, [phone]);

  // 이메일 인증코드 발송 함수
  const sendEmailVerificationCode = async () => {
    if (!email) {
      setEmailError('이메일 주소를 입력해주세요.');
      return;
    }
    
    if (emailError) {
      return; // 이메일 오류가 있으면 인증번호 발송하지 않음
    }
    
    setIsSendingEmailCode(true);
    setEmailError('');
    
    try {
       // 이메일 중복 검사 API 호출 (인증번호 발송 전에 중복 검사)
    const checkResponse = await axios.post('http://localhost:9000/api/auth/check-email', {
      email: email
    });
    
    // 이메일이 이미 사용 중인 경우
    if (!checkResponse.data.available) {
      setEmailError('이미 사용 중인 이메일 주소입니다.');
      setIsSendingEmailCode(false);
      return;
    }


      // 이메일 인증번호 발송 API 호출
      const response = await axios.post('http://localhost:9000/api/auth/send-email-verification', {
        email: email
      });
      
      if (response.data.success) {
        Swal.fire({
          title: "발송 완료",
          text: "인증번호가 이메일로 발송되었습니다. 메일함을 확인해주세요",
          icon: "warning"
        });
      } else {
        setEmailError('인증번호 발송에 실패했습니다.');
      }
    } catch (error) {
      if (error.response?.data?.error === 'duplicate_email') {
        setEmailError('이미 사용 중인 이메일 주소입니다.');
      }else {
        console.error('이메일 인증번호 발송 중 오류 발생:', error);
      setEmailError(error.response?.data?.error || '인증번호 발송 중 오류가 발생했습니다.');
      }  
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  // 이메일 인증코드 검증 함수
  const verifyEmailCode = async () => {
    if (!emailVerificationCode) {
      setEmailError('인증번호를 입력해주세요.');
      return;
    }
    
    setIsVerifyingEmailCode(true);
    setEmailError('');
    
    try {
      // 이메일 인증번호 검증 API 호출
      const response = await axios.post('http://localhost:9000/api/auth/verify-email-code', {
        email: email,
        code: emailVerificationCode
      });
      
      if (response.data.verified) {
        setIsEmailVerified(true);
        Swal.fire({
          title: "인증 성공",
          text: "이메일 인증이 완료되었습니다",
          icon: "success"
        });
      } else {
        setEmailError('유효하지 않은 인증번호입니다.');
      }
    } catch (error) {
      console.error('이메일 인증코드 확인 중 오류 발생:', error);
      setEmailError(error.response?.data?.error || '인증코드 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  // 닉네임 중복 확인 함수
  const checkNicknameAvailability = async () => {
    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    
    if (nickname.length > 20) {
      setNicknameError('닉네임은 최대 20글자까지 입력 가능합니다.');
      return;
    }
    
    setIsCheckingNickname(true);
    setNicknameError('');
    
    try {
      // 닉네임 중복 확인 API 호출
      const response = await axios.post('http://localhost:9000/api/auth/check-nickname', {
        nickname: nickname
      });
      
      if (response.data.available) {
        setIsNicknameAvailable(true);
        Swal.fire({
          title: "사용 가능한 닉네임입나다",
          icon: "success",
          draggable: true
        });

      } else {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        setIsNicknameAvailable(false);
      }
    } catch (error) {
      console.error('닉네임 중복 확인 중 오류 발생:', error);
      setNicknameError(error.response?.data?.error || '닉네임 중복 확인 중 오류가 발생했습니다.');
      setIsNicknameAvailable(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 회원가입 처리 함수
  const handleSignUp = async (e) => {

    e.preventDefault();
    
    // 폼 유효성 검사
    if (!isEmailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }
    
    if (nameError || nicknameError || emailError || passwordError || confirmPasswordError || phoneError) {
      setError('입력한 정보를 다시 확인해주세요.');
      return;
    }
    
    if (!isNicknameAvailable) {
      setError('닉네임 중복 확인이 필요합니다.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 회원가입 API 호출
      const response = await APIService.signup({
        memberName: name,
        memberNickname: nickname,
        memberEmail: email,
        memberPassword: password,
        memberPhone: phone || '',
        memberVisible: 'public',  // 기본값 사용
        memberIntroduce: ''       // 기본값 사용
      });
   
      // 회원가입 성공 시
      Swal.fire({
        title: "환영합니다다",
        text: "회원가입이 완료되었습니다. 로그인해 주세요",
        icon: "success"
      });
      navigate('/login');
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      setError(error.response?.data?.error || '회원가입 처리 중 오류가 발생했습니다.');
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
              친구들과 소통하려면 가입하세요.
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            {/* 이메일 입력 및 인증 */}
            <div className="input-group email-verification">
              <input
                placeholder="이메일 주소 (최대 30자)"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isEmailVerified}
                style={{ width: '70%' }}
                maxLength={30}
              />
              <button 
                type="button" 
                onClick={sendEmailVerificationCode}
                disabled={loading || isSendingEmailCode || isEmailVerified || !email || emailError}
                style={{ 
                  width: '28%', 
                  marginLeft: '2%',
                  padding: '10px',
                  backgroundColor: '#0095f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {isSendingEmailCode ? '발송 중...' : isEmailVerified ? '인증됨' : '인증번호 발송'}
              </button>
            </div>
            
            {emailError && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                {emailError}
              </div>
            )}
            
            {/* 이메일 인증 코드 입력 필드 */}
            {email && !isEmailVerified && !emailError && (
              <div className="input-group email-verification">
                <input
                  placeholder="이메일 인증번호 6자리 입력"
                  type="text"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  disabled={loading || isVerifyingEmailCode || isEmailVerified}
                  style={{ width: '70%' }}
                />
                <button 
                  type="button" 
                  onClick={verifyEmailCode}
                  disabled={loading || isVerifyingEmailCode || isEmailVerified || !emailVerificationCode}
                  style={{ 
                    width: '28%', 
                    marginLeft: '2%',
                    padding: '10px',
                    backgroundColor: '#0095f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {isVerifyingEmailCode ? '확인 중...' : '인증확인'}
                </button>
              </div>
            )}
            
            {isEmailVerified && (
              <div style={{ color: 'green', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                이메일 인증이 완료되었습니다.
              </div>
            )}

            {/* 비밀번호 입력 */}
            <div className="input-group">
              <input
                placeholder="비밀번호 (특수문자, 숫자 포함 8자 이상)"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                maxLength={100}
              />
            </div>
            
            {passwordError && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                {passwordError}
              </div>
            )}
            
            {/* 비밀번호 확인 입력 */}
            <div className="input-group">
              <input
                placeholder="비밀번호 확인"
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {confirmPasswordError && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                {confirmPasswordError}
              </div>
            )}
            
            {/* 이름 입력 */}
            <div className="input-group">
              <input
                placeholder="성명 (최대 20자)"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                maxLength={20}
              />
            </div>
            
            {nameError && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                {nameError}
              </div>
            )}
            
            {/* 닉네임 입력 및 중복 확인 */}
            <div className="input-group">
              <input
                placeholder="사용자 아이디"
                required
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setIsNicknameAvailable(false); // 닉네임 변경 시 중복 확인 초기화
                }}
                disabled={loading || isNicknameAvailable}
                style={{ width: '70%' }}
                maxLength={20}
              />
              <button 
                type="button" 
                onClick={checkNicknameAvailability}
                disabled={loading || isCheckingNickname || isNicknameAvailable || !nickname || nicknameError}
                style={{ 
                  width: '28%', 
                  marginLeft: '2%',
                  padding: '10px',
                  backgroundColor: '#0095f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {isCheckingNickname ? '확인 중...' : isNicknameAvailable ? '사용 가능' : '중복 확인'}
              </button>
            </div>
            
            {nicknameError && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                {nicknameError}
              </div>
            )}
            
            {isNicknameAvailable && (
              <div style={{ color: 'green', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                사용 가능한 닉네임입니다.
              </div>
            )}
            
            {/* 전화번호 입력 */}
            <div className="input-group">
              <input
                placeholder="전화번호 (최대 20자)"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                maxLength={20}
              />
            </div>
            
            {phoneError && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
                {phoneError}
              </div>
            )}
            
            {/* 회원가입 버튼 */}
            <button 
              className="login-btn" 
              type="submit" 
              disabled={
                loading || 
                !isEmailVerified || 
                !isNicknameAvailable || 
                passwordError || 
                confirmPasswordError ||
                nameError ||
                nicknameError ||
                emailError ||
                phoneError ||
                password !== confirmPassword
              }
            >
              {loading ? '처리 중...' : '가입하기'}
            </button>
          </form>

          <div className="forgot-password">
            계정이 있으신가요? <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSignUp;