import wiringpi
import time
import sys
import threading

# Functions
def lights_off():
    wiringpi.digitalWrite(LED_1, 0)
    wiringpi.digitalWrite(LED_2, 0)
    wiringpi.digitalWrite(LED_3, 0)
    wiringpi.digitalWrite(LED_4, 0)
    wiringpi.digitalWrite(SEND_LED, 0)
    wiringpi.digitalWrite(TRUE_LED, 0)

def blink(_pin):
    wiringpi.digitalWrite(_pin, 1)    # Write 1 ( HIGH ) to pin
    time.sleep(0.1)
    wiringpi.digitalWrite(_pin, 0)    # Write 0 ( LOW ) to pin
    time.sleep(0.1)

# Input pins
BUTTON_1 = 0
BUTTON_2 = 1
BUTTON_3 = 2
BUTTON_4 = 3
SEND_BUTTON = 8

# Output pins
LED_1 = 4
LED_2 = 5
LED_3 = 6
LED_4 = 7
SEND_LED = 9
TRUE_LED = 10

# General setup
wiringpi.wiringPiSetup()
wiringpi.pinMode(BUTTON_1, 0)
wiringpi.pinMode(BUTTON_2, 0)
wiringpi.pinMode(BUTTON_3, 0)
wiringpi.pinMode(BUTTON_4, 0)
wiringpi.pinMode(SEND_BUTTON, 0)
wiringpi.pinMode(LED_1, 1)
wiringpi.pinMode(LED_2, 1)
wiringpi.pinMode(LED_3, 1)
wiringpi.pinMode(LED_4, 1)
wiringpi.pinMode(SEND_LED, 1)
wiringpi.pinMode(TRUE_LED, 1)
lights_off()
print("Start")

# Main

try:
    on = True
    while on:
        A = wiringpi.digitalRead(BUTTON_1)
        B = wiringpi.digitalRead(BUTTON_2)
        C = wiringpi.digitalRead(BUTTON_3)
        D = wiringpi.digitalRead(BUTTON_4)

        if A == 0:
            lights_off()
            print("A")
            wiringpi.digitalWrite(LED_1, 1)
            time.sleep(2)

        if B == 0:
            lights_off()
            print("B")
            wiringpi.digitalWrite(LED_2, 1)
            time.sleep(2)

        if C == 0:
            lights_off()
            print("C")
            wiringpi.digitalWrite(LED_3, 1)
            time.sleep(2)

        if D == 0:
            lights_off()
            print("D")
            wiringpi.digitalWrite(LED_4, 1)
            time.sleep(2)

        if (wiringpi.digitalRead(SEND_BUTTON) == 0 and 
            (A == 0 or B == 0 or C == 0 or D == 0)):
            lights_off()
            on = False
            print("\nSending Answer")
            i = 1
            while i <= 20:
                blink(SEND_LED)
                i += 1
            wiringpi.digitalWrite(SEND_LED, 1)
            time.sleep(3)
            wiringpi.digitalWrite(SEND_LED, 0)
            time.sleep(1)
            wiringpi.digitalWrite(TRUE_LED, 1)
            time.sleep(3)

    lights_off()
    print("\nEnd")

except KeyboardInterrupt:
    lights_off()
    print("\nProgram Terminated")
