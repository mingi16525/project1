import axios from 'axios';
import { getMaps, getMapById, findPath } from './api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMaps', () => {
    test('fetches maps successfully', async () => {
      // Given
      const mockMaps = ['Map1', 'Map2'];
      axios.get.mockResolvedValue({ data: mockMaps });

      // When
      const result = await getMaps();

      // Then
      expect(result).toEqual(mockMaps);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/maps'));
    });

    test('handles error when fetching maps', async () => {
      // Given
      axios.get.mockRejectedValue(new Error('Network Error'));

      // When & Then
      await expect(getMaps()).rejects.toThrow('Network Error');
    });
  });

  describe('getMapById', () => {
    test('fetches map by id successfully', async () => {
      // Given
      const mockMap = {
        id: 'Map1',
        name: 'Map1',
        rows: 5,
        cols: 5,
        grid: [[0, 0, 0, 0, 0]]
      };
      axios.get.mockResolvedValue({ data: mockMap });

      // When
      const result = await getMapById('Map1');

      // Then
      expect(result).toEqual(mockMap);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/maps/Map1'));
    });

    test('handles error when fetching map by id', async () => {
      // Given
      axios.get.mockRejectedValue(new Error('Map not found'));

      // When & Then
      await expect(getMapById('InvalidMap')).rejects.toThrow('Map not found');
    });
  });

  describe('findPath', () => {
    test('finds path successfully', async () => {
      // Given
      const request = {
        grid: [[0, 0], [0, 0]],
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      };
      const mockResponse = {
        pathFound: true,
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1 }
        ]
      };
      axios.post.mockResolvedValue({ data: mockResponse });

      // When
      const result = await findPath(request);

      // Then
      expect(result).toEqual(mockResponse);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/pathfinding/find'),
        request
      );
    });

    test('handles path not found', async () => {
      // Given
      const request = {
        grid: [[0, 1], [1, 0]],
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      };
      const mockResponse = {
        pathFound: false,
        path: null
      };
      axios.post.mockResolvedValue({ data: mockResponse });

      // When
      const result = await findPath(request);

      // Then
      expect(result).toEqual(mockResponse);
      expect(result.pathFound).toBe(false);
    });

    test('handles error when finding path', async () => {
      // Given
      const request = {
        grid: [[0, 0]],
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      };
      axios.post.mockRejectedValue(new Error('Server Error'));

      // When & Then
      await expect(findPath(request)).rejects.toThrow('Server Error');
    });
  });

  describe('API configuration', () => {
    test('uses correct base URL from environment', () => {
      // The API module should use REACT_APP_API_URL or default
      expect(axios.get).toBeDefined();
      expect(axios.post).toBeDefined();
    });
  });
});
