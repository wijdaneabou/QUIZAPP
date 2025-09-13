package com.quizai.quizapp.service;

import com.quizai.quizapp.dto.UserDto;
import com.quizai.quizapp.model.User;
import com.quizai.quizapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::new)
                .collect(Collectors.toList());
    }
    
    public Optional<UserDto> getUserById(Long id) {
        return userRepository.findById(id).map(UserDto::new);
    }
    
    public Optional<UserDto> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(UserDto::new);
    }
    
    public UserDto createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        return new UserDto(savedUser);
    }
    
    public UserDto updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        user.setRole(userDetails.getRole());
        user.setIsActive(userDetails.getIsActive());
        user.setNiveau(userDetails.getNiveau());
        
        User updatedUser = userRepository.save(user);
        return new UserDto(updatedUser);
    }
    

    public UserDto updateUserLevel(String email, String niveau) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
  
        if (!User.Role.USER.equals(user.getRole())) {
            throw new RuntimeException("Seuls les étudiants peuvent avoir un niveau scolaire");
        }
        
        user.setNiveau(niveau);
        User updatedUser = userRepository.save(user);
        return new UserDto(updatedUser);
    }
    
    
    public List<UserDto> getUsersByLevel(String niveau) {
        return userRepository.findAll().stream()
                .filter(user -> User.Role.USER.equals(user.getRole()) && niveau.equals(user.getNiveau()))
                .map(UserDto::new)
                .collect(Collectors.toList());
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}