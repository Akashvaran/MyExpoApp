import axios from "axios";

const Axios = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  withCredentials: true, 
});

export default Axios;