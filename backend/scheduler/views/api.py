from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from scheduler.models import Commitment
from scheduler.serializers.commitment import CommitmentSerializer


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def commitments(request):
    """
    GET  /api/commitments/  -> list commitments for logged-in user
    POST /api/commitments/  -> create commitment for logged-in user
    """
    if request.method == "GET":
        qs = Commitment.objects.filter(user=request.user).order_by("start_time")
        serializer = CommitmentSerializer(qs, many=True)
        return Response(serializer.data)

    # POST
    serializer = CommitmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(user=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def commitment_detail(request, commitment_id: int):
    """
    GET    /api/commitments/<id>/ -> get one (owned by logged-in user)
    PUT    /api/commitments/<id>/ -> update one (owned by logged-in user)
    DELETE /api/commitments/<id>/ -> delete one (owned by logged-in user)
    """
    try:
        obj = Commitment.objects.get(id=commitment_id, user=request.user)
    except Commitment.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = CommitmentSerializer(obj)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = CommitmentSerializer(obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)  # keep ownership correct
        return Response(serializer.data)

    # DELETE
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)