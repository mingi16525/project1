package com.game.service;

import com.game.model.PathFindingRequest;
import com.game.model.PathFindingResponse;
import com.game.model.Position;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PathFindingService {
    
    private static final int[][] DIRECTIONS = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
    
    public PathFindingResponse findPath(PathFindingRequest request) {
        long startTime = System.currentTimeMillis();
        
        Position start = findPosition(request.getTiles(), "x");
        Position start2 = findPosition(request.getTiles(), "z"); // Second player start
        List<Position> ends = findAllPositions(request.getTiles(), "y"); // Find all destinations
        
        if (start == null || ends.isEmpty()) {
            return new PathFindingResponse(new ArrayList<>(), false, 0, 0, request.getAlgorithm(), new ArrayList<>());
        }
        
        PathFindingResponse response;
        
        switch (request.getAlgorithm().toUpperCase()) {
            case "BFS":
                response = bfsMultiTarget(request.getTiles(), start, ends, request.getHeight(), request.getWidth());
                break;
            case "DFS":
                response = dfsMultiTarget(request.getTiles(), start, ends, request.getHeight(), request.getWidth());
                break;
            case "A_STAR":
                response = aStarMultiTarget(request.getTiles(), start, ends, request.getHeight(), request.getWidth());
                break;
            case "IDS":
                response = idsMultiTarget(request.getTiles(), start, ends, request.getHeight(), request.getWidth());
                break;
            default:
                response = new PathFindingResponse(new ArrayList<>(), false, 0, 0, request.getAlgorithm(), new ArrayList<>());
        }
        
        // If second player exists, find path for them too
        if (start2 != null) {
            PathFindingResponse response2;
            switch (request.getAlgorithm().toUpperCase()) {
                case "BFS":
                    response2 = bfsMultiTarget(request.getTiles(), start2, ends, request.getHeight(), request.getWidth());
                    break;
                case "DFS":
                    response2 = dfsMultiTarget(request.getTiles(), start2, ends, request.getHeight(), request.getWidth());
                    break;
                case "A_STAR":
                    response2 = aStarMultiTarget(request.getTiles(), start2, ends, request.getHeight(), request.getWidth());
                    break;
                case "IDS":
                    response2 = idsMultiTarget(request.getTiles(), start2, ends, request.getHeight(), request.getWidth());
                    break;
                default:
                    response2 = new PathFindingResponse(new ArrayList<>(), false, 0, 0, request.getAlgorithm(), new ArrayList<>());
            }
            response.setPath2(response2.getPath());
            response.setFound2(response2.isFound());
            response.setNodesExplored2(response2.getNodesExplored());
            response.setVisitedNodes2(response2.getVisitedNodes());
        }
        
        response.setExecutionTime(System.currentTimeMillis() - startTime);
        response.setAlgorithm(request.getAlgorithm());
        
        return response;
    }
    
    private Position findPosition(String[][] tiles, String target) {
        for (int i = 0; i < tiles.length; i++) {
            for (int j = 0; j < tiles[i].length; j++) {
                if (tiles[i][j].equals(target)) {
                    return new Position(i, j);
                }
            }
        }
        return null;
    }
    
    private List<Position> findAllPositions(String[][] tiles, String target) {
        List<Position> positions = new ArrayList<>();
        for (int i = 0; i < tiles.length; i++) {
            for (int j = 0; j < tiles[i].length; j++) {
                if (tiles[i][j].equals(target)) {
                    positions.add(new Position(i, j));
                }
            }
        }
        return positions;
    }
    
    private boolean isValid(int row, int col, int height, int width, String[][] tiles, boolean[][] visited) {
        return row >= 0 && row < height && col >= 0 && col < width 
            && !visited[row][col] && !tiles[row][col].equals("1");
    }
    
    // BFS - Breadth First Search (Multiple Targets)
    private PathFindingResponse bfsMultiTarget(String[][] tiles, Position start, List<Position> ends, int height, int width) {
        Queue<Position> queue = new LinkedList<>();
        boolean[][] visited = new boolean[height][width];
        Map<Position, Position> parent = new HashMap<>();
        List<Position> visitedNodes = new ArrayList<>();
        int nodesExplored = 0;
        
        queue.offer(start);
        visited[start.getRow()][start.getCol()] = true;
        parent.put(start, null);
        
        while (!queue.isEmpty()) {
            Position current = queue.poll();
            visitedNodes.add(current);
            nodesExplored++;
            
            // Check if current position is any of the target destinations
            for (Position end : ends) {
                if (current.equals(end)) {
                    List<Position> path = reconstructPath(parent, start, end);
                    return new PathFindingResponse(path, true, nodesExplored, 0, "BFS", visitedNodes);
                }
            }
            
            for (int[] dir : DIRECTIONS) {
                int newRow = current.getRow() + dir[0];
                int newCol = current.getCol() + dir[1];
                
                if (isValid(newRow, newCol, height, width, tiles, visited)) {
                    Position next = new Position(newRow, newCol);
                    queue.offer(next);
                    visited[newRow][newCol] = true;
                    parent.put(next, current);
                }
            }
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, nodesExplored, 0, "BFS", visitedNodes);
    }
    
    // BFS - Breadth First Search
    private PathFindingResponse bfs(String[][] tiles, Position start, Position end, int height, int width) {
        Queue<Position> queue = new LinkedList<>();
        boolean[][] visited = new boolean[height][width];
        Map<Position, Position> parent = new HashMap<>();
        List<Position> visitedNodes = new ArrayList<>();
        int nodesExplored = 0;
        
        queue.offer(start);
        visited[start.getRow()][start.getCol()] = true;
        parent.put(start, null);
        
        while (!queue.isEmpty()) {
            Position current = queue.poll();
            visitedNodes.add(current);
            nodesExplored++;
            
            if (current.equals(end)) {
                List<Position> path = reconstructPath(parent, start, end);
                return new PathFindingResponse(path, true, nodesExplored, 0, "BFS", visitedNodes);
            }
            
            for (int[] dir : DIRECTIONS) {
                int newRow = current.getRow() + dir[0];
                int newCol = current.getCol() + dir[1];
                
                if (isValid(newRow, newCol, height, width, tiles, visited)) {
                    Position next = new Position(newRow, newCol);
                    queue.offer(next);
                    visited[newRow][newCol] = true;
                    parent.put(next, current);
                }
            }
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, nodesExplored, 0, "BFS", visitedNodes);
    }
    
    // DFS - Depth First Search (Multiple Targets)
    private PathFindingResponse dfsMultiTarget(String[][] tiles, Position start, List<Position> ends, int height, int width) {
        boolean[][] visited = new boolean[height][width];
        Map<Position, Position> parent = new HashMap<>();
        List<Position> visitedNodes = new ArrayList<>();
        int[] nodesExplored = {0};
        Position[] foundEnd = {null};
        
        parent.put(start, null);
        
        if (dfsHelperMultiTarget(tiles, start, ends, height, width, visited, parent, nodesExplored, visitedNodes, foundEnd)) {
            List<Position> path = reconstructPath(parent, start, foundEnd[0]);
            return new PathFindingResponse(path, true, nodesExplored[0], 0, "DFS", visitedNodes);
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, nodesExplored[0], 0, "DFS", visitedNodes);
    }
    
    // DFS - Depth First Search
    private PathFindingResponse dfs(String[][] tiles, Position start, Position end, int height, int width) {
        boolean[][] visited = new boolean[height][width];
        Map<Position, Position> parent = new HashMap<>();
        List<Position> visitedNodes = new ArrayList<>();
        int[] nodesExplored = {0};
        
        parent.put(start, null);
        
        if (dfsHelper(tiles, start, end, height, width, visited, parent, nodesExplored, visitedNodes)) {
            List<Position> path = reconstructPath(parent, start, end);
            return new PathFindingResponse(path, true, nodesExplored[0], 0, "DFS", visitedNodes);
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, nodesExplored[0], 0, "DFS", visitedNodes);
    }
    
    private boolean dfsHelperMultiTarget(String[][] tiles, Position current, List<Position> ends, int height, int width,
                              boolean[][] visited, Map<Position, Position> parent, int[] nodesExplored,
                              List<Position> visitedNodes, Position[] foundEnd) {
        visited[current.getRow()][current.getCol()] = true;
        visitedNodes.add(current);
        nodesExplored[0]++;
        
        // Check if current position is any of the target destinations
        for (Position end : ends) {
            if (current.equals(end)) {
                foundEnd[0] = end;
                return true;
            }
        }
        
        for (int[] dir : DIRECTIONS) {
            int newRow = current.getRow() + dir[0];
            int newCol = current.getCol() + dir[1];
            
            if (isValid(newRow, newCol, height, width, tiles, visited)) {
                Position next = new Position(newRow, newCol);
                parent.put(next, current);
                
                if (dfsHelperMultiTarget(tiles, next, ends, height, width, visited, parent, nodesExplored, visitedNodes, foundEnd)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private boolean dfsHelper(String[][] tiles, Position current, Position end, int height, int width,
                              boolean[][] visited, Map<Position, Position> parent, int[] nodesExplored,
                              List<Position> visitedNodes) {
        visited[current.getRow()][current.getCol()] = true;
        visitedNodes.add(current);
        nodesExplored[0]++;
        
        if (current.equals(end)) {
            return true;
        }
        
        for (int[] dir : DIRECTIONS) {
            int newRow = current.getRow() + dir[0];
            int newCol = current.getCol() + dir[1];
            
            if (isValid(newRow, newCol, height, width, tiles, visited)) {
                Position next = new Position(newRow, newCol);
                parent.put(next, current);
                
                if (dfsHelper(tiles, next, end, height, width, visited, parent, nodesExplored, visitedNodes)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // A* Algorithm (Multiple Targets)
    private PathFindingResponse aStarMultiTarget(String[][] tiles, Position start, List<Position> ends, int height, int width) {
        PriorityQueue<Node> openSet = new PriorityQueue<>(Comparator.comparingInt(n -> n.f));
        Map<Position, Position> parent = new HashMap<>();
        Map<Position, Integer> gScore = new HashMap<>();
        Set<Position> closedSet = new HashSet<>();
        List<Position> visitedNodes = new ArrayList<>();
        int nodesExplored = 0;
        
        gScore.put(start, 0);
        // Use minimum heuristic to closest target
        int minH = ends.stream().mapToInt(end -> heuristic(start, end)).min().orElse(0);
        openSet.offer(new Node(start, 0, minH));
        parent.put(start, null);
        
        while (!openSet.isEmpty()) {
            Node current = openSet.poll();
            Position currentPos = current.position;
            
            if (closedSet.contains(currentPos)) continue;
            
            visitedNodes.add(currentPos);
            nodesExplored++;
            
            // Check if current position is any of the target destinations
            for (Position end : ends) {
                if (currentPos.equals(end)) {
                    List<Position> path = reconstructPath(parent, start, end);
                    return new PathFindingResponse(path, true, nodesExplored, 0, "A_STAR", visitedNodes);
                }
            }
            
            closedSet.add(currentPos);
            
            for (int[] dir : DIRECTIONS) {
                int newRow = currentPos.getRow() + dir[0];
                int newCol = currentPos.getCol() + dir[1];
                
                if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width 
                    && !tiles[newRow][newCol].equals("1")) {
                    Position next = new Position(newRow, newCol);
                    
                    if (closedSet.contains(next)) continue;
                    
                    int tentativeG = gScore.get(currentPos) + 1;
                    
                    if (!gScore.containsKey(next) || tentativeG < gScore.get(next)) {
                        parent.put(next, currentPos);
                        gScore.put(next, tentativeG);
                        // Use minimum heuristic to closest target
                        int minHeuristic = ends.stream().mapToInt(end -> heuristic(next, end)).min().orElse(0);
                        int f = tentativeG + minHeuristic;
                        openSet.offer(new Node(next, tentativeG, f));
                    }
                }
            }
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, nodesExplored, 0, "A_STAR", visitedNodes);
    }
    
    // A* Algorithm
    private PathFindingResponse aStar(String[][] tiles, Position start, Position end, int height, int width) {
        PriorityQueue<Node> openSet = new PriorityQueue<>(Comparator.comparingInt(n -> n.f));
        Map<Position, Position> parent = new HashMap<>();
        Map<Position, Integer> gScore = new HashMap<>();
        Set<Position> closedSet = new HashSet<>();
        List<Position> visitedNodes = new ArrayList<>();
        int nodesExplored = 0;
        
        gScore.put(start, 0);
        openSet.offer(new Node(start, 0, heuristic(start, end)));
        parent.put(start, null);
        
        while (!openSet.isEmpty()) {
            Node current = openSet.poll();
            Position currentPos = current.position;
            
            if (closedSet.contains(currentPos)) continue;
            
            visitedNodes.add(currentPos);
            nodesExplored++;
            
            if (currentPos.equals(end)) {
                List<Position> path = reconstructPath(parent, start, end);
                return new PathFindingResponse(path, true, nodesExplored, 0, "A_STAR", visitedNodes);
            }
            
            closedSet.add(currentPos);
            
            for (int[] dir : DIRECTIONS) {
                int newRow = currentPos.getRow() + dir[0];
                int newCol = currentPos.getCol() + dir[1];
                
                if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width 
                    && !tiles[newRow][newCol].equals("1")) {
                    Position next = new Position(newRow, newCol);
                    
                    if (closedSet.contains(next)) continue;
                    
                    int tentativeG = gScore.get(currentPos) + 1;
                    
                    if (!gScore.containsKey(next) || tentativeG < gScore.get(next)) {
                        parent.put(next, currentPos);
                        gScore.put(next, tentativeG);
                        int f = tentativeG + heuristic(next, end);
                        openSet.offer(new Node(next, tentativeG, f));
                    }
                }
            }
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, nodesExplored, 0, "A_STAR", visitedNodes);
    }
    
    // IDS - Iterative Deepening Search (Multiple Targets)
    private PathFindingResponse idsMultiTarget(String[][] tiles, Position start, List<Position> ends, int height, int width) {
        int maxDepth = height * width;
        int totalNodesExplored = 0;
        List<Position> allVisitedNodes = new ArrayList<>();
        
        for (int depth = 0; depth <= maxDepth; depth++) {
            boolean[][] visited = new boolean[height][width];
            Map<Position, Position> parent = new HashMap<>();
            List<Position> visitedNodes = new ArrayList<>();
            int[] nodesExplored = {0};
            Position[] foundEnd = {null};
            parent.put(start, null);
            
            if (dlsMultiTarget(tiles, start, ends, depth, height, width, visited, parent, nodesExplored, visitedNodes, foundEnd)) {
                totalNodesExplored += nodesExplored[0];
                allVisitedNodes.addAll(visitedNodes);
                List<Position> path = reconstructPath(parent, start, foundEnd[0]);
                return new PathFindingResponse(path, true, totalNodesExplored, 0, "IDS", allVisitedNodes);
            }
            totalNodesExplored += nodesExplored[0];
            allVisitedNodes.addAll(visitedNodes);
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, totalNodesExplored, 0, "IDS", allVisitedNodes);
    }
    
    // IDS - Iterative Deepening Search
    private PathFindingResponse ids(String[][] tiles, Position start, Position end, int height, int width) {
        int maxDepth = height * width;
        int totalNodesExplored = 0;
        List<Position> allVisitedNodes = new ArrayList<>();
        
        for (int depth = 0; depth <= maxDepth; depth++) {
            boolean[][] visited = new boolean[height][width];
            Map<Position, Position> parent = new HashMap<>();
            List<Position> visitedNodes = new ArrayList<>();
            int[] nodesExplored = {0};
            parent.put(start, null);
            
            if (dls(tiles, start, end, depth, height, width, visited, parent, nodesExplored, visitedNodes)) {
                totalNodesExplored += nodesExplored[0];
                allVisitedNodes.addAll(visitedNodes);
                List<Position> path = reconstructPath(parent, start, end);
                return new PathFindingResponse(path, true, totalNodesExplored, 0, "IDS", allVisitedNodes);
            }
            totalNodesExplored += nodesExplored[0];
            allVisitedNodes.addAll(visitedNodes);
        }
        
        return new PathFindingResponse(new ArrayList<>(), false, totalNodesExplored, 0, "IDS", allVisitedNodes);
    }
    
    private boolean dlsMultiTarget(String[][] tiles, Position current, List<Position> ends, int depth, int height, int width,
                        boolean[][] visited, Map<Position, Position> parent, int[] nodesExplored,
                        List<Position> visitedNodes, Position[] foundEnd) {
        visited[current.getRow()][current.getCol()] = true;
        visitedNodes.add(current);
        nodesExplored[0]++;
        
        // Check if current position is any of the target destinations
        for (Position end : ends) {
            if (current.equals(end)) {
                foundEnd[0] = end;
                return true;
            }
        }
        
        if (depth <= 0) {
            visited[current.getRow()][current.getCol()] = false;
            return false;
        }
        
        for (int[] dir : DIRECTIONS) {
            int newRow = current.getRow() + dir[0];
            int newCol = current.getCol() + dir[1];
            
            if (isValid(newRow, newCol, height, width, tiles, visited)) {
                Position next = new Position(newRow, newCol);
                parent.put(next, current);
                
                if (dlsMultiTarget(tiles, next, ends, depth - 1, height, width, visited, parent, nodesExplored, visitedNodes, foundEnd)) {
                    return true;
                }
            }
        }
        
        visited[current.getRow()][current.getCol()] = false;
        return false;
    }
    
    private boolean dls(String[][] tiles, Position current, Position end, int depth, int height, int width,
                        boolean[][] visited, Map<Position, Position> parent, int[] nodesExplored,
                        List<Position> visitedNodes) {
        visited[current.getRow()][current.getCol()] = true;
        visitedNodes.add(current);
        nodesExplored[0]++;
        
        if (current.equals(end)) {
            return true;
        }
        
        if (depth <= 0) {
            visited[current.getRow()][current.getCol()] = false;
            return false;
        }
        
        for (int[] dir : DIRECTIONS) {
            int newRow = current.getRow() + dir[0];
            int newCol = current.getCol() + dir[1];
            
            if (isValid(newRow, newCol, height, width, tiles, visited)) {
                Position next = new Position(newRow, newCol);
                parent.put(next, current);
                
                if (dls(tiles, next, end, depth - 1, height, width, visited, parent, nodesExplored, visitedNodes)) {
                    return true;
                }
            }
        }
        
        visited[current.getRow()][current.getCol()] = false;
        return false;
    }
    
    private int heuristic(Position a, Position b) {
        return Math.abs(a.getRow() - b.getRow()) + Math.abs(a.getCol() - b.getCol());
    }
    
    private List<Position> reconstructPath(Map<Position, Position> parent, Position start, Position end) {
        List<Position> path = new ArrayList<>();
        Position current = end;
        
        while (current != null) {
            path.add(0, current);
            current = parent.get(current);
        }
        
        return path;
    }
    
    private static class Node {
        Position position;
        int g;
        int f;
        
        Node(Position position, int g, int f) {
            this.position = position;
            this.g = g;
            this.f = f;
        }
    }
}
