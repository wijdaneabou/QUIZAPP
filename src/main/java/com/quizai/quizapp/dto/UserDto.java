package com.quizai.quizapp.dto;

import com.quizai.quizapp.model.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private User.Role role;
    private Boolean isActive;
    // ✅ NOUVEAU CHAMP : Niveau scolaire
    private String niveau;
    
    public UserDto(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.isActive = user.getIsActive();
        this.niveau = user.getNiveau(); // ✅ Ajout du niveau
    }
}