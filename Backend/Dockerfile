# Étape 1 : Build avec Maven
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY sigr/pom.xml .
COPY sigr/.mvn .mvn
COPY sigr/mvnw .

RUN mvn dependency:go-offline -B

COPY sigr/src ./src

RUN mvn clean package -DskipTests

# Étape 2 : Production
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar
COPY uploads/ ./uploads/

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]