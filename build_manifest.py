# Scans this folder for conversations and writes manifest.json for the website.
#
# A conversation is any folder <category>/<conversation name>/ that has questions/ and answers/
# with files named seg_<n>_<language>_question.mp3 and seg_<n>_<language>_answer.mp3.
#
# Run this again every time you add or remove a conversation, then commit and push.
#   python build_manifest.py

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AUDIO_NAME = re.compile(r"^seg_(\d+)_([a-z]+)_(question|answer)\.mp3$", re.IGNORECASE)


def read_audio(folder, kind):
    # {segment number: (file name, language)} for every mp3 of this kind in the folder
    audio = {}
    for file in folder.glob("*.mp3"):
        match = AUDIO_NAME.match(file.name)
        if match and match.group(3).lower() == kind:
            audio[int(match.group(1))] = (file.name, match.group(2).capitalize())
    return audio


def sort_key(name):
    # "2. Something" sorts before "10. Something"
    match = re.match(r"^(\d+)", name)
    return (int(match.group(1)) if match else float("inf"), name.lower())


def build():
    conversations = []
    for category in sorted((p for p in ROOT.iterdir() if p.is_dir() and not p.name.startswith(".")), key=lambda p: p.name.lower()):
        for conversation in sorted((p for p in category.iterdir() if p.is_dir()), key=lambda p: sort_key(p.name)):
            questions = read_audio(conversation / "questions", "question")
            answers = read_audio(conversation / "answers", "answer")
            if not questions and not answers:
                continue
            segments = []
            for number in sorted(set(questions) | set(answers)):
                segment = {"number": number}
                if number in questions:
                    segment["question"] = {"file": f"questions/{questions[number][0]}", "language": questions[number][1]}
                if number in answers:
                    segment["answer"] = {"file": f"answers/{answers[number][0]}", "language": answers[number][1]}
                segments.append(segment)
            conversations.append({
                "title": conversation.name,
                "category": category.name,
                "path": f"{category.name}/{conversation.name}",
                "segments": segments,
            })

    with open(ROOT / "manifest.json", "w", encoding="utf-8") as f:
        json.dump({"conversations": conversations}, f, ensure_ascii=False, indent=2)
    print(f"manifest.json: {len(conversations)} conversations")


if __name__ == "__main__":
    build()
