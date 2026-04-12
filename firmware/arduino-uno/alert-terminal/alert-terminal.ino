// HomeCanvas - Arduino Uno: 4-Digit Display + Alert Node
// Receives commands from ESP32 over Serial2 (GPIO16/17) at 9600 baud.
//
// Protocol:
//   "0000" - "9999"  → show that number on the 4-digit display
//   "ALRT" or any non-numeric string → alert blink + show dashes on display
//
// Wiring:
//   TM1637 CLK → Arduino pin 2
//   TM1637 DIO → Arduino pin 3
//   Alert LED  → Arduino pin 13 (built-in)
//
// Library: Install "TM1637Display" by Avishay Orpaz via Library Manager

#include <TM1637Display.h>

#define CLK_PIN  2
#define DIO_PIN  3
#define LED_PIN  13

TM1637Display display(CLK_PIN, DIO_PIN);

// Segment codes for "----" (all middle segments = dash)
const uint8_t SEG_DASH[] = {
  SEG_G, SEG_G, SEG_G, SEG_G
};

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Full brightness, show "0000" on boot
  display.setBrightness(7);
  display.showNumberDec(0, true);

  Serial.println("==================================");
  Serial.println(" HomeCanvas Alert-Terminal ONLINE ");
  Serial.println("==================================");
  Serial.println("Awaiting commands from ESP32...");
}

void loop() {
  if (Serial.available()) {
    String message = Serial.readStringUntil('\n');
    message.trim();

    if (message.length() == 0) return;

    Serial.println("");
    Serial.println(">> Received: [" + message + "]");

    // Determine if the message is a pure numeric string (1-4 digits)
    bool isNumeric = (message.length() >= 1 && message.length() <= 4);
    for (int i = 0; i < (int)message.length() && isNumeric; i++) {
      if (!isDigit(message.charAt(i))) isNumeric = false;
    }

    if (isNumeric) {
      // Show the 4-digit number with leading zeros (e.g. "42" → "0042")
      int num = message.toInt();
      display.showNumberDec(num, true);
      Serial.println("[DISPLAY] Showing: " + String(num));

    } else {
      // Non-numeric (e.g. "ALRT") → show dashes + blink LED
      Serial.println("[ALERT] Event: " + message);
      display.setSegments(SEG_DASH, 4, 0); // show "----"

      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(150);
        digitalWrite(LED_PIN, LOW);
        delay(150);
      }
    }

    Serial.println("----------------------------------");
  }
}