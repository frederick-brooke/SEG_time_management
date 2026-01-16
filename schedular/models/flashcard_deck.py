from django.db import models
from django.db.models import Model

class flashcard_deck(models.Model):
    name = models.CharField(max_length=100)