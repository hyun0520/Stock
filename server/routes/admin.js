import express from "express";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
import { getUsers, deleteUser } from "../controllers/admin.js";

const router = express.Router();

router.get("/users", auth, admin, getUsers);
router.delete("/users/:id", auth, admin, deleteUser);

export default router;
