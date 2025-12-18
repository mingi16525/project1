import React, { useState, useEffect } from 'react';
import './App.css';
import MapList from './components/MapList';
import GameBoard from './components/GameBoard';
import { getMaps, getMapById } from './services/api';

function App() {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      const data = await getMaps();
      setMaps(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading maps:', error);
      setLoading(false);
    }
  };

  const handleSelectMap = async (mapId) => {
    if (mapId === 'Map0') {
      // Don't load Map0 from server, wait for custom creation
      setSelectedMap(null);
      return;
    }
    
    try {
      const map = await getMapById(mapId);
      setSelectedMap(map);
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const handleCreateCustomMap = (height, width) => {
    // Tạo map mới với kích thước n x m (tất cả ô đều là 0)
    const tiles = Array(height).fill(null).map(() => 
      Array(width).fill('0')
    );

    const customMap = {
      id: 'Map0',
      name: `Map 0 (${height}x${width})`,
      width: width,
      height: height,
      tiles: tiles
    };

    setSelectedMap(customMap);
  };

  const handleMapUpdate = (updatedMap) => {
    setSelectedMap(updatedMap);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 Game Application</h1>
      </header>
      <div className="App-content">
        <div className="sidebar">
          <h2>Maps</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <MapList 
              maps={maps} 
              onSelectMap={handleSelectMap}
              selectedMapId={selectedMap?.id}
              onCreateCustomMap={handleCreateCustomMap}
            />
          )}
        </div>
        <div className="main-content">
          {selectedMap ? (
            <GameBoard 
              map={selectedMap} 
              onMapUpdate={handleMapUpdate}
            />
          ) : (
            <div className="no-map-selected">
              <p>Select a map to start playing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
