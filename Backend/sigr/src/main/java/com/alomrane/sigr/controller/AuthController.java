package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.LoginRequest;
import com.alomrane.sigr.dto.response.LoginResponse;
import com.alomrane.sigr.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Pour un système JWT stateless, rien à faire côté serveur.
        // Si vous voulez invalider le token, vous pouvez le stocker dans une blacklist.
        return ResponseEntity.ok().build();
    }
}