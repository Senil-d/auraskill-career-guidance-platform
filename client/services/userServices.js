import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../config/apiConfig";

// Fetch logged-in user's profile
export const getUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const res = await axios.get(`${BASE_URL}/api/auth/get-user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error.response?.data || error.message);
    throw error;
  }
};
