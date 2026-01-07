import React, { useState } from 'react';
import './MapList.css';

function MapList({ maps, onSelectMap, selectedMapId, onCreateCustomMap }) {
  const [customWidth, setCustomWidth] = useState(10);
  const [customHeight, setCustomHeight] = useState(10);
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  const handleMap0Click = () => {
    if (selectedMapId === 'Map0') {
      setShowCustomInputs(!showCustomInputs);
    } else {
      setShowCustomInputs(true);
      onSelectMap('Map0');
    }
  };

  const handleCreateCustomMap = () => {
    const n = parseInt(customHeight) || 10;
    const m = parseInt(customWidth) || 10;
    
    if (n > 0 && m > 0 && n <= 30 && m <= 30) {
// Sinh điểm bắt đầu ngẫu nhiên
      const startRow = Math.floor(Math.random() * n);
      const startCol = Math.floor(Math.random() * m);
      
      // Sinh điểm kết thúc ngẫu nhiên (khác điểm bắt đầu)
      let endRow, endCol;
      do {
        endRow = Math.floor(Math.random() * n);
        endCol = Math.floor(Math.random() * m);
      } while (startRow === endRow && startCol === endCol);
      
      onCreateCustomMap(n, m, { row: startRow, col: startCol }, { row: endRow, col: endCol });    } else {
      alert('Vui lòng nhập kích thước từ 1 đến 30');
    }
  };

  return (
    <div className="map-list">
      {/* Map 0 - Custom Map */}
      <div
        className={`custom-map ${selectedMapId === 'Map0' ? 'selected' : ''}`}
      >
        <div onClick={handleMap0Click} style={{ cursor: 'pointer' }}>
          <h3>Map 0 (Custom)</h3>
          <p>Tạo map tùy chỉnh</p>
        </div>
        
        {showCustomInputs && (
          <div className="custom-map-inputs">
            <div className="input-group">
              <label>Chiều cao (n):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="input-group">
              <label>Chiều rộng (m):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button 
              className="create-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateCustomMap();
              }}
            >
              Tạo Map
            </button>
          </div>
        )}
      </div>

      {/* Existing Maps */}
      {Array.isArray(maps) && maps.map((m, idx) => {
        const map = typeof m === 'string' ? { id: m, name: m, width: '', height: '' } : m || {};
        const key = map.id || `map-${idx}`;
        return (
          <button
            key={key}
            type="button"
            className={`map-item ${selectedMapId === map.id ? 'selected' : ''}`}
            onClick={() => onSelectMap && onSelectMap(map.id)}
          >
            <h3>{map.name}</h3>
            <p>{map.width} {map.width && 'x'} {map.height}</p>
          </button>
        );
      })}
    </div>
  );
}

export default MapList;
