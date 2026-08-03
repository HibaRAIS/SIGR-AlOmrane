package com.alomrane.sigr.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;

    // Message système qui cadre l'assistant dans le domaine logistique
    private static final String SYSTEM_PROMPT =
            "Tu es un assistant spécialisé en logistique et gestion des stocks. " +
                    "Tu réponds de manière concise et précise aux questions liées à la logistique, " +
                    "aux stocks, au transport, aux entrepôts, à la chaîne d'approvisionnement. " +
                    "Si une question est générale, tu l'adaptes au contexte de la logistique. " +
                    "Pour le PMP (Prix Moyen Pondéré), tu expliques la formule utilisée en gestion " +
                    "des stocks : PMP = (valeur totale des entrées) / (quantité totale entrée).";

    public GroqService(@Value("${groq.api.key}") String apiKey) {
        this.apiKey = apiKey;
    }

    public String askGroq(String prompt) {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        String escapedPrompt = prompt
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");

        // Corps de la requête avec message système
        String requestJson = String.format(
                "{\"model\":\"llama-3.3-70b-versatile\"," +
                        "\"messages\":[" +
                        "{\"role\":\"system\",\"content\":\"%s\"}," +
                        "{\"role\":\"user\",\"content\":\"%s\"}" +
                        "]," +
                        "\"temperature\":0.7,\"max_tokens\":1024}",
                SYSTEM_PROMPT.replace("\"", "\\\""),   // échapper les guillemets
                escapedPrompt
        );

        HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            String body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                JsonNode root = objectMapper.readTree(body);
                JsonNode contentNode = root.at("/choices/0/message/content");
                if (!contentNode.isMissingNode()) {
                    return contentNode.asText();
                }
            }
            log.error("Réponse Groq inattendue : {}", body);
        } catch (Exception e) {
            log.error("Erreur lors de l'appel à Groq", e);
        }
        return "Désolé, je n'ai pas pu répondre pour le moment (erreur Groq).";
    }
}