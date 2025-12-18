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
}
