"""
MODULE I.1: Autocomplete & Predictive Text Fallback Engine
File: typing_engine/autocomplete.py
Provides ultra-fast, offline dictionary-based word completion, prefix matching,
and common conversational sentence suggestions.
"""

from typing import List, Dict

# High-frequency dictionary with weights
COMMON_WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
    "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
    "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
    "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
    "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
    "new", "want", "because", "any", "these", "give", "day", "most", "us", "hello", "help", "please",
    "thank", "thanks", "computer", "screen", "keyboard", "mouse", "motion", "ease", "assistive",
    "technology", "control", "yes", "no", "okay", "need", "water", "food", "medicine", "pain", "doctor"
]

# Common conversational n-grams / next-word completions
N_GRAM_SUGGESTIONS = {
    "how are": ["you", "things", "we"],
    "i want": ["to", "a", "some", "help"],
    "i need": ["help", "water", "assistance", "to rest"],
    "please call": ["the doctor", "nurse", "family", "help"],
    "thank you": ["very much", "so much", "for your help"],
    "good": ["morning", "afternoon", "evening", "night", "job"],
    "what is": ["this", "that", "the time", "happening"]
}

class AutocompleteEngine:
    def __init__(self):
        self.words = sorted(set(COMMON_WORDS))

    def get_suggestions(self, current_text: str, max_suggestions: int = 5) -> List[str]:
        """
        Returns relevant word or phrase suggestions given the current typing context.
        """
        if not current_text or not current_text.strip():
            return ["I need", "Please", "Thank you", "Hello", "How are you"]

        cleaned = current_text.strip().lower()

        # Check for phrase / n-gram completion first
        for phrase, continuations in N_GRAM_SUGGESTIONS.items():
            if cleaned.endswith(phrase):
                return continuations[:max_suggestions]

        # Extract last token for prefix matching
        tokens = cleaned.split()
        if not tokens:
            return []

        last_word = tokens[-1]
        matches = [w for w in self.words if w.startswith(last_word) and w != last_word]
        
        # Sort matches by length (prefer concise completions)
        matches.sort(key=lambda x: (len(x), x))
        
        if matches:
            return matches[:max_suggestions]

        # If no direct prefix matches, offer contextual continuations
        return ["help", "please", "yes", "no", "thank you"][:max_suggestions]
