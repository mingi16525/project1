import React, { useState, useEffect, useRef } from 'react';
import './GameBoard.css';
import { findPath } from '../services/api';
import { PlayerMovement } from '../services/PlayerMovement';

const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

function GameBoard({ map, onMapUpdate }) {
  const [editMode, setEditMode] = useState(null); // null, 'start', 'obstacle', 'end'
  const [localMap, setLocalMap] = useState(map);
  const [currentPath, setCurrentPath] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pathInfo, setPathInfo] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [showVisitedNodes, setShowVisitedNodes] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [animatedVisitedNodes, setAnimatedVisitedNodes] = useState([]);
  const [isAnimatingVisited, setIsAnimatingVisited] = useState(false);
  const [visitedAnimationSpeed, setVisitedAnimationSpeed] = useState(100);
  const playerMovementRef = useRef(null);
  const visitedAnimationRef = useRef(null);

  // Update local map when prop changes
  useEffect(() => {
    setLocalMap(map);
    setCurrentPath([]);
    setPlayerPosition(null);
    setPathInfo(null);
    setShowVisitedNodes(false);
    setVisitedNodes([]);
    setAnimatedVisitedNodes([]);
    setIsAnimatingVisited(false);
    if (visitedAnimationRef.current) {
      clearTimeout(visitedAnimationRef.current);
    }
  }, [map]);

  const handleTileClick = (rowIndex, colIndex) => {
    if (!editMode) return;

    const newTiles = localMap.tiles.map(row => [...row]);
    
    if (editMode === 'start') {
      // Xóa điểm xuất phát cũ (nếu có)
      for (let i = 0; i < newTiles.length; i++) {
        for (let j = 0; j < newTiles[i].length; j++) {
          if (newTiles[i][j] === 'x') {
            newTiles[i][j] = '0';
          }
        }
      }
      // Đặt điểm xuất phát mới
      newTiles[rowIndex][colIndex] = 'x';
    } else if (editMode === 'obstacle') {
      // Toggle chướng ngại vật
      if (newTiles[rowIndex][colIndex] === '1') {
        newTiles[rowIndex][colIndex] = '0';
      } else if (newTiles[rowIndex][colIndex] === '0') {
        newTiles[rowIndex][colIndex] = '1';
      }
    } else if (editMode === 'end') {
      // Xóa điểm kết thúc cũ (nếu có)
      for (let i = 0; i < newTiles.length; i++) {
        for (let j = 0; j < newTiles[i].length; j++) {
          if (newTiles[i][j] === 'y') {
            newTiles[i][j] = '0';
          }
        }
      }
      // Đặt điểm kết thúc mới
      newTiles[rowIndex][colIndex] = 'y';
    }

    const updatedMap = {
      ...localMap,
      tiles: newTiles
    };
    
    setLocalMap(updatedMap);
    if (onMapUpdate) {
      onMapUpdate(updatedMap);
    }
  };

  const handleRunAlgorithm = async (algorithm) => {
    try {
      setSelectedAlgorithm(algorithm);
      setIsAnimating(true);
      
      const response = await findPath(
        localMap.tiles,
        localMap.width,
        localMap.height,
        algorithm
      );

      setPathInfo(response);

      if (response.found && response.path && response.path.length > 0) {
        setCurrentPath(response.path);
        setVisitedNodes(response.visitedNodes || []);
        setAnimatedVisitedNodes([]);
        
        // Animate visited nodes first if enabled
        if (showVisitedNodes && response.visitedNodes && response.visitedNodes.length > 0) {
          await animateVisitedNodes(response.visitedNodes);
        }
        
        // Then initialize player movement
        const movement = new PlayerMovement(localMap, (position, index) => {
          setPlayerPosition(position);
        });
        playerMovementRef.current = movement;
        
        movement.setPath(response.path);
        await movement.animatePath();
        
        setIsAnimating(false);
      } else {
        setVisitedNodes(response.visitedNodes || []);
        setAnimatedVisitedNodes([]);
        
        // Still animate visited nodes even if no path found
        if (showVisitedNodes && response.visitedNodes && response.visitedNodes.length > 0) {
          await animateVisitedNodes(response.visitedNodes);
        }
        
        alert('Không tìm thấy đường đi!');
        setIsAnimating(false);
      }
    } catch (error) {
      console.error('Error finding path:', error);
      alert('Lỗi khi tìm đường đi!');
      setIsAnimating(false);
    }
  };

  const animateVisitedNodes = async (nodes) => {
    setIsAnimatingVisited(true);
    setAnimatedVisitedNodes([]);
    
    for (let i = 0; i < nodes.length; i++) {
      await new Promise(resolve => {
        visitedAnimationRef.current = setTimeout(() => {
          setAnimatedVisitedNodes(prev => [...prev, nodes[i]]);
          resolve();
        }, visitedAnimationSpeed);
      });
    }
    
    setIsAnimatingVisited(false);
  };

  const handleStopAnimation = () => {
    if (playerMovementRef.current) {
      playerMovementRef.current.stopAnimation();
    }
    if (visitedAnimationRef.current) {
      clearTimeout(visitedAnimationRef.current);
    }
    setIsAnimating(false);
    setIsAnimatingVisited(false);
  };

  const handleResetAnimation = () => {
    if (playerMovementRef.current) {
      playerMovementRef.current.reset();
    }
    if (visitedAnimationRef.current) {
      clearTimeout(visitedAnimationRef.current);
    }
    setCurrentPath([]);
    setPlayerPosition(null);
    setPathInfo(null);
    setSelectedAlgorithm(null);
    setShowVisitedNodes(false);
    setVisitedNodes([]);
    setAnimatedVisitedNodes([]);
    setIsAnimatingVisited(false);
  };

  const handleReplayVisited = async () => {
    if (visitedNodes.length === 0) return;
    setIsAnimatingVisited(true);
    await animateVisitedNodes(visitedNodes);
  };

  const renderTileContent = (tile, rowIndex, colIndex) => {
    // Check if player is at this position
    if (playerPosition && playerPosition.row === rowIndex && playerPosition.col === colIndex) {
      return <img src={`${API_BASE_URL}/api/images/mario.jpeg`} alt="Player" className="player-marker-image" />;
    }
    
    // Don't show start image if player is animating and this is the start position
    if (tile === 'x') {
      // Check if this is the start position and player has moved away
      if (isAnimating && playerPosition && !(playerPosition.row === rowIndex && playerPosition.col === colIndex)) {
        return null; // Hide mario at start position when player is moving
      }
      return <img src={`${API_BASE_URL}/api/images/mario.jpeg`} alt="Start" className="tile-image" />;
    } else if (tile === 'y') {
      return <img src={`${API_BASE_URL}/api/images/diamond.jpg`} alt="End" className="tile-image" />;
    }
    return null;
  };

  const getTileClass = (tile, rowIndex, colIndex) => {
    let className = 'tile';
    
    if (tile === '1') {
      className += ' blocked';
    } else if (tile === 'x') {
      className += ' start';
    } else if (tile === 'y') {
      className += ' end';
    } else {
      className += ' empty';
    }

    // Highlight visited nodes if enabled (use animated nodes if animation is enabled)
    const nodesToShow = showVisitedNodes ? (isAnimatingVisited ? animatedVisitedNodes : visitedNodes) : [];
    if (nodesToShow.length > 0) {
      const isVisited = nodesToShow.some(pos => pos.row === rowIndex && pos.col === colIndex);
      if (isVisited && tile !== 'x' && tile !== 'y') {
        className += ' visited';
      }
    }

    // Highlight path (hide when animating visited nodes)
    if (currentPath.length > 0 && !isAnimatingVisited) {
      const isInPath = currentPath.some(pos => pos.row === rowIndex && pos.col === colIndex);
      if (isInPath) {
        className += ' in-path';
      }
    }

    return className;
  };

  return (
    <div className="game-board">
      <h2>{localMap.name}</h2>
      <div className="board-info">
        <span>Map ID: {localMap.id}</span>
        <span>Size: {localMap.width} x {localMap.height}</span>
      </div>

      {/* Edit Tools */}
      <div className="edit-tools">
        <button 
          className={`tool-btn start-btn ${editMode === 'start' ? 'active' : ''}`}
          onClick={() => setEditMode(editMode === 'start' ? null : 'start')}
          disabled={isAnimating}
        >
          <div className="btn-icon circle-icon"></div>
          Thêm điểm xuất phát (x)
        </button>
        <button 
          className={`tool-btn obstacle-btn ${editMode === 'obstacle' ? 'active' : ''}`}
          onClick={() => setEditMode(editMode === 'obstacle' ? null : 'obstacle')}
          disabled={isAnimating}
        >
          <div className="btn-icon block-icon"></div>
          Thêm chướng ngại (1)
        </button>
        <button 
          className={`tool-btn end-btn ${editMode === 'end' ? 'active' : ''}`}
          onClick={() => setEditMode(editMode === 'end' ? null : 'end')}
          disabled={isAnimating}
        >
          <div className="btn-icon diamond-icon"></div>
          Thêm điểm kết thúc (y)
        </button>
        {editMode && (
          <button 
            className="tool-btn clear-btn"
            onClick={() => setEditMode(null)}
          >
            Kết thúc chỉnh sửa
          </button>
        )}
      </div>

      {/* Algorithm Buttons */}
      <div className="algorithm-tools">
        <h3>Thuật toán tìm đường:</h3>
        <div className="algorithm-buttons">
          <button 
            className={`algo-btn ${selectedAlgorithm === 'BFS' ? 'active' : ''}`}
            onClick={() => handleRunAlgorithm('BFS')}
            disabled={isAnimating}
          >
            🔍 BFS
          </button>
          <button 
            className={`algo-btn ${selectedAlgorithm === 'DFS' ? 'active' : ''}`}
            onClick={() => handleRunAlgorithm('DFS')}
            disabled={isAnimating}
          >
            🌲 DFS
          </button>
          <button 
            className={`algo-btn ${selectedAlgorithm === 'A_STAR' ? 'active' : ''}`}
            onClick={() => handleRunAlgorithm('A_STAR')}
            disabled={isAnimating}
          >
            ⭐ A*
          </button>
          <button 
            className={`algo-btn ${selectedAlgorithm === 'IDS' ? 'active' : ''}`}
            onClick={() => handleRunAlgorithm('IDS')}
            disabled={isAnimating}
          >
            🔄 IDS
          </button>
          {isAnimating && (
            <button 
              className="algo-btn stop-btn"
              onClick={handleStopAnimation}
            >
              ⏸ Dừng
            </button>
          )}
          {currentPath.length > 0 && !isAnimating && (
            <button 
              className="algo-btn reset-btn"
              onClick={handleResetAnimation}
            >
              🔄 Reset
            </button>
          )}
          {visitedNodes.length > 0 && (
            <>
              <button 
                className={`algo-btn visited-btn ${showVisitedNodes ? 'active' : ''}`}
                onClick={() => setShowVisitedNodes(!showVisitedNodes)}
                disabled={isAnimating}
              >
                👁 {showVisitedNodes ? 'Ẩn' : 'Hiện'} lịch sử duyệt
              </button>
              {showVisitedNodes && (
                <button 
                  className="algo-btn replay-visited-btn"
                  onClick={handleReplayVisited}
                  disabled={isAnimatingVisited}
                >
                  ▶ Phát lại lịch sử
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Animation Speed Control */}
        {showVisitedNodes && (
          <div className="speed-control">
            <label>
              🎚️ Tốc độ hiển thị lịch sử: {visitedAnimationSpeed}ms
              <input 
                type="range" 
                min="10" 
                max="500" 
                step="10" 
                value={visitedAnimationSpeed}
                onChange={(e) => setVisitedAnimationSpeed(Number(e.target.value))}
                disabled={isAnimatingVisited}
              />
            </label>
            <span className="speed-label">
              {visitedAnimationSpeed <= 50 ? '⚡ Nhanh' : visitedAnimationSpeed <= 200 ? '⏩ Trung bình' : '🐢 Chậm'}
            </span>
          </div>
        )}
        
        {/* Path Info */}
        {pathInfo && (
          <div className="path-info">
            <div className="info-item">
              <strong>Thuật toán:</strong> {pathInfo.algorithm}
            </div>
            <div className="info-item">
              <strong>Tìm thấy:</strong> {pathInfo.found ? 'Có' : 'Không'}
            </div>
            {pathInfo.found && (
              <>
                <div className="info-item">
                  <strong>Độ dài đường đi:</strong> {pathInfo.path.length} bước
                </div>
                <div className="info-item">
                  <strong>Số node đã duyệt:</strong> {pathInfo.nodesExplored}
                </div>
                <div className="info-item">
                  <strong>Thời gian:</strong> {pathInfo.executionTime} ms
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div 
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${localMap.width}, 50px)`,
          gridTemplateRows: `repeat(${localMap.height}, 50px)`,
        }}
      >
        {localMap.tiles.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`${getTileClass(tile, rowIndex, colIndex)} ${editMode ? 'editable' : ''}`}
              title={`${tile} (${rowIndex}, ${colIndex})`}
              onClick={() => handleTileClick(rowIndex, colIndex)}
            >
              {renderTileContent(tile, rowIndex, colIndex)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GameBoard;
