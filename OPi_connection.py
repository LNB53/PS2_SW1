import wiringpi
import time
import sys
import threading
import requests

# Functions
def lights_off():
    wiringpi.digitalWrite(LED_1, 0)
    wiringpi.digitalWrite(LED_2, 0)
    wiringpi.digitalWrite(LED_3, 0)
    wiringpi.digitalWrite(LED_4, 0)
    wiringpi.digitalWrite(RED_LED, 0)
    wiringpi.digitalWrite(GREEN_LED, 0)

def blink(_pin):
    wiringpi.digitalWrite(_pin, 1)    # Write 1 ( HIGH ) to pin
    time.sleep(0.1)
    wiringpi.digitalWrite(_pin, 0)    # Write 0 ( LOW ) to pin
    time.sleep(0.1)

# Input pins
BUTTON_1 = 0            # Yellow, taped
BUTTON_2 = 1            # Green, taped
BUTTON_3 = 2            # Purple, taped
BUTTON_4 = 3            # Gray, taped
SEND_BUTTON = 8         # Brown, taped

# Output pins
LED_1 = 4               # Yellow
LED_2 = 5               # Green
LED_3 = 6               # Purple
LED_4 = 7               # Gray
RED_LED = 9            # Black
GREEN_LED = 10           # Orange

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
wiringpi.pinMode(RED_LED, 1)
wiringpi.pinMode(GREEN_LED, 1)
lights_off()
print("Start")

# Var

student_id = "r0898448"
answer = 0
hosting_url = "https://rotten-ducks-sip.loca.lt/"

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
            answer = "A"
            wiringpi.digitalWrite(LED_1, 1)
            time.sleep(2)

        if B == 0:
            lights_off()
            print("B")
            answer = "B"
            wiringpi.digitalWrite(LED_2, 1)
            time.sleep(2)

        if C == 0:
            lights_off()
            print("C")
            answer = "C"
            wiringpi.digitalWrite(LED_3, 1)
            time.sleep(2)

        if D == 0:
            lights_off()
            print("D")
            answer = "D"
            wiringpi.digitalWrite(LED_4, 1)
            time.sleep(2)

        if wiringpi.digitalRead(SEND_BUTTON) == 0 and answer != 0:
            lights_off()
            on = False
            print("\nSending Answer")

            api_url = f"{hosting_url}submit_answer/{student_id}/{answer}"
            print(api_url)

            answer_data = {
                    "student_id": student_id,
                    "answer": answer
                }
            
            response = requests.post(api_url, json=answer_data)

            while not response:
                blink(RED_LED)

            if response.status_code == 500:
                wiringpi.digitalWrite(RED_LED, 1)
                time.sleep(3)
                wiringpi.digitalWrite(RED_LED, 0)
                time.sleep(0.3)

            elif response.status_code == 200:
                wiringpi.digitalWrite(GREEN_LED, 1)
                time.sleep(3)
                wiringpi.digitalWrite(GREEN_LED, 0)
                time.sleep(0.3)

    lights_off()
    print("\nEnd")

except KeyboardInterrupt:
    lights_off()
    print("\nProgram Terminated")
