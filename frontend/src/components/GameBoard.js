import React, { useState, useEffect, useRef } from 'react';
import './GameBoard.css';
import { findPath } from '../services/api';
import { PlayerMovement } from '../services/PlayerMovement';

const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

function GameBoard({ map, onMapUpdate }) {
  const [editMode, setEditMode] = useState(null); // null, 'start', 'start2', 'obstacle', 'end'

  const normalizeMap = (m) => {
    if (!m) {
      return { id: '', name: '', width: 0, height: 0, tiles: [] };
    }
    // If already using `tiles` shape, ensure strings
    if (m.tiles) {
      return {
        id: m.id || '',
        name: m.name || '',
        width: m.width || (m.tiles[0] ? m.tiles[0].length : 0),
        height: m.height || (m.tiles ? m.tiles.length : 0),
        tiles: m.tiles.map(row => row.map(String)),
      };
    }
    // Accept older test shape using grid / rows / cols
    if (m.grid) {
      return {
        id: m.id || '',
        name: m.name || '',
        width: m.cols || m.width || (m.grid[0] ? m.grid[0].length : 0),
        height: m.rows || m.height || (m.grid ? m.grid.length : 0),
        tiles: m.grid.map(row => row.map(String)),
      };
    }
    // Fallback
    return { id: m.id || '', name: m.name || '', width: 0, height: 0, tiles: [] };
  };

  const [localMap, setLocalMap] = useState(() => normalizeMap(map));
  const [currentPath, setCurrentPath] = useState([]);
  const [currentPath2, setCurrentPath2] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [playerPosition2, setPlayerPosition2] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pathInfo, setPathInfo] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [showVisitedNodes, setShowVisitedNodes] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [visitedNodes2, setVisitedNodes2] = useState([]);
  const [animatedVisitedNodes, setAnimatedVisitedNodes] = useState([]);
  const [animatedVisitedNodes2, setAnimatedVisitedNodes2] = useState([]);
  const [isAnimatingVisited, setIsAnimatingVisited] = useState(false);
  const [visitedAnimationSpeed, setVisitedAnimationSpeed] = useState(100);
  const playerMovementRef = useRef(null);
  const playerMovement2Ref = useRef(null);
  const visitedAnimationRef = useRef(null);
  const visitedAnimation2Ref = useRef(null);

  // Update local map when prop changes
  useEffect(() => {
    setLocalMap(normalizeMap(map));
    setCurrentPath([]);
    setCurrentPath2([]);
    setPlayerPosition(null);
    setPlayerPosition2(null);
    setPathInfo(null);
    setShowVisitedNodes(false);
    setVisitedNodes([]);
    setVisitedNodes2([]);
    setAnimatedVisitedNodes([]);
    setAnimatedVisitedNodes2([]);
    setIsAnimatingVisited(false);
    if (visitedAnimationRef.current) {
      clearTimeout(visitedAnimationRef.current);
    }
    if (visitedAnimation2Ref.current) {
      clearTimeout(visitedAnimation2Ref.current);
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
    } else if (editMode === 'start2') {
      // Xóa điểm xuất phát thứ 2 cũ (nếu có)
      for (let i = 0; i < newTiles.length; i++) {
        for (let j = 0; j < newTiles[i].length; j++) {
          if (newTiles[i][j] === 'z') {
            newTiles[i][j] = '0';
          }
        }
      }
      // Đặt điểm xuất phát thứ 2 mới
      newTiles[rowIndex][colIndex] = 'z';
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
        
        // Handle second player if exists
        if (response.path2 && response.path2.length > 0) {
          setCurrentPath2(response.path2);
          setVisitedNodes2(response.visitedNodes2 || []);
          setAnimatedVisitedNodes2([]);
        }
        
        // Animate visited nodes first if enabled
        if (showVisitedNodes && response.visitedNodes && response.visitedNodes.length > 0) {
          await animateVisitedNodes(response.visitedNodes, setAnimatedVisitedNodes, visitedAnimationRef);
        }
        
        // Animate second player's visited nodes
        if (showVisitedNodes && response.visitedNodes2 && response.visitedNodes2.length > 0) {
          await animateVisitedNodes(response.visitedNodes2, setAnimatedVisitedNodes2, visitedAnimation2Ref);
        }
        
        // Then initialize player movement
        const movement = new PlayerMovement(localMap, (position, index) => {
          setPlayerPosition(position);
        });
        playerMovementRef.current = movement;
        
        movement.setPath(response.path);
        const animationPromise1 = movement.animatePath();
        
        // Initialize second player movement if exists
        let animationPromise2 = Promise.resolve();
        if (response.path2 && response.path2.length > 0) {
          const movement2 = new PlayerMovement(localMap, (position, index) => {
            setPlayerPosition2(position);
          });
          playerMovement2Ref.current = movement2;
          movement2.setPath(response.path2);
          animationPromise2 = movement2.animatePath();
        }
        
        // Wait for both animations to complete
        await Promise.all([animationPromise1, animationPromise2]);
        
        setIsAnimating(false);
      } else {
        setVisitedNodes(response.visitedNodes || []);
        setAnimatedVisitedNodes([]);
        
        // Handle second player visited nodes even if first player failed
        if (response.visitedNodes2) {
          setVisitedNodes2(response.visitedNodes2);
          setAnimatedVisitedNodes2([]);
        }
        
        // Still animate visited nodes even if no path found
        if (showVisitedNodes && response.visitedNodes && response.visitedNodes.length > 0) {
          await animateVisitedNodes(response.visitedNodes, setAnimatedVisitedNodes, visitedAnimationRef);
        }
        
        if (showVisitedNodes && response.visitedNodes2 && response.visitedNodes2.length > 0) {
          await animateVisitedNodes(response.visitedNodes2, setAnimatedVisitedNodes2, visitedAnimation2Ref);
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

  const animateVisitedNodes = async (nodes, setAnimatedNodes, animationRef) => {
    setIsAnimatingVisited(true);
    setAnimatedNodes([]);
    
    for (let i = 0; i < nodes.length; i++) {
      await new Promise(resolve => {
        animationRef.current = setTimeout(() => {
          setAnimatedNodes(prev => [...prev, nodes[i]]);
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
    if (playerMovement2Ref.current) {
      playerMovement2Ref.current.stopAnimation();
    }
    if (visitedAnimationRef.current) {
      clearTimeout(visitedAnimationRef.current);
    }
    if (visitedAnimation2Ref.current) {
      clearTimeout(visitedAnimation2Ref.current);
    }
    setIsAnimating(false);
    setIsAnimatingVisited(false);
  };

  const handleResetAnimation = () => {
    if (playerMovementRef.current) {
      playerMovementRef.current.reset();
    }
    if (playerMovement2Ref.current) {
      playerMovement2Ref.current.reset();
    }
    if (visitedAnimationRef.current) {
      clearTimeout(visitedAnimationRef.current);
    }
    if (visitedAnimation2Ref.current) {
      clearTimeout(visitedAnimation2Ref.current);
    }
    setCurrentPath([]);
    setCurrentPath2([]);
    setPlayerPosition(null);
    setPlayerPosition2(null);
    setPathInfo(null);
    setSelectedAlgorithm(null);
    setShowVisitedNodes(false);
    setVisitedNodes([]);
    setVisitedNodes2([]);
    setAnimatedVisitedNodes([]);
    setAnimatedVisitedNodes2([]);
    setIsAnimatingVisited(false);
  };

  const handleReplayVisited = async () => {
    if (visitedNodes.length === 0 && visitedNodes2.length === 0) return;
    setIsAnimatingVisited(true);
    
    const promises = [];
    if (visitedNodes.length > 0) {
      promises.push(animateVisitedNodes(visitedNodes, setAnimatedVisitedNodes, visitedAnimationRef));
    }
    if (visitedNodes2.length > 0) {
      promises.push(animateVisitedNodes(visitedNodes2, setAnimatedVisitedNodes2, visitedAnimation2Ref));
    }
    
    await Promise.all(promises);
  };

  const renderTileContent = (tile, rowIndex, colIndex) => {
    // Check if player 1 is at this position
    if (playerPosition && playerPosition.row === rowIndex && playerPosition.col === colIndex) {
      return <img src={`${API_BASE_URL}/api/images/mario.jpeg`} alt="Player 1" className="player-marker-image player-1" />;
    }
    
    // Check if player 2 is at this position
    if (playerPosition2 && playerPosition2.row === rowIndex && playerPosition2.col === colIndex) {
      return <img src={`${API_BASE_URL}/api/images/mario.jpeg`} alt="Player 2" className="player-marker-image player-2" />;
    }
    
    // Don't show start image if player is animating and this is the start position
    if (tile === 'x') {
      // Check if this is the start position and player has moved away
      if (isAnimating && playerPosition && !(playerPosition.row === rowIndex && playerPosition.col === colIndex)) {
        return null; // Hide mario at start position when player is moving
      }
      return <img src={`${API_BASE_URL}/api/images/mario.jpeg`} alt="Start" className="tile-image" />;
    } else if (tile === 'z') {
      // Second player start
      if (isAnimating && playerPosition2 && !(playerPosition2.row === rowIndex && playerPosition2.col === colIndex)) {
        return null;
      }
      return <img src={`${API_BASE_URL}/api/images/mario.jpeg`} alt="Start 2" className="tile-image player-2-start" />;
    } else if (tile === 'y') {
      return <img src={`${API_BASE_URL}/api/images/diamond.jpg`} alt="End" className="tile-image" />;
    }
    return null;
  };

  const getTileClass = (tile, rowIndex, colIndex) => {
    let className = 'cell tile';
    
    if (tile === '1') {
      className += ' blocked obstacle';
    } else if (tile === 'x') {
      className += ' start';
    } else if (tile === 'z') {
      className += ' start start2';
    } else if (tile === 'y') {
      className += ' end';
    } else {
      className += ' empty walkable';
    }

    // Highlight visited nodes if enabled (use animated nodes if animation is enabled)
    const nodesToShow = showVisitedNodes ? (isAnimatingVisited ? animatedVisitedNodes : visitedNodes) : [];
    const nodesToShow2 = showVisitedNodes ? (isAnimatingVisited ? animatedVisitedNodes2 : visitedNodes2) : [];
    
    if (nodesToShow.length > 0) {
      const isVisited = nodesToShow.some(pos => pos.row === rowIndex && pos.col === colIndex);
      if (isVisited && tile !== 'x' && tile !== 'z' && tile !== 'y') {
        className += ' visited';
      }
    }
    
    if (nodesToShow2.length > 0) {
      const isVisited2 = nodesToShow2.some(pos => pos.row === rowIndex && pos.col === colIndex);
      if (isVisited2 && tile !== 'x' && tile !== 'z' && tile !== 'y') {
        className += ' visited2';
      }
    }

    // Highlight path (hide when animating visited nodes)
    if (currentPath.length > 0 && !isAnimatingVisited) {
      const isInPath = currentPath.some(pos => pos.row === rowIndex && pos.col === colIndex);
      if (isInPath) {
        className += ' in-path';
      }
    }
    
    if (currentPath2.length > 0 && !isAnimatingVisited) {
      const isInPath2 = currentPath2.some(pos => pos.row === rowIndex && pos.col === colIndex);
      if (isInPath2) {
        className += ' in-path2';
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
          Thêm điểm xuất phát 1 (x)
        </button>
        <button 
          className={`tool-btn start2-btn ${editMode === 'start2' ? 'active' : ''}`}
          onClick={() => setEditMode(editMode === 'start2' ? null : 'start2')}
          disabled={isAnimating}
        >
          <div className="btn-icon circle-icon"></div>
          Thêm điểm xuất phát 2 (z)
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
            <div className="player-info">
              <h4>🎮 Nhân vật 1:</h4>
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
                </>
              )}
            </div>
            {pathInfo.path2 && (
              <div className="player-info">
                <h4>🎮 Nhân vật 2:</h4>
                <div className="info-item">
                  <strong>Tìm thấy:</strong> {pathInfo.found2 ? 'Có' : 'Không'}
                </div>
                {pathInfo.found2 && (
                  <>
                    <div className="info-item">
                      <strong>Độ dài đường đi:</strong> {pathInfo.path2.length} bước
                    </div>
                    <div className="info-item">
                      <strong>Số node đã duyệt:</strong> {pathInfo.nodesExplored2}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="info-item">
              <strong>Thời gian:</strong> {pathInfo.executionTime} ms
            </div>
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
