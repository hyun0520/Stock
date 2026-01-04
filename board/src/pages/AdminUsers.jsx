import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        setUsers(res.data || []);
      } catch (err) {
        alert("관리자 권한이 필요합니다");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("이 유저를 삭제할까요?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("삭제 실패");
    }
  };

  if (loading) {
    return <div className="admin-loading">로딩중...</div>;
  }

  return (
    <div className="admin-users">
      <h2 className="admin-title">유저 관리</h2>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>권한</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className={`role-badge ${
                      u.role === "admin" ? "admin" : "user"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td align="right">
                  {u.role !== "admin" && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(u._id)}
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
