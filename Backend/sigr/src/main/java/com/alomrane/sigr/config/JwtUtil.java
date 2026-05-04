package com.alomrane.sigr.config;

import com.alomrane.sigr.model.Utilisateur;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String generateToken(Utilisateur user) {
        return Jwts.builder()
                .setSubject(user.getLoginLdap())
                .claim("role", user.getRole().name())
                .claim("userId", user.getId().toString())
                .claim("employeId", user.getEmploye().getId().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SignatureAlgorithm.HS256, secret.getBytes())
                .compact();
    }

    public String extractLogin(String token) {
        return Jwts.parser()
                .setSigningKey(secret.getBytes())
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Compatibilité
    public String extractEmail(String token) {
        return extractLogin(token);
    }

    public Long extractEmployeId(String token) {
        String val = Jwts.parser()
                .setSigningKey(secret.getBytes())
                .parseClaimsJws(token)
                .getBody()
                .get("employeId", String.class);
        return Long.parseLong(val);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret.getBytes()).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}