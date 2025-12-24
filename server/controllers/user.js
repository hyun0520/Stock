import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

/* 회원가입 */
export const register = async (req, res) => {
  try {
    const { username, email, password, birthDate } = req.body;

    // 필수값 검사
    if (!username || !email || !password || !birthDate) {
      return res.status(400).json({ message: "모든 필드는 필수입니다." });
    }

    // 이메일 형식 검사 (@ 포함)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "잘못된 이메일 형식 입니다." });
    }

    // 아이디(username) 중복 검사
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "중복된 아이디 입니다." });
    }

    // 이메일 중복 검사
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "이미 사용중인 이메일입니다." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      birthDate: new Date(birthDate),
    });

    res.json({
      message: "Register successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        birthDate: user.birthDate,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
/* 아이디(username) 중복 체크 */
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "아이디가 존재하지 않습니다." });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 로그인 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "사용자를 찾을 수 없습니다" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다" });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        birthDate: user.birthDate,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 로그인 유지용: 내 정보 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
