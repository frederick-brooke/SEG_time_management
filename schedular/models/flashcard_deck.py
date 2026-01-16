from django.db import models
from django.db.models import Model

class FlashcardDeck(models.Model):
    """
    Docstring for FlashcardDeck
    """
    name = models.CharField(max_length=100)