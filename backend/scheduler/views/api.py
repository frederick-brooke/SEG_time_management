from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from scheduler.models import Commitment
from scheduler.serializers.commitment import CommitmentSerializer

User = get_user_model()


def get_dev_user():
    """
    Temporary dev shortcut:
    - ensures there is at least 1 user
    - avoids crashing if the DB has no users yet
    """
    dev_user = User.objects.first()
    if dev_user is None:
        # Create a simple dev user if none exist
        dev_user = User.objects.create_user(
            username="devuser",
            password="devpassword123",
        )
    return dev_user


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET", "POST"])
def commitments(request):
    """
    GET  /api/commitments/  -> list commitments
    POST /api/commitments/  -> create commitment (owned by dev user for now)
    """
    dev_user = get_dev_user()

    if request.method == "GET":
        qs = Commitment.objects.filter(user=dev_user).order_by("start_time")
        serializer = CommitmentSerializer(qs, many=True)
        return Response(serializer.data)

    # POST
    serializer = CommitmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(user=dev_user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def commitment_detail(request, commitment_id: int):
    """
    GET    /api/commitments/<id>/ -> get one (dev user only)
    PUT    /api/commitments/<id>/ -> update one (dev user only)
    DELETE /api/commitments/<id>/ -> delete one (dev user only)
    """
    dev_user = get_dev_user()

    try:
        obj = Commitment.objects.get(id=commitment_id, user=dev_user)
    except Commitment.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = CommitmentSerializer(obj)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = CommitmentSerializer(obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=dev_user)  # keep ownership consistent
        return Response(serializer.data)

    # DELETE
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)