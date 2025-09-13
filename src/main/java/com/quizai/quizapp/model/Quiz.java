package com.quizai.quizapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "quizzes")
@Data
@NoArgsConstructor
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String subject;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(nullable = false)
    private String niveau;

    @Column(name = "time_limit")
    private Integer timeLimit;

    @Column(name = "creation_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date creationDate = new Date();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_ai_generated")
    private Boolean isAIGenerated = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    @ToString.Exclude
    @JsonBackReference 
    private User creator;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference 
    private List<Question> questions;

   public enum Difficulty {
    EASY, MEDIUM, HARD;

    @JsonCreator
        public static Difficulty fromString(String value) {
            return Difficulty.valueOf(value.toUpperCase());
        }
    }


    public boolean isAIGenerated() {
        return isAIGenerated;
    }

    public void setAIGenerated(boolean AIGenerated) {
        isAIGenerated = AIGenerated;
    }
}
