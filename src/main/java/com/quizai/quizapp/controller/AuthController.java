package com.quizai.quizapp.controller;

import com.quizai.quizapp.dto.AuthRequest;
import com.quizai.quizapp.model.User;
import com.quizai.quizapp.repository.UserRepository;
import com.quizai.quizapp.security.JwtUtil;
import com.quizai.quizapp.service.EmailService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger LOGGER = Logger.getLogger(AuthController.class.getName());

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Value("${GOOGLE_CLIENT_ID}")
    private String googleClientId;

    private static final Set<String> VALID_LEVELS = Set.of(
        "1ère année collège",
        "2ème année collège", 
        "3ème année collège",
        "Tronc commun scientifique",
        "Tronc commun lettres",
        "1ère année baccalauréat",
        "2ème année baccalauréat"
    );

    // -------------------- REGISTER --------------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        try {

            if (request.getEmail() == null || request.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body("L'email est requis");
            }
            if (request.getPassword() == null || request.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("Le mot de passe est requis");
            }
            if (request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 6 caractères");
            }
       
            if (request.getRole() == null || request.getRole().isEmpty()) {
                return ResponseEntity.badRequest().body("Le rôle est requis");
            }

            if ("USER".equals(request.getRole().toUpperCase())) {
                if (request.getNiveau() == null || request.getNiveau().isEmpty()) {
                    return ResponseEntity.badRequest().body("Le niveau scolaire est requis pour les étudiants");
                }
                if (!VALID_LEVELS.contains(request.getNiveau())) {
                    return ResponseEntity.badRequest().body("Niveau scolaire invalide");
                }
            }
            
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email déjà utilisé");
            }

            User user = new User();
            user.setName(request.getName() != null ? request.getName() : "");
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setIsActive(true);

            try {
                User.Role userRole = User.Role.valueOf(request.getRole().toUpperCase());
                user.setRole(userRole);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Rôle invalide. Rôles acceptés: USER, ADMIN");
            }

            if (User.Role.USER.equals(user.getRole())) {
                user.setNiveau(request.getNiveau());
            }

            User savedUser = userRepository.save(user);
            LOGGER.info("User saved with ID: " + savedUser.getId());

            String token = jwtUtil.generateToken(savedUser.getEmail());
            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                    "id", savedUser.getId(),
                    "email", savedUser.getEmail(),
                    "name", savedUser.getName(),
                    "role", savedUser.getRole().name(),
                    "niveau", savedUser.getNiveau() != null ? savedUser.getNiveau() : "" 
                )
            ));
        } catch (Exception e) {
            LOGGER.severe("Erreur lors de l'inscription: " + e.getMessage());
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'inscription: " + e.getMessage());
        }
    }

    // -------------------- LOGIN --------------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        LOGGER.info("Login attempt for email: " + request.getEmail());
        
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isEmpty()) {
            LOGGER.warning("User not found for email: " + request.getEmail());
            return ResponseEntity.status(401).body("Email ou mot de passe incorrect");
        }

        User dbUser = existingUser.get();
        
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), dbUser.getPassword());
        LOGGER.info("Password matches: " + passwordMatches);
        
        if (!passwordMatches) {
            LOGGER.warning("Password does not match for user: " + request.getEmail());
            String encodedInput = passwordEncoder.encode(request.getPassword());
            LOGGER.info("Input password encoded would be: " + encodedInput);
            return ResponseEntity.status(401).body("Email ou mot de passe incorrect");
        }

        if (!dbUser.getIsActive()) {
            LOGGER.warning("User account is inactive: " + request.getEmail());
            return ResponseEntity.status(401).body("Compte désactivé");
        }

        String token = jwtUtil.generateToken(dbUser.getEmail());
        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of(
                "id", dbUser.getId(),
                "email", dbUser.getEmail(),
                "name", dbUser.getName(),
                "role", dbUser.getRole().name(),
                "niveau", dbUser.getNiveau() != null ? dbUser.getNiveau() : "" 
            )
        ));
    }

    // -------------------- GOOGLE LOGIN --------------------
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String idTokenString = request.get("token");

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
                    .Builder(GoogleNetHttpTransport.newTrustedTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return ResponseEntity.status(401).body("Token Google invalide");
            }

            Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            Optional<User> optionalUser = userRepository.findByEmail(email);
            User user = optionalUser.orElseGet(() -> {
                User newUser = new User();
                newUser.setName(name);
                newUser.setEmail(email);
                newUser.setPassword(passwordEncoder.encode(email)); 
                newUser.setIsActive(true);
                newUser.setRole(User.Role.USER);
                newUser.setNiveau(null);
                return userRepository.save(newUser);
            });

            String jwt = jwtUtil.generateToken(user.getEmail());
        
            return ResponseEntity.ok(Map.of(
                "token", jwt,
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "role", user.getRole().name(),
                    "niveau", user.getNiveau() != null ? user.getNiveau() : ""
                )
            ));
        } catch (Exception e) {
            LOGGER.severe("Erreur Google Login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur serveur : " + e.getMessage());
        }
    }

    @PutMapping("/update-niveau")
    public ResponseEntity<?> updateNiveau(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String niveau = request.get("niveau");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email requis");
            }

            if (niveau == null || niveau.isEmpty()) {
                return ResponseEntity.badRequest().body("Niveau requis");
            }

            if (!VALID_LEVELS.contains(niveau)) {
                return ResponseEntity.badRequest().body("Niveau invalide");
            }

            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilisateur non trouvé");
            }

            User user = userOptional.get();
        
            if (!User.Role.USER.equals(user.getRole())) {
                return ResponseEntity.badRequest().body("Seuls les étudiants peuvent avoir un niveau scolaire");
            }

            user.setNiveau(niveau);
            User updatedUser = userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message", "Niveau mis à jour avec succès",
                "user", Map.of(
                    "id", updatedUser.getId(),
                    "email", updatedUser.getEmail(),
                    "name", updatedUser.getName(),
                    "role", updatedUser.getRole().name(),
                    "niveau", updatedUser.getNiveau()
                )
            ));

        } catch (Exception e) {
            LOGGER.severe("Erreur lors de la mise à jour du niveau: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur serveur : " + e.getMessage());
        }
    }

    @GetMapping("/niveaux")
    public ResponseEntity<?> getValidLevels() {
        return ResponseEntity.ok(Map.of(
            "niveaux", VALID_LEVELS,
            "message", "Liste des niveaux scolaires valides"
        ));
    }

    // -------------------- FORGOT PASSWORD --------------------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        LOGGER.info("Received forgot password request for email: " + email);

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            LOGGER.warning("Email not found: " + email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Email not found"));
        }

        try {
            String resetToken = UUID.randomUUID().toString();
            String resetLink = "http://localhost:5173/reset-password?token=" + resetToken + "&email=" + email;
            emailService.sendPasswordResetEmail(email, resetLink);
            LOGGER.info("Password reset email sent successfully to: " + email);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent successfully"));
        } catch (Exception e) {
            LOGGER.severe("Error sending password reset email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error sending password reset email", "error", e.getMessage()));
        }
    }

    // -------------------- RESET PASSWORD --------------------
    @Transactional
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token"); 
        String email = request.get("email");
        String newPassword = request.get("password");

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Email non trouvé");
        }

        User user = userOptional.get();

        System.out.println("Ancien mot de passe encodé : " + user.getPassword());
        System.out.println("Nouveau mot de passe brut : " + newPassword);

        String hashed = passwordEncoder.encode(newPassword);

        System.out.println("Nouveau mot de passe encodé : " + hashed);

        user.setPassword(hashed);
        userRepository.save(user);

        User updatedUser = userRepository.findByEmail(email).orElseThrow();
        System.out.println("Password en base après update: " + updatedUser.getPassword());

        return ResponseEntity.ok("Mot de passe réinitialisé avec succès");
    }
}