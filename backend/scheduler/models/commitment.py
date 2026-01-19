from django.conf import settings
from django.db import models

class Commitment(models.Model):
    TYPE_CHOICES = [
        ("lecture", "Lecture"),
        ("study", "Study"),
        ("coursework", "Coursework"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return self.title