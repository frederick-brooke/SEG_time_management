from django.shortcuts import render
from schedular.views.decorators import login_prohibited


@login_prohibited
def home(request):
    """Display the application's start/home screen."""

    return render(request, 'home.html')