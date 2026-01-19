from rest_framework import serializers
from scheduler.models import Commitment

class CommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commitment
        fields = "__all__"