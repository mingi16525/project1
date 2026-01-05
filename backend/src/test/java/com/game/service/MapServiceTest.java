package com.game.service;

import com.game.model.GameMap;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MapServiceTest {

    @Autowired
    private MapService mapService;

    @Test
    void testGetAllMaps() {
        // Given & When
        List<GameMap> maps = mapService.getAllMaps();
        
        // Then
        assertNotNull(maps, "Map list should not be null");
        assertFalse(maps.isEmpty(), "Map list should not be empty");
    }

    @Test
    void testLoadMapSuccess() {
        // Given
        String mapId = "Map1";
        
        // When
        GameMap gameMap = mapService.getMapById(mapId);
        
        // Then
        assertNotNull(gameMap, "Game map should not be null");
        assertEquals(mapId, gameMap.getId(), "Map id should match");
        assertNotNull(gameMap.getTiles(), "Tiles should not be null");
        assertTrue(gameMap.getHeight() > 0, "Height should be greater than 0");
        assertTrue(gameMap.getWidth() > 0, "Width should be greater than 0");
    }

    @Test
    void testLoadMapInvalidName() {
        // Given
        String invalidMapName = "NonExistentMap";
        
        // When & Then
        assertThrows(RuntimeException.class, () -> {
            mapService.getMapById(invalidMapName);
        }, "Should throw RuntimeException for invalid map name");
    }

    @Test
    void testMapTilesStructure() {
        // Given
        String mapId = "Map1";
        
        // When
        GameMap gameMap = mapService.getMapById(mapId);
        
        // Then
        String[][] tiles = gameMap.getTiles();
        assertEquals(gameMap.getHeight(), tiles.length, "Tiles height should match");
        for (String[] row : tiles) {
            assertEquals(gameMap.getWidth(), row.length, "Tiles width should match");
        }
    }

    @Test
    void testMapTilesValues() {
        // Given
        String mapId = "Map1";
        
        // When
        GameMap gameMap = mapService.getMapById(mapId);
        
        // Then
        String[][] tiles = gameMap.getTiles();
        for (int i = 0; i < tiles.length; i++) {
            for (int j = 0; j < tiles[i].length; j++) {
                String value = tiles[i][j];
                assertTrue(value.equals("x") ||value.equals("y") ||value.equals("0") || value.equals("1"), 
                    "Tile values should be '0' or '1', but found: " + value + " at [" + i + "][" + j + "]");
            }
        }
    }

    @Test
    void testMultipleMapLoads() {
        // Test loading multiple maps
        List<GameMap> maps = mapService.getAllMaps();
        
        for (GameMap map : maps) {
            assertNotNull(map, "Map should not be null");
            assertNotNull(map.getId(), "Map ID should not be null");
            assertNotNull(map.getName(), "Map name should not be null");
        }
    }

    @Test
    void testMapConsistency() {
        // Load same map twice and verify consistency
        String mapId = "Map1";
        
        GameMap map1 = mapService.getMapById(mapId);
        GameMap map2 = mapService.getMapById(mapId);
        
        assertEquals(map1.getHeight(), map2.getHeight(), "Height should be consistent");
        assertEquals(map1.getWidth(), map2.getWidth(), "Width should be consistent");
        assertArrayEquals(map1.getTiles(), map2.getTiles(), "Tiles data should be consistent");
    }
}
