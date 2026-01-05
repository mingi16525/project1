import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMaps = async () => {
  const response = await api.get('/api/maps');
  return response.data;
};

export const getMapById = async (id) => {
  const response = await api.get(`/api/maps/${id}`);
  return response.data;
};

export const saveMap = async (map) => {
  const response = await api.post('/api/maps', map);
  return response.data;
};

export const updateMap = async (id, map) => {
  const response = await api.put(`/api/maps/${id}`, map);
  return response.data;
};

export const findPath = async (tiles, width, height, algorithm) => {
  // Support both API: findPath(requestObject) and findPath(tiles,width,height,algorithm)
  let payload;
  if (typeof width === 'undefined' && typeof height === 'undefined' && typeof algorithm === 'undefined' && typeof tiles === 'object') {
    payload = tiles;
  } else {
    payload = { tiles, width, height, algorithm };
  }
  const response = await api.post('/api/pathfinding/find', payload);
  return response.data;
};

export default api;
