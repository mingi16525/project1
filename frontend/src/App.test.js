import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as api from './services/api';

// Mock the API module
jest.mock('./services/api');

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders app header', () => {
    // Given
    api.getMaps.mockResolvedValue([]);
    
    // When
    render(<App />);
    
    // Then
    const headerElement = screen.getByText(/Game Application/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    // Given
    api.getMaps.mockResolvedValue([]);
    
    // When
    render(<App />);
    
    // Then
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test('loads and displays maps', async () => {
    // Given
    const mockMaps = ['Map1', 'Map2'];
    api.getMaps.mockResolvedValue(mockMaps);
    
    // When
    render(<App />);
    
    // Then
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });

  test('displays no map selected message initially', async () => {
    // Given
    api.getMaps.mockResolvedValue(['Map1']);
    
    // When
    render(<App />);
    
    // Then
    await waitFor(() => {
      expect(screen.getByText(/Select a map to start playing/i)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    // Given
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.getMaps.mockRejectedValue(new Error('API Error'));
    
    // When
    render(<App />);
    
    // Then
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    consoleError.mockRestore();
  });
});
