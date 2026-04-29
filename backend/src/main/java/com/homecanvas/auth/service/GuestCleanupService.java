package com.homecanvas.auth.service;

import com.homecanvas.auth.model.User;
import com.homecanvas.auth.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * GuestCleanupService - Automated resource management
 * 
 * Automatically deletes GUEST accounts and their associated data (devices, events, logs)
 * to prevent database bloat.
 */
@Service
@Slf4j
public class GuestCleanupService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Runs every 6 hours to clean up guest data older than 24 hours.
     * Fixed rate: 21,600,000 ms (6 hours)
     */
    @Scheduled(fixedRate = 21600000)
    @Transactional
    public void cleanupOldGuests() {
        log.info("[CLEANUP] Starting automated guest data cleanup...");
        
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        
        // Find all GUEST users created before the cutoff
        List<User> oldGuests = userRepository.findByRole("GUEST").stream()
            .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isBefore(cutoff))
            .toList();

        if (oldGuests.isEmpty()) {
            log.info("[CLEANUP] No expired guest accounts found.");
            return;
        }

        log.info("[CLEANUP] Found {} expired guest accounts. Deleting...", oldGuests.size());
        
        for (User guest : oldGuests) {
            try {
                // Cascading will handle devices, events, and logs
                userRepository.delete(guest);
                log.debug("[CLEANUP] Deleted guest: {}", guest.getUsername());
            } catch (Exception e) {
                log.error("[CLEANUP] Failed to delete guest {}: {}", guest.getUsername(), e.getMessage());
            }
        }
        
        log.info("[CLEANUP] Cleanup completed successfully.");
    }
}
