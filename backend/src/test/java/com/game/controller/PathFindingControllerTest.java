package com.game.controller;

import com.game.model.PathFindingRequest;
import com.game.model.PathFindingResponse;
import com.game.model.Position;
import com.game.service.PathFindingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PathFindingController.class)
class PathFindingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PathFindingService pathFindingService;

    @Test
    void testFindPathSuccess() throws Exception {
        // Given
        String[][] tiles = {{"x", "0", "y"}};
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(1);
        request.setAlgorithm("BFS");

        List<Position> path = Arrays.asList(
            new Position(0, 0),
            new Position(0, 1),
            new Position(0, 2)
        );
        PathFindingResponse response = new PathFindingResponse(path, true, 3, 5L, "BFS", Arrays.asList());
        
        when(pathFindingService.findPath(any(PathFindingRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/pathfinding/find")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.found").value(true))
                .andExpect(jsonPath("$.path").isArray())
                .andExpect(jsonPath("$.path.length()").value(3))
                .andExpect(jsonPath("$.algorithm").value("BFS"));
    }

    @Test
    void testFindPathNoPath() throws Exception {
        // Given
        String[][] tiles = {{"x", "1", "y"}};
        
        PathFindingRequest request = new PathFindingRequest();
        request.setTiles(tiles);
        request.setWidth(3);
        request.setHeight(1);
        request.setAlgorithm("BFS");

        PathFindingResponse response = new PathFindingResponse(Arrays.asList(), false, 0, 2L, "BFS", Arrays.asList());
        
        when(pathFindingService.findPath(any(PathFindingRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/pathfinding/find")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.found").value(false));
    }

    @Test
    void testFindPathInvalidRequest() throws Exception {
        // Given - Invalid JSON
        String invalidJson = "{invalid json}";

        // When & Then
        mockMvc.perform(post("/api/pathfinding/find")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void testFindPathMissingFields() throws Exception {
        // Given - Request without required fields
        PathFindingRequest request = new PathFindingRequest();
        // No tiles, width, height set

        PathFindingResponse response = new PathFindingResponse(Arrays.asList(), false, 0, 0L, "", Arrays.asList());
        when(pathFindingService.findPath(any(PathFindingRequest.class))).thenReturn(response);

        // When & Then - Should still work but return no path found
        mockMvc.perform(post("/api/pathfinding/find")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testFindPathAllAlgorithms() throws Exception {
        // Test that different algorithms work
        String[] algorithms = {"BFS", "DFS", "A_STAR", "IDS"};
        
        for (String algo : algorithms) {
            String[][] tiles = {{"x", "0", "y"}};
            
            PathFindingRequest request = new PathFindingRequest();
            request.setTiles(tiles);
            request.setWidth(3);
            request.setHeight(1);
            request.setAlgorithm(algo);

            PathFindingResponse response = new PathFindingResponse(
                Arrays.asList(new Position(0, 0), new Position(0, 1), new Position(0, 2)), 
                true, 3, 5L, algo, Arrays.asList()
            );
            
            when(pathFindingService.findPath(any(PathFindingRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/pathfinding/find")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.algorithm").value(algo));
        }
    }
}
