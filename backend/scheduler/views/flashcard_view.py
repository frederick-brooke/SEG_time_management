#Page for creating, reviewing, updating and deleting flashcards and its folders
from django.shortcuts import render
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from .models import Flashcard

def flashcard_create(request):
    """
    Docstring for flashcard_create
    
    :param request: Description
    """
    if request.method == "POST":
        deck = get_object_or_404(Deck, id=deck_id)
    
        Flashcard.objects.create(
            deck=deck,
            front_text=request.POST["front"],
            back_text=request.POST["back"],
            order=deck.flashcard_set.count() + 1,
        )
