# Multi-stage build for smaller image size

# Stage 1: Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies first (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src
COPY data ./data

# Build application
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S gameuser && \
    adduser -u 1001 -S gameuser -G gameuser

# Copy JAR from builder stage
COPY --from=builder /app/target/game-backend-*.jar app.jar

# Copy data files
COPY --from=builder /app/data ./data

# Change ownership
RUN chown -R gameuser:gameuser /app

# Switch to non-root user
USER gameuser

# Expose port
EXPOSE 8080

# Health check (use actuator health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/actuator/health || exit 1

# Environment variables (can be overridden)
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xmx512m -Xms256m"

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
