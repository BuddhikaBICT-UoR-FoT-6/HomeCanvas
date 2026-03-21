-- HomeCanvas: Adaptive Ambient Intelligence System Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS home_canvas;
USE home_canvas;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices Table
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  mac_address VARCHAR(50) NOT NULL UNIQUE,
  room_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'offline',
  last_seen TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sensor Events Table (Time-series data)
CREATE TABLE sensor_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  light_level FLOAT,
  noise_level FLOAT,
  motion_detected BOOLEAN,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Rules Table
CREATE TABLE rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rule Conditions Table
CREATE TABLE rule_conditions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule_id INT NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- e.g., 'light', 'noise', 'motion'
  operator VARCHAR(10) NOT NULL,    -- e.g., '>', '<', '=='
  threshold FLOAT NOT NULL,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

-- Action Logs Table
CREATE TABLE action_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rule_id INT NOT NULL,
  target_device_id INT NOT NULL,
  action_taken VARCHAR(255) NOT NULL,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
  FOREIGN KEY (target_device_id) REFERENCES devices(id) ON DELETE CASCADE
);