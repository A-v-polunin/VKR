import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login, logout
from django.contrib.auth.hashers import make_password
from django.conf import settings
from .models import User, Profile, Interest
from .telegram_auth import verify_auth_code, get_or_create_telegram_user
from .serializers import UserSerializer, ProfileSerializer, InterestSerializer
from apps.activities.models import Activity
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def telegram_auth(request):
    code = request.data.get('code')
    telegram_id = request.data.get('telegram_id')
    username = request.data.get('username')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    if code:
        verified_telegram_id = verify_auth_code(code)
        if not verified_telegram_id:
            return Response({'error': 'Неверный или истёкший код'}, status=status.HTTP_400_BAD_REQUEST)
        telegram_id = verified_telegram_id
    if not telegram_id:
        return Response({'error': 'Не указан telegram_id или code'}, status=status.HTTP_400_BAD_REQUEST)
    user = get_or_create_telegram_user(telegram_id=telegram_id, username=username, first_name=first_name, last_name=last_name)
    try:
        profile = user.profile
    except AttributeError:
        from decimal import Decimal
        profile = Profile.objects.create(user=user, rating=Decimal('0.00'))
    login(request, user)
    return Response({'user': UserSerializer(user).data, 'profile': ProfileSerializer(profile, context={'request': request}).data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_telegram(request):
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Не указан код'}, status=status.HTTP_400_BAD_REQUEST)
    verified_telegram_id = verify_auth_code(code)
    if not verified_telegram_id:
        return Response({'error': 'Неверный или истёкший код'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        existing_user = User.objects.get(telegram_id=verified_telegram_id)
        if existing_user.id != request.user.id:
            return Response({'error': 'Этот Telegram аккаунт уже привязан к другому пользователю'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        pass
    request.user.telegram_id = verified_telegram_id
    request.user.telegram_verified = True
    request.user.save()
    return Response({'message': 'Telegram успешно привязан', 'user': UserSerializer(request.user).data})

@api_view(['GET'])
@permission_classes([AllowAny])
def telegram_bot_info(request):
    try:
        import asyncio
        import threading
        from telegram import Bot
        token = settings.TELEGRAM_BOT_TOKEN
        if not token:
            return Response({'error': 'Telegram бот не настроен'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        bot_info_result = [None]
        exception_result = [None]

        async def get_bot_info():
            try:
                bot = Bot(token=token)
                return await bot.get_me()
            except Exception as e:
                exception_result[0] = e
                return None

        def run_in_thread():
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)
            try:
                bot_info_result[0] = new_loop.run_until_complete(get_bot_info())
            finally:
                new_loop.close()
        thread = threading.Thread(target=run_in_thread)
        thread.start()
        thread.join(timeout=5)
        if exception_result[0]:
            raise exception_result[0]
        if not bot_info_result[0]:
            raise Exception('Не удалось получить информацию о боте')
        bot_info = bot_info_result[0]
        return Response({'username': bot_info.username, 'bot_link': f'https://t.me/{bot_info.username}', 'register_link': f'https://t.me/{bot_info.username}?start=register'})
    except Exception as e:
        logger.error(f'Ошибка получения информации о боте: {e}')
        bot_username = 'sportact1v_bot'
        return Response({'username': bot_username, 'bot_link': f'https://t.me/{bot_username}', 'register_link': f'https://t.me/{bot_username}?start=register'})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Необходимо указать username и password'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            login(request, user)
            try:
                profile = user.profile
            except AttributeError:
                from decimal import Decimal
                profile = Profile.objects.create(user=user, rating=Decimal('0.00'))
            return Response({'user': UserSerializer(user).data, 'profile': ProfileSerializer(profile, context={'request': request}).data})
        else:
            return Response({'error': 'Неверный пароль'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Вы вышли из системы'})

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    if not username or not password:
        return Response({'error': 'Необходимо указать username и password'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Пользователь с таким username уже существует'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)
    try:
        profile = user.profile
    except AttributeError:
        from decimal import Decimal
        profile = Profile.objects.create(user=user, rating=Decimal('0.00'))
    login(request, user)
    return Response({'user': UserSerializer(user).data, 'profile': ProfileSerializer(profile).data}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def profile_detail(request, user_id=None):
    if user_id:
        try:
            target_user = User.objects.get(pk=user_id)
            try:
                profile = target_user.profile
            except AttributeError:
                from decimal import Decimal
                profile = Profile.objects.create(user=target_user, rating=Decimal('0.00'))
            return Response({'authenticated': request.user.is_authenticated, 'user': UserSerializer(target_user).data, 'profile': ProfileSerializer(profile, context={'request': request}).data})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_authenticated:
        return Response({'authenticated': False, 'user': None, 'profile': {'id': None, 'user': None, 'photo': None, 'city': '', 'rating': 0.0, 'bio': '', 'available_schedule': {}, 'created_at': None, 'updated_at': None}})
    try:
        profile = request.user.profile
    except AttributeError:
        from decimal import Decimal
        profile = Profile.objects.create(user=request.user, rating=Decimal('0.00'))
    if profile.rating is None:
        from decimal import Decimal
        profile.rating = Decimal('0.00')
        profile.save()
    return Response({'authenticated': True, 'user': UserSerializer(request.user).data, 'profile': ProfileSerializer(profile, context={'request': request}).data})

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_edit(request):
    try:
        profile = request.user.profile
    except AttributeError:
        from decimal import Decimal
        profile = Profile.objects.create(user=request.user, rating=Decimal('0.00'))
    import json
    data = {}
    for key, value in request.data.items():
        if key == 'available_schedule':
            if isinstance(value, list) and len(value) > 0:
                value = value[0]
            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    data[key] = parsed if isinstance(parsed, dict) else {}
                except (json.JSONDecodeError, ValueError, TypeError):
                    data[key] = {}
            elif value is None or value == '':
                data[key] = {}
            elif isinstance(value, dict):
                data[key] = value
            else:
                data[key] = {}
        elif isinstance(value, list) and len(value) > 0:
            data[key] = value[0]
        else:
            data[key] = value
    files = {}
    if 'photo' in request.FILES:
        files['photo'] = request.FILES['photo']
    delete_photo = False
    if 'delete_photo' in data:
        delete_photo_value = data.pop('delete_photo')
        if isinstance(delete_photo_value, list) and len(delete_photo_value) > 0:
            delete_photo_value = delete_photo_value[0]
        delete_photo = str(delete_photo_value).lower() in ('true', '1', 'yes')
    serializer_data = {**data, **files}
    serializer = ProfileSerializer(profile, data=serializer_data, partial=True, context={'request': request})
    if serializer.is_valid():
        instance = serializer.save()
        if delete_photo and (not files.get('photo')):
            if instance.photo:
                instance.photo.delete(save=False)
            instance.photo = None
            instance.save()
        return Response(ProfileSerializer(instance, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interests_list(request):
    interests = Interest.objects.filter(user=request.user)
    return Response(InterestSerializer(interests, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interest_add(request):
    activity_id = request.data.get('activity_id')
    level = request.data.get('level', 'beginner')
    if not activity_id:
        return Response({'error': 'Необходимо указать activity_id'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        activity = Activity.objects.get(id=activity_id)
        interest, created = Interest.objects.get_or_create(user=request.user, activity=activity, defaults={'level': level})
        return Response(InterestSerializer(interest).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Activity.DoesNotExist:
        return Response({'error': 'Активность не найдена'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def interest_delete(request, pk):
    try:
        interest = Interest.objects.get(pk=pk, user=request.user)
        interest.delete()
        return Response({'message': 'Интерес удалён'}, status=status.HTTP_204_NO_CONTENT)
    except Interest.DoesNotExist:
        return Response({'error': 'Интерес не найден'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def reviews_list(request, user_id):
    from apps.activities.models import Review
    from apps.activities.serializers import ReviewSerializer
    reviews = Review.objects.filter(reviewed_user_id=user_id)
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)