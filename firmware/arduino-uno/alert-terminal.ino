void setup() {
  // Start the communication line (Listens to ESP32 on Pin 0, Talks to Laptop via USB)
  Serial.begin(9600);
  
  // Set up the built-in LED (Pin 13) as our physical alarm siren
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  
  // Print the startup header to the laptop screen
  Serial.println("==================================");
  Serial.println(" ENTERPRISE VENT NODE ONLINE ");
  Serial.println("==================================");
  Serial.println("Awaiting telemetry alerts...");
}

void loop() {
  // If the ESP32 shouts a message down the UART wire...
  if (Serial.available()) {
    String message = Serial.readStringUntil('\n');
    
    // 1. Print the formatted alert to the laptop screen
    Serial.println("");
    Serial.println("⚠️ SECURITY EVENT DETECTED ⚠️");
    Serial.println(">> " + message);
    Serial.println("----------------------------------");
    
    // 2. Flash the Arduino's built-in LED rapidly like a siren
    for (int i = 0; i < 5; i++) {
      digitalWrite(13, HIGH);
      delay(150);
      digitalWrite(13, LOW);
      delay(150);
    }
  }
}
