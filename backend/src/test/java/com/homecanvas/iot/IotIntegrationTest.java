package com.homecanvas.iot;

import com.homecanvas.auth.model.User;
import com.homecanvas.auth.repository.UserRepository;
import com.homecanvas.iot.model.Device;
import com.homecanvas.iot.repository.DeviceRepository;
import com.homecanvas.iot.service.DeviceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Testcontainers
public class IotIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("homecanvas")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Test
    void testProvisionAndFetchDevices() {
        // 1. Create a user
        User user = new User();
        user.setUsername("testuser");
        user.setPasswordHash("password");
        user.setRole("USER");
        userRepository.save(user);

        // 2. Register a device to the user
        Device device = new Device();
        device.setMacAddress("AA:BB:CC:DD:EE:FF");
        device.setName("Test Device");
        device.setOwner(user);
        deviceRepository.save(device);

        // 3. Test Service
        List<?> devices = deviceService.getDevicesByUser(user);
        
        assertNotNull(devices);
        assertFalse(devices.isEmpty());
        System.out.println("Integration Test Passed: Device found in real containerized DB");
    }
}
