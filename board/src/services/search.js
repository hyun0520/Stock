import axios from "axios";

export const fetchSearchItems = async () => {
  const res = await axios.get("/api/search");
  return res.data; // 통합 리스트
};
