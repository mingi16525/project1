package com.game.service;

import com.game.model.PathFindingRequest;
import com.game.model.PathFindingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PathFindingServiceTest {

    private PathFindingService pathFindingService;

    @BeforeEach
    void setUp() {
        pathFindingService = new PathFindingService();
    }

    @Test
    void testFindPathBFSSuccess() {
        // Given - Simple 5x5 grid with clear path
        String[][] tiles = {
            {"x", "0", "0", "0", "0"},
            {"0", "1", "1", "1", "0"},
            {"0", "0", "0", "0", "0"},
            {"0", "1", "1", "1", "0"},
            {"0", "0", "0", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(5);
        request.setHeight(5);
        request.setAlgorithm("BFS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertNotNull(response, "Response should not be null");
        assertTrue(response.isFound(), "Path should be found");
        assertNotNull(response.getPath(), "Path should not be null");
        assertFalse(response.getPath().isEmpty(), "Path should not be empty");
        assertEquals("BFS", response.getAlgorithm(), "Algorithm should be BFS");
    }

    @Test
    void testFindPathDFSSuccess() {
        // Given
        String[][] tiles = {
            {"x", "0", "0"},
            {"0", "0", "0"},
            {"0", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(3);
        request.setAlgorithm("DFS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertTrue(response.isFound(), "Path should be found with DFS");
        assertEquals("DFS", response.getAlgorithm());
    }

    @Test
    void testFindPathAStarSuccess() {
        // Given
        String[][] tiles = {
            {"x", "0", "0"},
            {"0", "1", "0"},
            {"0", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(3);
        request.setAlgorithm("A_STAR");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertTrue(response.isFound(), "Path should be found with A*");
        assertEquals("A_STAR", response.getAlgorithm());
    }

    @Test
    void testFindPathIDSSuccess() {
        // Given
        String[][] tiles = {
            {"x", "0", "y"},
            {"0", "0", "0"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(2);
        request.setAlgorithm("IDS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertTrue(response.isFound(), "Path should be found with IDS");
        assertEquals("IDS", response.getAlgorithm());
    }

    @Test
    void testFindPathNoPathAvailable() {
        // Given - Grid with no path (blocked by obstacles)
        String[][] tiles = {
            {"x", "1", "0", "0", "0"},
            {"0", "1", "0", "0", "0"},
            {"0", "1", "0", "0", "0"},
            {"0", "1", "0", "0", "0"},
            {"0", "1", "0", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(5);
        request.setHeight(5);
        request.setAlgorithm("BFS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertNotNull(response, "Response should not be null");
        assertFalse(response.isFound(), "Path should not be found");
    }

    @Test
    void testFindPathNoStartPosition() {
        // Given - No start position marked
        String[][] tiles = {
            {"0", "0", "0"},
            {"0", "0", "0"},
            {"0", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(3);
        request.setAlgorithm("BFS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertNotNull(response, "Response should not be null");
        assertFalse(response.isFound(), "Path should not be found without start");
    }

    @Test
    void testFindPathNoEndPosition() {
        // Given - No end position marked
        String[][] tiles = {
            {"x", "0", "0"},
            {"0", "0", "0"},
            {"0", "0", "0"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(3);
        request.setAlgorithm("BFS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertNotNull(response, "Response should not be null");
        assertFalse(response.isFound(), "Path should not be found without end");
    }

    @Test
    void testInvalidAlgorithm() {
        // Given
        String[][] tiles = {
            {"x", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(1);
        request.setAlgorithm("INVALID_ALGO");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertNotNull(response, "Response should not be null");
        assertFalse(response.isFound(), "Path should not be found with invalid algorithm");
    }

    @Test
    void testResponseContainsMetrics() {
        // Given
        String[][] tiles = {
            {"x", "0", "y"}
        };
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(1);
        request.setAlgorithm("BFS");
        
        // When
        PathFindingResponse response = pathFindingService.findPath(request);
        
        // Then
        assertTrue(response.getExecutionTime() >= 0, "Execution time should be non-negative");
        assertTrue(response.getNodesExplored() > 0, "Nodes explored should be greater than 0");
        assertNotNull(response.getVisitedNodes(), "Visited nodes should not be null");
    }
}
