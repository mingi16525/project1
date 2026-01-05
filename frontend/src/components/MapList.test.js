import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapList from './MapList';

describe('MapList Component', () => {
  const mockMaps = ['Map1', 'Map2', 'Map3'];
  const mockOnSelectMap = jest.fn();
  const mockOnCreateCustomMap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all maps', () => {
    // When
    render(
      <MapList 
        maps={mockMaps} 
        onSelectMap={mockOnSelectMap}
        onCreateCustomMap={mockOnCreateCustomMap}
      />
    );
    
    // Then
    expect(screen.getByText('Map1')).toBeInTheDocument();
    expect(screen.getByText('Map2')).toBeInTheDocument();
    expect(screen.getByText('Map3')).toBeInTheDocument();
  });

  test('calls onSelectMap when map is clicked', () => {
    // Given
    render(
      <MapList 
        maps={mockMaps} 
        onSelectMap={mockOnSelectMap}
        onCreateCustomMap={mockOnCreateCustomMap}
      />
    );
    
    // When
    const map1Button = screen.getByText('Map1');
    fireEvent.click(map1Button);
    
    // Then
    expect(mockOnSelectMap).toHaveBeenCalledWith('Map1');
    expect(mockOnSelectMap).toHaveBeenCalledTimes(1);
  });

  test('highlights selected map', () => {
    // When
    const { container } = render(
      <MapList 
        maps={mockMaps} 
        onSelectMap={mockOnSelectMap}
        selectedMapId="Map2"
        onCreateCustomMap={mockOnCreateCustomMap}
      />
    );
    
    // Then
    const map2Button = screen.getByText('Map2').closest('button');
    expect(map2Button).toHaveClass('selected');
  });

  test('renders empty list when no maps provided', () => {
    // When
    const { container } = render(
      <MapList 
        maps={[]} 
        onSelectMap={mockOnSelectMap}
        onCreateCustomMap={mockOnCreateCustomMap}
      />
    );
    
    // Then
    const mapButtons = container.querySelectorAll('.map-item');
    expect(mapButtons.length).toBe(0);
  });

  test('handles undefined maps array', () => {
    // When & Then
    expect(() => {
      render(
        <MapList 
          maps={undefined} 
          onSelectMap={mockOnSelectMap}
          onCreateCustomMap={mockOnCreateCustomMap}
        />
      );
    }).not.toThrow();
  });

  test('each map has unique key', () => {
    // When
    const { container } = render(
      <MapList 
        maps={mockMaps} 
        onSelectMap={mockOnSelectMap}
        onCreateCustomMap={mockOnCreateCustomMap}
      />
    );
    
    // Then
    const mapButtons = container.querySelectorAll('.map-item');
    expect(mapButtons.length).toBe(mockMaps.length);
  });
});
