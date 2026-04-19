void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  Serial.println("==================================");
  Serial.println(" ENTERPRISE VENT NODE ONLINE ");
  Serial.println("==================================");
  Serial.println("Awaiting telemetry alerts...");
}

void loop() {
  if (Serial.available()) {
    String message = Serial.readStringUntil('\n');
    Serial.println("");
    Serial.println("⚠️ SECURITY EVENT DETECTED ⚠️");
    Serial.println(">> " + message);
    Serial.println("----------------------------------");
    for (int i = 0; i < 5; i++) {
      digitalWrite(13, HIGH);
      delay(150);
      digitalWrite(13, LOW);
      delay(150);
    }
  }
}