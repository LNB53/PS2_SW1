import requests
import time
import wiringpi
import sys

answer = "no answer"

wiringpi.wiringPiSetup()
wiringpi.pinMode(0, 0)
wiringpi.pinMode(1, 0)
wiringpi.pinMode(2, 0)
wiringpi.pinMode(3, 0)
wiringpi.digitalWrite(0, 1)
wiringpi.digitalWrite(1, 1)
wiringpi.digitalWrite(2, 1)
wiringpi.digitalWrite(3, 1)

print("Start")
try:
    while answer == "no answer":
        if wiringpi.digitalRead(0) == 0:
            answer = "A"

        if wiringpi.digitalRead(1) == 0:
            answer = "B"

        if wiringpi.digitalRead(2) == 0:
            answer = "C"

        if wiringpi.digitalRead(3) == 0:
            answer = "D"

        print(answer)
        time.sleep(5)

except KeyboardInterrupt:
    print("Exit")
    sys.exit(0)

    # answer_data = {
    #     "question_id": 1,
    #     "student_id": "r0844989",
    #     "answer": answer
    # }

    # response = requests.post("http://your-fastapi-server-ip:8000/submit_answer/1/123/Option%20A", json=answer_data)

    # print(response.json())
    # print(answer)

except KeyboardInterrupt:
    print("Exit")
    sys.exit(0)