package com.homecanvas.iot;

import java.sql.*;

public class DbChecker {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/homecanvas?useSSL=false&serverTimezone=UTC", "root", "1234")) {
            System.out.println("Connected to database.");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT id, mac_address, name, owner_id, last_seen FROM devices");
            while (rs.next()) {
                System.out.println("ID: " + rs.getInt("id") + " | MAC: " + rs.getString("mac_address") + " | Name: " + rs.getString("name") + " | Owner: " + rs.getInt("owner_id") + " | LastSeen: " + rs.getTimestamp("last_seen"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
