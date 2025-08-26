import axios from "axios";

const httpClient = axios.create({
  baseURL: "https://senai-tcc-backend-gb.onrender.com", 
  timeout: 30000, 
});

export default httpClient;
