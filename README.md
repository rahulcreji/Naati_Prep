# Natti_Website
This is the website for naatii

Practice dialogues for the NAATI English ⇄ Malayalam test. Open a conversation, play each question,
interpret it yourself, then click **Show answer** to compare.

Website: https://rahulcreji.github.io/Natti_Website/

## Adding conversations

1. Copy the conversation folders in as `<category>/<conversation name>/questions/` and `answers/`
   (the layout `pdf_to_audio_enhance_google.py` writes).
2. Run `python build_manifest.py` to update `manifest.json`.
3. Commit and push. GitHub Pages updates the site in a minute or two.
