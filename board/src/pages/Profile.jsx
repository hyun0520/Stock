export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ padding: 40 }}>
      <h2>👤 내 정보</h2>

      <p><strong>Username:</strong> {user?.username}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Password:</strong> {user?.password}</p>
      <p><strong>Birth Date:</strong> {new Date(user?.birthDate).toLocaleDateString()}</p>
    </div>
  );
}
