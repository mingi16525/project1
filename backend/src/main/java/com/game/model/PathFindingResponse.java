package com.game.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathFindingResponse {
    private List<Position> path;
    private boolean found;
    private int nodesExplored;
    private long executionTime;
    private String algorithm;
    private List<Position> visitedNodes; // Lịch sử duyệt node
    
    // Fields for second player
    private List<Position> path2;
    private boolean found2;
    private int nodesExplored2;
    private List<Position> visitedNodes2;
    
    // Constructor for single player (backward compatibility)
    public PathFindingResponse(List<Position> path, boolean found, int nodesExplored, 
                              long executionTime, String algorithm, List<Position> visitedNodes) {
        this.path = path;
        this.found = found;
        this.nodesExplored = nodesExplored;
        this.executionTime = executionTime;
        this.algorithm = algorithm;
        this.visitedNodes = visitedNodes;
        this.path2 = null;
        this.found2 = false;
        this.nodesExplored2 = 0;
        this.visitedNodes2 = null;
    }
}
