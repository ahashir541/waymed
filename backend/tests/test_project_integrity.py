"""Protect research-story counts and translation key parity from drift."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _flatten_keys(values: dict, prefix: str = "") -> set[str]:
    keys: set[str] = set()
    for key, value in values.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.update(_flatten_keys(value, full_key))
        else:
            keys.add(full_key)
    return keys


def test_story_research_integrity():
    story_path = ROOT / "backend" / "data" / "story.json"
    story = json.loads(story_path.read_text(encoding="utf-8"))

    assert len(story["personas"]) == 6
    assert {persona["code"] for persona in story["personas"]} == {
        "P1",
        "P2",
        "P3",
        "D1",
        "S1",
        "S2",
    }
    assert len(story["stickies"]) == 34
    assert {group["code"] for group in story["groups"]} == {
        "A",
        "B",
        "C",
        "D",
        "E",
    }
    assert sum(bool(sticky.get("needs_teacher_review")) for sticky in story["stickies"]) == 4
    assert story["selected_hmw"] == {
        "group": "B",
        "number": 1,
        "text": "How might we help first-time visitors reach the right department the first time?",
    }
    assert len(story["traceability"]) == 8
    assert story["ideate"]["selected_idea"] == "WayMed"
    assert story["ideate"]["selection_reason"].startswith("[PLACEHOLDER:")
    assert story["test"]["status"].startswith("[PLACEHOLDER:")
    assert len(story["future_scope"]) == 4
    for item in story["future_scope"]:
        for language in ("ur", "sd"):
            translation = item["display_translations"][language]
            assert translation["item"]
            assert translation["evidence"]
    group_b = next(group for group in story["groups"] if group["code"] == "B")
    for language in ("ur", "sd"):
        translated_group = group_b["display_translations"][language]
        assert len(translated_group["hmws"]) == len(group_b["hmws"])
        assert translated_group["evidence"]
        assert all(
            sticky.get("display_translations", {}).get(language)
            or sticky.get("quote_display_translations", {}).get(language)
            for sticky in story["stickies"]
            if sticky["number"] in {6, 7, 8, 9, 11}
        )
    assert story["stickies"][7]["text"] == (
        '"Koi kahin aur bhej deta hai." (paraphrased)'
    )


def test_frontend_locale_keys_match_in_all_three_languages():
    locale_dir = ROOT / "frontend" / "src" / "locales"
    locales = {
        language: json.loads(
            (locale_dir / f"{language}.json").read_text(encoding="utf-8")
        )
        for language in ("en", "ur", "sd")
    }
    keys = {
        language: _flatten_keys(values)
        for language, values in locales.items()
    }

    assert keys["en"] == keys["ur"] == keys["sd"]
    for language, values in locales.items():
        flattened = _flatten_keys(values)
        assert all(isinstance(_lookup(values, key), str) for key in flattened), language
        assert all(_lookup(values, key).strip() for key in flattened), language


def _lookup(values: dict, dotted_key: str) -> str:
    current = values
    for part in dotted_key.split("."):
        current = current[part]
    return current
