from flask import Flask, request
import requests

app = Flask(__name__)


@app.route("/generate")
def generate_random_word():
    try:
        number_of_chars = int(request.args.get("length"))
        if number_of_chars < 4 or number_of_chars > 10:
            raise Exception("Number of characters should be 3 < chars < 11")
        random_word_response = requests.get(
            f"https://random-word-api.vercel.app/api?words=1&length={number_of_chars}"
        )
        random_word = random_word_response.json()
        return {"ok": True, "message": random_word[0].upper()}, 200
    except Exception as e:
        return {"ok": False, "message": str(e)}, 500


@app.route("/validate")
def validate_words():
    try:
        original_word = request.args.get("original")
        input_word = request.args.get("input")
        input_word_exists_response = requests.get(
            f"https://api.dictionaryapi.dev/api/v2/entries/en/{input_word}"
        )
        if input_word_exists_response.status_code == 404:
            raise Exception("Input word doesn't exist in English language")

        input_word_unique_chars = "".join(dict.fromkeys(input_word))
        validate_response = {}
        for input_char in input_word_unique_chars:
            indexes = [i for i, c in enumerate(original_word) if c == input_char]
            if indexes:
                validate_response[input_char] = {"exists": True, "indexes": indexes}

        if validate_response:
            return {"ok": True, "message": validate_response}, 200
        else:
            return {"ok": False, "message": "no character matches"}, 404

    except Exception as e:
        return {"ok": False, "message": str(e)}, 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
