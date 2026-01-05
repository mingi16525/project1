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
      onCreateCustomMap(n, m);
    } else {
      alert('Vui lòng nhập kích thước từ 1 đến 30');
    }
  };

  return (
    <div className="map-list">
      {/* Map 0 - Custom Map */}
      <div
        className={`map-item ${selectedMapId === 'Map0' ? 'selected' : ''}`}
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
      {Array.isArray(maps) && maps.map((map) => (
  <div
    key={map.id}
    className={`map-item ${selectedMapId === map.id ? 'selected' : ''}`}
    onClick={() => onSelectMap(map.id)}
  >
    <h3>{map.name}</h3>
    <p>{map.width} x {map.height}</p>
  </div>
))}
    </div>
  );
}

export default MapList;
