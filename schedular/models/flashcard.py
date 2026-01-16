from django.db import models
from django.db.models import Model
"""
A flashcard model for the scheduling application.
"""
class Flashcard(models.Model):
    """
    A flashcard model for the scheduling application.
    """
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE)
    front_content = models.CharField(max_length=500)
    back_content = models.CharField(max_length=500)

    last_reviewed = models.DateTimeField(auto_now_add=True, null=False)

    def __str__(self):
        return self.front_content[:50]