import User from "../models/user.js";

/* ===============================
   관리자: 유저 목록
=============================== */
export const getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

/* ===============================
   관리자: 유저 삭제
=============================== */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({ message: "본인은 삭제 불가" });
  }

  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
};
