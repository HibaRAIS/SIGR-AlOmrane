package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.ChatRequest;
import com.alomrane.sigr.dto.response.ChatResponse;
import com.alomrane.sigr.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String answer = chatService.processMessage(request.getMessage());
        return ResponseEntity.ok(new ChatResponse(answer));
    }
}