import "../styles/global.css";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">MY PROFILE</h2>

        <div className="profile-row">
          <span className="label">Username</span>
          <span className="value">{user?.username}</span>
        </div>

        <div className="profile-row">
          <span className="label">이메일</span>
          <span className="value">{user?.email}</span>
        </div>

        <div className="profile-row">
          <span className="label">비밀번호</span>
          <span className="value">••••••••</span>
        </div>

        <div className="profile-row">
          <span className="label">생년월일</span>
          <span className="value">
            {user?.birthDate
              ? new Date(user.birthDate).toLocaleDateString()
              : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
