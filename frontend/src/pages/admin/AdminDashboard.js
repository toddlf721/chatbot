// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import APIService from '../../services/APIService';
import './AdminDashboard.css';
import AdminSidebar from './AdminSidebar';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState();
  const [totalReports, setTotalReports] = useState(0);
  const [postStats, setPostStats] = useState({ labels: [], data: [] });
  const [dailyPostStats, setDailyPostStats] = useState({ labels: [], data: [] });
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [recentLoggedInUsers, setRecentLoggedInUsers] = useState(0);
  const [recentReports, setRecentReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [noticeContent, setNoticeContent] = useState("");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userCount = await APIService.getTotalUsers();
        setTotalUsers(userCount);

        const loggedInCount = await APIService.getRecentlyLoggedInUserCount();
        setRecentLoggedInUsers(loggedInCount);

        const stats = await APIService.getMonthlyPostStats();
        setPostStats(stats);

        const postCount = await APIService.getTotalPostCount();
        setTotalPosts(postCount);

        const dailyStats = await APIService.getDailyPostStats();
        setDailyPostStats(dailyStats);

        const reportCount = await APIService.getTotalReportCount();
        setTotalReports(reportCount);

        const all = await APIService.getAllReports();
        setAllReports(all);

        const recent = await APIService.getRecentReports();
        setRecentReports(recent.data || recent);

        const members = await APIService.getRecentMembers();
        setRecentMembers(members);

        const user = await APIService.getCurrentUser();
        setUserRole(user.memberRole);
      } catch (error) {
        console.error('관리자 대시보드 데이터 로딩 오류:', error);
      }
    };
    fetchData();
  }, []);

  const handleNoticeSubmit = async () => {
    try {
      await APIService.registerNotice({
        content: noticeContent,
        startDate: startDate,
        endDate: endDate
      });
      alert("공지사항이 등록되었습니다.");
      setNoticeContent('');
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error("공지 등록 실패:", error);
      alert("공지사항 등록 중 오류가 발생했습니다.");
    }
  };


  


  const combinedLabels = [
    ...postStats.labels.map(m => `${m}`),
    ...dailyPostStats.labels.map(d => `${d}`)
  ];

  const combinedChartData = {
    labels: combinedLabels,
    datasets: [
      {
        label: '월별 게시글 수',
        data: [...postStats.data, ...Array(dailyPostStats.data.length).fill(null)],
        backgroundColor: 'rgba(76, 175, 80, 0.6)'
      },
      {
        label: '일별 게시글 수',
        data: [...Array(postStats.data.length).fill(null), ...dailyPostStats.data],
        backgroundColor: 'rgba(33, 150, 243, 0.6)'
      }
    ]
  };

  const combinedChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '게시글 통계 (월/일)' }
    },
    scales: {
      x: {
        offset: true, // 막대 간의 간격을 주기
        ticks: {
          align: 'center',
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="admin-main">
        <h2>관리자 대시보드</h2>
        {userRole && <p>현재 권한: {userRole}</p>}

        <div className="admin-cards">
          <div className="admin-card">
            <h3>👥 전체 가입자 수</h3>
            <p className="big-number">{totalUsers}</p>
          </div>
          <div className="admin-card">
            <h3>🟢 로그인 사용자 수</h3>
            <p className="big-number">{recentLoggedInUsers}</p>
          </div>
          <div className="admin-card">
            <h3>📝 전체 게시글 수</h3>
            <p className="big-number">{totalPosts}</p>
          </div>
          <div className="admin-card">
            <h3>🚨 전체 신고 수</h3>
            <p className="big-number">{totalReports}</p>
          </div>
        </div>

        <div className="admin-chart">
          <h3>🧾 월별 / 일별 게시글 수</h3>
          <Bar
            data={combinedChartData}
            options={{
              ...combinedChartOptions,
              onClick: (event, elements) => {
                if (elements.length > 0) {
                  const element = elements[0];
                  const clickedLabel = combinedChartData.labels[element.index];
                  const matched = clickedLabel.match(/(\d+)월/);
                  if (matched) {
                    const monthNum = matched[1].padStart(2, '0');
                    const year = "2025";
                    setSelectedMonth(`${year}-${monthNum}`);
                  }
                }
              }
            }}
          />

          {selectedMonth && (
            <div style={{ marginTop: "2rem" }}>
              <h4>📅 {selectedMonth} 일별 게시글 수</h4>
              <Bar
                data={{
                  labels: dailyPostStats.labels.filter(label => label.startsWith(selectedMonth)),
                  datasets: [
                    {
                      label: `${selectedMonth} 일별 게시글 수`,
                      data: dailyPostStats.labels
                        .map((label, index) =>
                          label.startsWith(selectedMonth) ? dailyPostStats.data[index] : null
                        )
                        .filter(val => val !== null),
                      backgroundColor: 'rgba(33, 150, 243, 0.6)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: `${selectedMonth} 일별 통계` }
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="admin-subsections">
          <div className="admin-sub-box">
            <h4>📌 최근 가입 회원</h4>
            <ul>
            {(recentMembers || []).map((member) => (
                <li key={member.memberNo}>
                  {member.memberEmail} - {member.memberNickname}
                </li>
              ))}
            </ul>
            <button className="btn-go" onClick={() => window.location.href = '/admin/members'}>
              전체 보기 →
            </button>
          </div>

          <div className="admin-sub-box">
            <h4>📌 최근 신고 게시물 (총 {totalReports}건)</h4>
            <ul>
            {(recentReports || []).map((report, idx) => (
                <li key={idx}>
                  게시글 번호: {report.reportedBoardNo}, 이유: {report.reason}, 날짜: {
    report.createdAt
      ? new Date(
          report.createdAt[0],
          report.createdAt[1] - 1,
          report.createdAt[2],
          report.createdAt[3],
          report.createdAt[4]
        ).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-'
  }
                </li>
              ))}
            </ul>
            <button className="btn-go" onClick={() => window.location.href = '/admin/reports'}>
              전체 보기 →
            </button>
          </div>

          <div className="admin-sub-box">
            <h4>📢 공지사항</h4>
            <label style={{ display: "block", marginBottom: "8px" }}>공지 입력</label>
            <textarea
              placeholder="공지사항 내용을 입력하세요"
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              style={{
                width: "100%", height: "100px", padding: "10px",
                borderRadius: "6px", border: "1px solid #ccc", background: "#f8fbfd",
                marginBottom: "10px"
              }}
            />
            <label style={{ marginTop: "10px", display: "block" }}>시작일</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />

            <label style={{ display: "block" }}>종료일</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />

            <button
              onClick={handleNoticeSubmit}
              className="btn-go"
              style={{ backgroundColor: "#27ae60", color: "#fff", border: "none" }}
            >
              공지사항 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
