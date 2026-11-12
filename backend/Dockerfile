# ── Stage 1: Build ─────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Maven wrapper + pom first (cache dependency resolution)
COPY mvnw .mvn/ ./
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Source
COPY src ./src

# Package (skip tests — verified in CI)
RUN ./mvnw clean package -DskipTests -B

# ── Stage 2: Runtime ───────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
