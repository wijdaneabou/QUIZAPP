package com.quizai.quizapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"user", "quiz"}) 
@EqualsAndHashCode(exclude = {"user", "quiz"})
public class Result {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int total;

    @Column(nullable = false)
    private double percentage;

    @Column(name = "taken_at", nullable = false)
    private LocalDateTime takenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

   
    public Result(int score, int total, User user, Quiz quiz) {
        this.score = score;
        this.total = total;
        this.percentage = (double) score / total * 100;
        this.user = user;
        this.quiz = quiz;
        this.takenAt = LocalDateTime.now();
    }

  
    @PrePersist
    @PreUpdate
    public void calculatePercentage() {
        if (total > 0) {
            this.percentage = Math.round((double) score / total * 100 * 100.0) / 100.0;
        } else {
            this.percentage = 0.0;
        }
        
        if (this.takenAt == null) {
            this.takenAt = LocalDateTime.now();
        }
    }
    
}