package com.quizai.quizapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.quizai.quizapp.model.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private User.Role role;
    private Boolean isActive;
    private String niveau;

    @JsonProperty("dateCreation")
    private Date dateCreation;
    
    public UserDto(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.isActive = user.getIsActive();
        this.niveau = user.getNiveau(); 
        this.dateCreation = user.getDateCreation();
    }
}