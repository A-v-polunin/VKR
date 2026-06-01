from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Avg, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from .models import Category, Activity, Request, Participation, Favorite, Review
from .serializers import CategorySerializer, ActivitySerializer, RequestSerializer, ParticipationSerializer, FavoriteSerializer, ReviewSerializer
from .search import search_requests as search_requests_func
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid
import os
from django.conf import settings
from decimal import Decimal

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def activity_list(request):
    activities = Activity.objects.filter(is_active=True)
    category_id = request.query_params.get('category_id')
    if category_id:
        activities = activities.filter(category_id=category_id)
    serializer = ActivitySerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def request_list(request):
    now = timezone.now()
    today = now.date()
    current_time = now.time()
    past_requests = Request.objects.filter(Q(status='active') & (Q(date__lt=today) | Q(date=today, time__lt=current_time)))
    past_requests.update(status='completed')
    past_filled_requests = Request.objects.filter(Q(status='filled') & (Q(date__lt=today) | Q(date=today, time__lt=current_time)))
    past_filled_requests.update(status='completed')
    is_mod = request.user.is_authenticated and (request.user.is_moderator or request.user.is_staff)
    category_id = request.query_params.get('category_id')
    activity_id = request.query_params.get('activity_id')
    request_type = request.query_params.get('request_type')
    level = request.query_params.get('level')
    format_type = request.query_params.get('format')
    creator_id = request.query_params.get('creator_id')
    metro_line = request.query_params.get('metro_line')
    metro_stations_param = request.query_params.get('metro_stations')
    quick_tag_param = request.query_params.get('quick_tag')
    if quick_tag_param == 'nearby' and (not metro_stations_param) and request.user.is_authenticated:
        try:
            home_metro = (request.user.profile.home_metro_station_id or '').strip()
        except Exception:
            home_metro = ''
        if home_metro:
            metro_stations_param = home_metro
    if quick_tag_param == 'nearby' and metro_stations_param:
        from .metro_nearby import expand_metro_station_ids
        raw_ids = [s.strip() for s in str(metro_stations_param).split(',') if s.strip()]
        if raw_ids:
            metro_stations_param = ','.join(expand_metro_station_ids(raw_ids, radius=3))
    requests = Request.objects.all()
    if category_id:
        requests = requests.filter(activity__category_id=category_id)
    if activity_id:
        requests = requests.filter(activity_id=activity_id)
    if request_type:
        requests = requests.filter(request_type=request_type)
    if level:
        requests = requests.filter(level=level)
    if format_type:
        requests = requests.filter(format=format_type)
    if creator_id:
        requests = requests.filter(creator_id=creator_id)
    elif is_mod:
        status_filter = request.query_params.get('status')
        if status_filter:
            requests = requests.filter(status=status_filter)
    elif request.user.is_authenticated:
        user_participation_ids = Participation.objects.filter(user=request.user, status='approved').values_list('request_id', flat=True)
        requests = requests.filter(Q(status='active') & Q(visibility='public') & (Q(date__gt=today) | Q(date=today, time__gte=current_time)) | Q(id__in=user_participation_ids))
    else:
        requests = requests.filter(Q(status='active') & Q(visibility='public') & (Q(date__gt=today) | Q(date=today, time__gte=current_time)))
    if request.user.is_authenticated:
        from apps.accounts.models import Interest
        user_interests = list(Interest.objects.filter(user=request.user).values_list('activity_id', flat=True))
        if user_interests:
            requests = requests.annotate(interest_priority=Case(When(activity_id__in=user_interests, then=1), default=0, output_field=IntegerField())).order_by('-interest_priority', '-created_at')
        else:
            requests = requests.order_by('-created_at')
    else:
        requests = requests.order_by('-created_at')
    quick_tag = quick_tag_param or request.query_params.get('quick_tag')
    if quick_tag == 'today':
        today = timezone.now().date()
        requests = requests.filter(date=today)
    elif quick_tag == 'weekend':
        from .metro_nearby import nearest_weekend_sat_sun
        today = timezone.now().date()
        saturday, sunday = nearest_weekend_sat_sun(today)
        requests = requests.filter(date__in=[saturday, sunday])
    elif quick_tag == 'nearby':
        pass
    requests_list = list(requests)
    for req in requests_list:
        active_count = Participation.objects.filter(request=req, status='approved').count()
        needs_save = False
        if req.current_participants != active_count:
            req.current_participants = active_count
            needs_save = True
        if active_count >= req.max_participants and req.status == 'active':
            req.status = 'filled'
            needs_save = True
        elif active_count < req.max_participants and req.status == 'filled':
            req.status = 'active'
            needs_save = True
        if needs_save:
            req.save(update_fields=['current_participants', 'status'])
    if metro_line or metro_stations_param:
        selected_station_ids = []
        if metro_stations_param:
            selected_station_ids = [s.strip() for s in str(metro_stations_param).split(',') if s.strip()]

        def matches_metro(req):
            stations = getattr(req, 'metro_stations', None) or []

            def station_has_id(station):
                if isinstance(station, dict):
                    sid = station.get('id') or station.get('slug') or station.get('code')
                    return sid in selected_station_ids if sid else False
                return station in selected_station_ids

            def station_on_line(station):
                if not metro_line:
                    return True
                if isinstance(station, dict):
                    line = station.get('line') or station.get('line_id')
                    return line == metro_line
                return False
            if selected_station_ids:
                if not any((station_has_id(s) for s in stations)):
                    return False
            if metro_line:
                if not any((station_on_line(s) for s in stations)):
                    return False
            return True
        requests_list = [req for req in requests_list if matches_metro(req)]
    serializer = RequestSerializer(requests_list, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def request_detail(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        active_count = Participation.objects.filter(request=req, status='approved').count()
        needs_save = False
        if req.current_participants != active_count:
            req.current_participants = active_count
            needs_save = True
        if active_count >= req.max_participants and req.status == 'active':
            req.status = 'filled'
            needs_save = True
        elif active_count < req.max_participants and req.status == 'filled':
            req.status = 'active'
            needs_save = True
        if needs_save:
            req.save(update_fields=['current_participants', 'status'])
        serializer = RequestSerializer(req, context={'request': request})
        return Response(serializer.data)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_create(request):
    data = request.data.copy()
    data['creator'] = request.user.id
    serializer = RequestSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        req = serializer.save(creator=request.user)
        from apps.accounts.models import Interest
        from apps.notifications.models import Notification
        interested_users = Interest.objects.filter(activity=req.activity).exclude(user=request.user).values_list('user', flat=True).distinct()
        for user_id in interested_users[:50]:
            from apps.accounts.models import User
            try:
                user = User.objects.get(pk=user_id)
                Notification.objects.create(user=user, notification_type='new_request_nearby', title='Новая заявка по вашим интересам', message=f'Создана новая заявка "{req.title}" по активности "{req.activity.name}"', related_request=req, related_user=request.user)
            except User.DoesNotExist:
                pass
        Notification.objects.create(user=request.user, notification_type='request_created', title='Заявка создана', message=f'Ваша заявка "{req.title}" успешно создана и опубликована', related_request=req)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def request_edit(request, pk):
    try:
        req = Request.objects.get(pk=pk, creator=request.user)
        old_status = req.status
        old_date = req.date
        serializer = RequestSerializer(req, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            req = serializer.save()
            active_count = Participation.objects.filter(request=req, status='approved').count()
            needs_save = False
            if req.current_participants != active_count:
                req.current_participants = active_count
                needs_save = True
            if active_count >= req.max_participants and req.status == 'active':
                req.status = 'filled'
                needs_save = True
            elif active_count < req.max_participants and req.status == 'filled':
                req.status = 'active'
                needs_save = True
            if needs_save:
                req.save(update_fields=['current_participants', 'status'])
            from apps.notifications.models import Notification
            new_status = req.status
            new_date = req.date
            if new_status == 'cancelled' and old_status != 'cancelled':
                participations = Participation.objects.filter(request=req, status='approved')
                for participation in participations:
                    Notification.objects.create(user=participation.user, notification_type='request_cancelled', title='Заявка отменена', message=f'Заявка "{req.title}" была отменена', related_request=req, related_user=request.user)
            if new_date != old_date and new_status not in ('cancelled', 'completed'):
                participations = Participation.objects.filter(request=req, status='approved')
                for participation in participations:
                    Notification.objects.create(user=participation.user, notification_type='request_rescheduled', title='Заявка перенесена', message=f'Заявка "{req.title}" перенесена на {new_date}', related_request=req, related_user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена или нет прав на редактирование'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def request_delete(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        is_creator = req.creator == request.user
        is_mod = is_moderator(request.user)
        if not is_creator and (not is_mod):
            return Response({'error': 'Недостаточно прав на удаление'}, status=status.HTTP_403_FORBIDDEN)
        reason = request.data.get('reason', '') if is_mod else ''
        creator = req.creator
        request_title = req.title
        participants = list(Participation.objects.filter(request=req, status='approved').exclude(user=creator).select_related('user'))
        req.delete()
        from apps.notifications.models import Notification
        if is_mod:
            if creator:
                Notification.objects.create(user=creator, notification_type='request_cancelled', title='Заявка удалена модератором', message=f'Ваша заявка "{request_title}" была удалена модератором' + (f'. Причина: {reason}' if reason else ''), related_user=request.user)
            for p in participants:
                Notification.objects.create(user=p.user, notification_type='request_cancelled', title='Заявка удалена', message=f'Заявка "{request_title}", в которой вы участвовали, была удалена модератором' + (f'. Причина: {reason}' if reason else ''), related_user=request.user)
        else:
            for p in participants:
                Notification.objects.create(user=p.user, notification_type='request_cancelled', title='Заявка отменена', message=f'Заявка "{request_title}", в которой вы участвовали, была отменена создателем', related_user=creator)
        return Response({'message': 'Заявка удалена'}, status=status.HTTP_200_OK)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def participate(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        existing_participation = Participation.objects.filter(request=req, user=request.user).first()
        if existing_participation:
            if existing_participation.status == 'excluded':
                return Response({'error': 'Вы были исключены из этой заявки и не можете снова участвовать'}, status=status.HTTP_403_FORBIDDEN)
            return Response({'error': 'Вы уже откликнулись на эту заявку'}, status=status.HTTP_400_BAD_REQUEST)
        if req.creator == request.user:
            return Response({'error': 'Нельзя откликнуться на свою заявку'}, status=status.HTTP_400_BAD_REQUEST)
        current_participants = Participation.objects.filter(request=req, status='approved').count()
        if current_participants >= req.max_participants:
            return Response({'error': 'Заявка уже заполнена'}, status=status.HTTP_400_BAD_REQUEST)
        participation = Participation.objects.create(request=req, user=request.user, message=request.data.get('message', ''), status='approved')
        req.current_participants = current_participants + 1
        if req.current_participants >= req.max_participants and req.status == 'active':
            req.status = 'filled'
        req.save(update_fields=['current_participants', 'status'])
        from apps.notifications.models import Notification
        Notification.objects.create(user=req.creator, notification_type='new_response', title='Кто-то вступил в вашу заявку', message=f'{request.user.username} вступил в заявку "{req.title}"', related_request=req, related_user=request.user)
        Notification.objects.create(user=request.user, notification_type='participation_approved', title='Участие подтверждено', message=f'Вы успешно вступили в заявку "{req.title}"', related_request=req, related_user=req.creator)
        serializer = ParticipationSerializer(participation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def favorites_list(request):
    favorites = Favorite.objects.filter(user=request.user)
    requests = [favorite.request for favorite in favorites]
    serializer = RequestSerializer(requests, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        favorite, created = Favorite.objects.get_or_create(user=request.user, request=req)
        if request.method == 'GET':
            return Response({'is_favorite': True})
        if request.method == 'DELETE' or (request.method == 'POST' and (not created)):
            favorite.delete()
            return Response({'is_favorite': False})
        serializer = FavoriteSerializer(favorite)
        return Response({'is_favorite': True, **serializer.data}, status=status.HTTP_201_CREATED)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def participation_exclude(request, pk, participation_id):
    try:
        req = Request.objects.get(pk=pk, creator=request.user)
        participation = Participation.objects.get(pk=participation_id, request=req)
        excluded_user = participation.user
        participation.status = 'excluded'
        participation.save()
        active_count = Participation.objects.filter(request=req, status='approved').count()
        req.current_participants = active_count
        if active_count < req.max_participants and req.status == 'filled':
            req.status = 'active'
        elif active_count >= req.max_participants and req.status == 'active':
            req.status = 'filled'
        req.save(update_fields=['current_participants', 'status'])
        from apps.notifications.models import Notification
        Notification.objects.create(user=excluded_user, notification_type='participation_rejected', title='Вас исключили из активности', message=f'Вас исключили из активности "{req.title}"', related_request=req, related_user=request.user)
        return Response({'message': 'Участник исключён'}, status=status.HTTP_200_OK)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена или нет прав'}, status=status.HTTP_404_NOT_FOUND)
    except Participation.DoesNotExist:
        return Response({'error': 'Участие не найдено'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def request_participations(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        if req.creator != request.user:
            return Response({'error': 'Нет доступа к списку участников'}, status=status.HTTP_403_FORBIDDEN)
        participations = Participation.objects.filter(request=req, status='approved').order_by('-created_at')
        serializer = ParticipationSerializer(participations, many=True)
        return Response(serializer.data)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_requests(request):
    requests = Request.objects.filter(creator=request.user)
    serializer = RequestSerializer(requests, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_participations(request):
    participations = Participation.objects.filter(user=request.user, status='approved')
    request_ids = participations.values_list('request_id', flat=True)
    requests = Request.objects.filter(id__in=request_ids)
    serializer = RequestSerializer(requests, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_requests(request):
    query = request.query_params.get('q', '')
    qp = request.query_params.copy()
    if request.user.is_authenticated:
        try:
            home_metro = (request.user.profile.home_metro_station_id or '').strip()
        except Exception:
            home_metro = ''
        if qp.get('quick_tag') == 'nearby' and (not qp.get('metro_stations')) and home_metro:
            qp['metro_stations'] = home_metro
    results = search_requests_func(query, qp)
    serializer = RequestSerializer(results, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def reviews_list(request, user_id=None):
    if user_id:
        reviews = Review.objects.filter(reviewed_user_id=user_id)
    else:
        reviews = Review.objects.none()
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_create(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        reviewed_user_id = request.data.get('reviewed_user_id')
        if not reviewed_user_id:
            if req.creator == request.user:
                return Response({'error': 'Необходимо указать пользователя, которому ставите отзыв'}, status=status.HTTP_400_BAD_REQUEST)
            reviewed_user_id = req.creator.id
        else:
            reviewed_user_id = int(reviewed_user_id)
        if reviewed_user_id == request.user.id:
            return Response({'error': 'Нельзя ставить отзыв самому себе'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.accounts.models import User
        reviewed_user = User.objects.get(pk=reviewed_user_id)
        existing_review = Review.objects.filter(request=req, reviewer=request.user, reviewed_user_id=reviewed_user_id).first()
        if existing_review:
            return Response({'error': 'Вы уже оставили отзыв этому пользователю по этой заявке'}, status=status.HTTP_400_BAD_REQUEST)
        review = Review.objects.create(request=req, reviewer=request.user, reviewed_user=reviewed_user, rating=request.data.get('rating'), comment=request.data.get('comment', ''))
        from apps.notifications.models import Notification
        Notification.objects.create(user=reviewed_user, notification_type='new_review', title='Новый отзыв', message=f'{request.user.username} оставил вам отзыв по заявке "{req.title}"', related_request=req, related_user=request.user)
        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Request.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_photo(request):
    if 'photo' not in request.FILES:
        return Response({'error': 'Фото не предоставлено'}, status=status.HTTP_400_BAD_REQUEST)
    photo = request.FILES['photo']
    if photo.size > 5 * 1024 * 1024:
        return Response({'error': 'Размер файла не должен превышать 5MB'}, status=status.HTTP_400_BAD_REQUEST)
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if photo.content_type not in allowed_types:
        return Response({'error': 'Неподдерживаемый тип файла. Используйте JPEG, PNG, GIF или WebP'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        file_ext = os.path.splitext(photo.name)[1]
        unique_filename = f'{uuid.uuid4()}{file_ext}'
        file_path = default_storage.save(f'requests/photos/{unique_filename}', ContentFile(photo.read()))
        file_url = default_storage.url(file_path)
        if file_url.startswith('/'):
            file_url = request.build_absolute_uri(file_url)
        return Response({'url': file_url}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': f'Ошибка загрузки файла: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def is_moderator(user):
    return user.is_authenticated and (user.is_moderator or user.is_staff)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def category_create(request):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def category_edit(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        category = Category.objects.get(pk=pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Category.DoesNotExist:
        return Response({'error': 'Категория не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def category_delete(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        category = Category.objects.get(pk=pk)
        category.delete()
        return Response({'message': 'Категория удалена'}, status=status.HTTP_204_NO_CONTENT)
    except Category.DoesNotExist:
        return Response({'error': 'Категория не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activity_create(request):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    serializer = ActivitySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def activity_edit(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        activity = Activity.objects.get(pk=pk)
        serializer = ActivitySerializer(activity, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Activity.DoesNotExist:
        return Response({'error': 'Активность не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def activity_delete(request, pk):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    try:
        activity = Activity.objects.get(pk=pk)
        activity.delete()
        return Response({'message': 'Активность удалена'}, status=status.HTTP_204_NO_CONTENT)
    except Activity.DoesNotExist:
        return Response({'error': 'Активность не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistics(request):
    if not is_moderator(request.user):
        return Response({'error': 'Недостаточно прав'}, status=status.HTTP_403_FORBIDDEN)
    from apps.accounts.models import User
    total_requests = Request.objects.count()
    requests_by_type = Request.objects.values('request_type').annotate(count=Count('id'))
    requests_by_status = Request.objects.values('status').annotate(count=Count('id'))
    popular_activities = Activity.objects.annotate(request_count=Count('requests')).order_by('-request_count')[:10]
    cancelled_requests = Request.objects.filter(status='cancelled').count()
    cancelled_percentage = cancelled_requests / total_requests * 100 if total_requests > 0 else 0
    active_users = User.objects.annotate(requests_count=Count('created_requests'), participations_count=Count('participations', filter=Q(participations__status='approved'))).filter(Q(requests_count__gt=0) | Q(participations_count__gt=0)).order_by('-requests_count', '-participations_count')[:10]
    from django.db.models.functions import TruncDate
    requests_by_date = list(Request.objects.annotate(date_created=TruncDate('created_at')).values('date_created').annotate(count=Count('id')).order_by('-date_created')[:30])
    return Response({'total_requests': total_requests, 'requests_by_type': list(requests_by_type), 'requests_by_status': list(requests_by_status), 'popular_activities': [{'id': a.id, 'name': a.name, 'count': a.request_count} for a in popular_activities], 'cancelled_requests': cancelled_requests, 'cancelled_percentage': round(cancelled_percentage, 2), 'active_users': [{'id': u.id, 'username': u.username, 'requests_count': u.requests_count, 'participations_count': u.participations_count} for u in active_users], 'requests_by_date': list(requests_by_date)})