from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Complaint, Ban
from .serializers import ComplaintSerializer, BanSerializer
from apps.activities.models import Request
from apps.accounts.models import User

def is_moderator(user):
    return user.is_authenticated and (user.is_moderator or user.is_staff)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def complaint_list(request):
    if is_moderator(request.user):
        complaints = Complaint.objects.all().order_by('-created_at')
    else:
        complaints = Complaint.objects.filter(complainant=request.user).order_by('-created_at')
    status_filter = request.query_params.get('status')
    if status_filter:
        complaints = complaints.filter(status=status_filter)
    serializer = ComplaintSerializer(complaints, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complaint_create(request):
    data = request.data.copy()
    data['complainant'] = request.user.id
    serializer = ComplaintSerializer(data=data)
    if serializer.is_valid():
        serializer.save(complainant=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def complaint_detail(request, pk):
    try:
        if is_moderator(request.user):
            complaint = Complaint.objects.get(pk=pk)
        else:
            complaint = Complaint.objects.get(pk=pk, complainant=request.user)
        serializer = ComplaintSerializer(complaint)
        return Response(serializer.data)
    except Complaint.DoesNotExist:
        return Response({'error': 'Жалоба не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complaint_resolve(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        complaint = Complaint.objects.get(pk=pk)
        status_value = request.data.get('status', 'reviewed')
        comment = request.data.get('moderator_comment', '')
        complaint.status = status_value
        complaint.moderator = request.user
        complaint.moderator_comment = comment
        complaint.save()
        from apps.notifications.models import Notification
        from apps.accounts.models import Profile
        from decimal import Decimal
        if complaint.complainant:
            status_labels = {'resolved': 'решена', 'rejected': 'отклонена', 'reviewed': 'рассмотрена'}
            Notification.objects.create(user=complaint.complainant, notification_type='new_message', title='Жалоба обработана', message=f"Ваша жалоба была {status_labels.get(status_value, 'обработана')}. {(comment if comment else '')}", related_user=request.user)
        if status_value == 'resolved' and complaint.reported_user:
            Notification.objects.create(user=complaint.reported_user, notification_type='new_message', title='Поступила жалоба', message=f'На вас поступила жалоба, которая была признана обоснованной.', related_user=request.user)
        serializer = ComplaintSerializer(complaint)
        return Response(serializer.data)
    except Complaint.DoesNotExist:
        return Response({'error': 'Жалоба не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ban_list(request):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    Ban.objects.filter(is_active=True, ends_at__lte=timezone.now()).update(is_active=False)
    bans = Ban.objects.all().order_by('-created_at')
    is_active_param = request.query_params.get('is_active')
    if is_active_param is not None:
        is_active_param = is_active_param.lower() == 'true'
        bans = bans.filter(is_active=is_active_param)
    serializer = BanSerializer(bans, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ban_create(request):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'error': 'Не указан пользователь (user_id)'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'Укажите причину блокировки'}, status=status.HTTP_400_BAD_REQUEST)
    ban_type = request.data.get('ban_type', 'temporary')
    ends_at = None
    ends_at_raw = request.data.get('ends_at') or None
    if ends_at_raw:
        from django.utils.dateparse import parse_datetime
        ends_at = parse_datetime(ends_at_raw)
        if ends_at is None:
            return Response({'error': 'Неверный формат даты окончания'}, status=status.HTTP_400_BAD_REQUEST)
        if timezone.is_naive(ends_at):
            ends_at = timezone.make_aware(ends_at)
    ban = Ban.objects.create(user=target_user, ban_type=ban_type, reason=reason, moderator=request.user, starts_at=timezone.now(), ends_at=ends_at)
    serializer = BanSerializer(ban)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def moderate_request(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        req = Request.objects.get(pk=pk)
        action = request.data.get('action')
        if action == 'approve':
            req.status = 'active'
        elif action == 'reject':
            req.status = 'cancelled'
        elif action == 'hide':
            req.visibility = 'link'
        req.save()
        return Response({'message': f'Заявка {action}'})
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def moderate_user(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(pk=pk)
        action = request.data.get('action')
        if action == 'ban':
            Ban.objects.create(user=user, ban_type=request.data.get('ban_type', 'temporary'), reason=request.data.get('reason', ''), moderator=request.user, starts_at=timezone.now(), ends_at=request.data.get('ends_at'))
        elif action == 'unban':
            Ban.objects.filter(user=user, is_active=True).update(is_active=False)
        elif action == 'make_moderator':
            user.is_moderator = True
            user.save()
        return Response({'message': f'Действие {action} выполнено'})
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)