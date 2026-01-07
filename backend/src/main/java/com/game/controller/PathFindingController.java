package com.game.controller;

import com.game.model.PathFindingRequest;
import com.game.model.PathFindingResponse;
import com.game.service.PathFindingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pathfinding")
@CrossOrigin(origins = "*")
public class PathFindingController {
    
    @Autowired
    private PathFindingService pathFindingService;
    
    @PostMapping("/find")
    public ResponseEntity<PathFindingResponse> findPath(@RequestBody PathFindingRequest request) {
        PathFindingResponse response = pathFindingService.findPath(request);
        return ResponseEntity.ok(response);
    }
}
