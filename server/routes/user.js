import express from "express";
import { register, login, getMe, checkUsername } from "../controllers/user.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);
// 아이디 중복 체크
router.get("/check-username", checkUsername);

export default router;
