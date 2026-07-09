"""AI analysis layer (Phase 3).

Vision-language model features that interpret a photo the way a photographer
would: scene understanding, subject identification, lighting explanation,
camera-setting estimation, composition critique, and a recreation guide.

Everything here degrades gracefully when ANTHROPIC_API_KEY is unset or the
API call fails, so the rest of the app (and CI without a key) never breaks.
"""
