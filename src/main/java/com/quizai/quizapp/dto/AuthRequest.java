package com.quizai.quizapp.dto;

public class AuthRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    // ✅ NOUVEAU CHAMP : Niveau scolaire
    private String niveau;

    // ✅ Constructeurs
    public AuthRequest() {
    }

    public AuthRequest(String name, String email, String password, String role, String niveau) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.niveau = niveau;
    }

    // ✅ Getters et Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    // ✅ NOUVEAU : Getter et Setter pour le niveau
    public String getNiveau() {
        return niveau;
    }

    public void setNiveau(String niveau) {
        this.niveau = niveau;
    }
}