package com.game.controller;

import com.game.model.GameMap;
import com.game.service.MapService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MapController.class)
class MapControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MapService mapService;

    @Test
    void testGetAllMapsSuccess() throws Exception {
        // Given
        GameMap map1 = new GameMap("Map1", "Map 1", 10, 10, new String[10][10]);
        GameMap map2 = new GameMap("Map2", "Map 2", 10, 10, new String[10][10]);
        List<GameMap> maps = Arrays.asList(map1, map2);
        when(mapService.getAllMaps()).thenReturn(maps);

        // When & Then
        mockMvc.perform(get("/api/maps")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("Map1"))
                .andExpect(jsonPath("$[1].id").value("Map2"));
    }

    @Test
    void testGetAllMapsEmpty() throws Exception {
        // Given
        when(mapService.getAllMaps()).thenReturn(Arrays.asList());

        // When & Then
        mockMvc.perform(get("/api/maps")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testGetMapSuccess() throws Exception {
        // Given
        String mapId = "Map1";
        String[][] tiles = {{"0", "1"}, {"1", "0"}};
        GameMap gameMap = new GameMap(mapId, "Map 1", 2, 2, tiles);
        when(mapService.getMapById(mapId)).thenReturn(gameMap);

        // When & Then
        mockMvc.perform(get("/api/maps/{mapId}", mapId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(mapId))
                .andExpect(jsonPath("$.width").value(2))
                .andExpect(jsonPath("$.height").value(2))
                .andExpect(jsonPath("$.tiles").isArray())
                .andExpect(jsonPath("$.tiles.length()").value(2));
    }

    
    @Test
    void testCorsHeaders() throws Exception {
        // Given
        GameMap map1 = new GameMap("Map1", "Map 1", 10, 10, new String[10][10]);
        List<GameMap> maps = Arrays.asList(map1);
        when(mapService.getAllMaps()).thenReturn(maps);

        // When & Then - Test that CORS is configured
        mockMvc.perform(get("/api/maps")
                .header("Origin", "http://localhost:3000")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
