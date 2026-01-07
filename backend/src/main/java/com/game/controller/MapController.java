package com.game.controller;

import com.game.model.GameMap;
import com.game.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maps")
@CrossOrigin(origins = "*")
public class MapController {
    
    @Autowired
    private MapService mapService;
    
    @GetMapping
    public ResponseEntity<List<GameMap>> getAllMaps() {
        return ResponseEntity.ok(mapService.getAllMaps());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<GameMap> getMapById(@PathVariable String id) {
        return ResponseEntity.ok(mapService.getMapById(id));
    }
    
    @PostMapping
    public ResponseEntity<GameMap> saveMap(@RequestBody GameMap map) {
        GameMap savedMap = mapService.saveMap(map);
        return ResponseEntity.ok(savedMap);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<GameMap> updateMap(@PathVariable String id, @RequestBody GameMap map) {
        map.setId(id);
        GameMap updatedMap = mapService.saveMap(map);
        return ResponseEntity.ok(updatedMap);
    }
}
