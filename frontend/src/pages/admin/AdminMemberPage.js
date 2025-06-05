
// src/admin/AdminMemberPage.js
import React, { useEffect, useState } from 'react';
import APIService from '../../services/APIService';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css'; // 스타일 같이 사용

function AdminMemberPage() {
  const [members, setMembers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [suspendDateMap, setSuspendDateMap] = useState({});
  const [suspendReasonMap, setSuspendReasonMap] = useState({});

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await APIService.getAllMembers();
      setMembers(data);
    } catch (error) {
      console.error('회원 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBanStatus = async (memberNo) => {
    try {
      await APIService.updateBanStatus(memberNo);
      fetchMembers();
    } catch (error) {
      console.error('회원 상태 변경 오류:', error);
      alert('정지 상태 변경 실패');
    }
  };

  const filteredMembers = members.filter((member) => {
    const nickname = member.memberNickname || '';
    const email = member.memberEmail || '';
    return (
      nickname.toLowerCase().includes(searchText.toLowerCase()) ||
      email.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const handleSuspendDateChange = (memberNo, dateStr) => {
    setSuspendDateMap({
      ...suspendDateMap,
      [memberNo]: dateStr,
    });
  };

  const handleSuspendReasonChange = (memberNo, reason) => {
    setSuspendReasonMap({
      ...suspendReasonMap,
      [memberNo]: reason,
    });
  };

  const suspendMember = async (memberNo) => {
    try {
      const suspendUntil = suspendDateMap[memberNo];
      const reason = suspendReasonMap[memberNo] || '';
      if (!suspendUntil) {
        alert("정지 종료일을 입력하세요.");
        return;
      }
      await APIService.suspendMember(memberNo, suspendUntil, reason);

      setMembers([]);

      alert("정지되었습니다.");
      await fetchMembers();

    } catch (error) {
      console.error("정지 실패:", error);
      alert("정지 요청 중 오류 발생");
    }
  };

  const handleUnsuspend = async (memberNo) => {
    try {
      await APIService.unsuspendMember(memberNo);
      alert('정지 해제되었습니다.');

      // ✅ 해당 회원의 입력값 초기화
      setSuspendDateMap((prev) => ({
        ...prev,
        [memberNo]: ''
      }));

      setSuspendReasonMap((prev) => ({
        ...prev,
        [memberNo]: ''
      }));

      await fetchMembers(); // 최신 데이터 반영

    } catch (error) {
      console.error('정지 해제 실패:', error);
      alert('정지 해제 중 오류 발생');
    }
  };


  const translateStatus = (status) => {
    switch (status) {
      case 'active':
        return '사용중';
      case 'inactive':
        return '탈퇴한 회원';
      case 'suspended':
        return '정지됨';
      default:
        return status;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="admin-main">
        <h2>회원 관리</h2>

        <input
          type="text"
          className="form-input"
          placeholder="이메일 또는 닉네임 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: '1rem', width: '300px' }}
        />

        {loading ? (
          <p>회원 정보를 불러오는 중입니다...</p>
        ) : filteredMembers.length === 0 ? (
          <p>일치하는 회원이 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>닉네임</th>
                <th>이메일</th>
                <th>가입일</th>
                <th>정지상태</th>
                <th>정지 종료일</th>
                <th>정지 사유</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const formattedDate =
                  member.memberSuspendUntil &&
                    !isNaN(new Date(member.memberSuspendUntil).getTime())
                    ? new Date(member.memberSuspendUntil).toISOString().slice(0, 16)
                    : '';


                return (
                  <tr key={member.memberNo}>
                    <td>{member.memberNo}</td>
                    <td>{member.memberNickname}</td>
                    <td>{member.memberEmail}</td>
                    <td>
                      {member.memberJoindate
                        ? Array.isArray(member.memberJoindate)
                          ? new Date(
                            member.memberJoindate[0],
                            member.memberJoindate[1] - 1,
                            member.memberJoindate[2],
                            member.memberJoindate[3],
                            member.memberJoindate[4]
                          ).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : new Date(member.memberJoindate).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td>{translateStatus(member.memberStatus)}</td>
                    <td>
                      {Array.isArray(member.memberSuspendUntil)
                        ? new Date(
                          member.memberSuspendUntil[0],
                          member.memberSuspendUntil[1] - 1,
                          member.memberSuspendUntil[2],
                          member.memberSuspendUntil[3],
                          member.memberSuspendUntil[4]
                        ).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : '-'}
                    </td>
                    <td>{member.memberSuspendReason || '-'}</td>
                    <td>
                      <input
                        type="datetime-local"
                        value={
                          suspendDateMap[member.memberNo] ||
                          (member.memberSuspendUntil &&
                            !isNaN(new Date(member.memberSuspendUntil).getTime())
                            ? new Date(member.memberSuspendUntil).toISOString().slice(0, 16)
                            : '')
                        }
                        onChange={(e) => handleSuspendDateChange(member.memberNo, e.target.value)}
                        style={{ width: '170px', marginRight: '8px' }}
                      />
                      <input
                        type="text"
                        placeholder="정지 사유"
                        value={suspendReasonMap[member.memberNo] ?? member.memberSuspendReason ?? ''}
                        onChange={(e) => handleSuspendReasonChange(member.memberNo, e.target.value)}
                        style={{ width: '160px', marginRight: '8px' }}
                      />

                      {member.memberStatus === 'suspended' ? (
                        <button
                          onClick={() => handleUnsuspend(member.memberNo)}
                          className="btn btn-cancel"
                        >
                          해제
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendMember(member.memberNo)}
                          className="btn btn-ban"
                        >
                          정지
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminMemberPage;

