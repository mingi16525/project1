import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameBoard from './GameBoard';

describe('GameBoard Component', () => {
  const mockMap = {
    id: 'Map1',
    name: 'Test Map',
    rows: 3,
    cols: 3,
    grid: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ]
  };

  test('renders game board with map name', () => {
    // When
    render(<GameBoard map={mockMap} onMapUpdate={jest.fn()} />);
    
    // Then
    expect(screen.getByText(/Test Map/i)).toBeInTheDocument();
  });

  test('renders grid with correct dimensions', () => {
    // When
    const { container } = render(<GameBoard map={mockMap} onMapUpdate={jest.fn()} />);
    
    // Then
    const cells = container.querySelectorAll('.cell');
    expect(cells.length).toBe(9); // 3x3 grid
  });

  test('displays obstacles correctly', () => {
    // When
    const { container } = render(<GameBoard map={mockMap} onMapUpdate={jest.fn()} />);
    
    // Then
    const obstacles = container.querySelectorAll('.cell.obstacle');
    expect(obstacles.length).toBe(1); // One obstacle at [1,1]
  });

  test('displays walkable cells correctly', () => {
    // When
    const { container } = render(<GameBoard map={mockMap} onMapUpdate={jest.fn()} />);
    
    // Then
    const walkable = container.querySelectorAll('.cell.walkable');
    expect(walkable.length).toBe(8); // 8 walkable cells
  });

  test('handles null map gracefully', () => {
    // When
    const { container } = render(<GameBoard map={null} onMapUpdate={jest.fn()} />);
    
    // Then
    expect(container.querySelector('.game-board')).toBeInTheDocument();
  });

  test('handles empty grid', () => {
    // Given
    const emptyMap = { ...mockMap, grid: [] };
    
    // When
    const { container } = render(<GameBoard map={emptyMap} onMapUpdate={jest.fn()} />);
    
    // Then
    const cells = container.querySelectorAll('.cell');
    expect(cells.length).toBe(0);
  });
});
