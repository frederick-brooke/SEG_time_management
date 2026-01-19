from django.urls import path
from scheduler.views.api import health, commitments, commitment_detail

urlpatterns = [
    path("health/", health),
    path("commitments/", commitments),
    path("commitments/<int:commitment_id>/", commitment_detail),
]