package com.game.service;

import com.game.model.GameMap;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class MapService {
    
    private static final String DATA_FOLDER = "data/maps";
    
    public MapService() {
        // Create data folder if it doesn't exist
        File dataDir = new File(DATA_FOLDER);
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }
    }
    
    public List<GameMap> getAllMaps() {
        List<GameMap> maps = new ArrayList<>();
        File dataDir = new File(DATA_FOLDER);
        
        if (dataDir.exists() && dataDir.isDirectory()) {
            File[] files = dataDir.listFiles((dir, name) -> name.endsWith(".txt"));
            if (files != null) {
                for (File file : files) {
                    try {
                        GameMap map = loadMapFromFile(file);
                        maps.add(map);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        
        return maps;
    }
    
    public GameMap getMapById(String id) {
        File mapFile = new File(DATA_FOLDER + "/" + id + ".txt");
        if (mapFile.exists()) {
            try {
                return loadMapFromFile(mapFile);
            } catch (IOException e) {
                throw new RuntimeException("Failed to load map: " + id, e);
            }
        }
        throw new RuntimeException("Map not found: " + id);
    }
    
    public GameMap saveMap(GameMap map) {
        try {
            File mapFile = new File(DATA_FOLDER + "/" + map.getId() + ".txt");
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(mapFile))) {
                for (String[] row : map.getTiles()) {
                    writer.write(String.join(" ", row));
                    writer.newLine();
                }
            }
            return map;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
    
    private GameMap loadMapFromFile(File file) throws IOException {
        GameMap map = new GameMap();
        map.setId(file.getName().replace(".txt", ""));
        map.setName(file.getName().replace(".txt", ""));
        
        List<String[]> tilesList = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] tiles = line.trim().split("\\s+");
                tilesList.add(tiles);
            }
        }
        
        if (!tilesList.isEmpty()) {
            map.setHeight(tilesList.size());
            map.setWidth(tilesList.get(0).length);
            
            String[][] tiles = new String[tilesList.size()][];
            for (int i = 0; i < tilesList.size(); i++) {
                tiles[i] = tilesList.get(i);
            }
            map.setTiles(tiles);
        }
        
        return map;
    }
}
