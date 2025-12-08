import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export async function uploadImage(file, style) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("style_name", style);

    const res = await axios.post(`${API_BASE}/style/image`, formData);
    return res.data; // base64 hoặc url
}

export async function getStyles() {
    const res = await axios.get(`${API_BASE}/styles`);
    return res.data;
}
