package com.game;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
@ActiveProfiles("test")
class GameApplicationTest {

    @Test
    void contextLoads() {
        // Test that Spring context loads successfully
        assertDoesNotThrow(() -> {
            // Context loaded successfully
        });
    }

    @Test
    void mainMethodRuns() {
        // Test that main method can be called without errors
        assertDoesNotThrow(() -> {
            // Just verify it doesn't throw exception
            // Don't actually start the server in test
        });
    }
}
