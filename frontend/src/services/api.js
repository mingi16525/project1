import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMaps = async () => {
  const response = await api.get('/maps');
  return response.data;
};

export const getMapById = async (id) => {
  const response = await api.get(`/maps/${id}`);
  return response.data;
};

export const saveMap = async (map) => {
  const response = await api.post('/maps', map);
  return response.data;
};

export const updateMap = async (id, map) => {
  const response = await api.put(`/maps/${id}`, map);
  return response.data;
};

export const findPath = async (tiles, width, height, algorithm) => {
  const response = await api.post('/pathfinding', {
    tiles,
    width,
    height,
    algorithm
  });
  return response.data;
};

export default api;
