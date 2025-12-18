package com.game.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathFindingRequest {
    private String[][] tiles;
    private int width;
    private int height;
    private String algorithm; // BFS, DFS, A_STAR, IDS
}
