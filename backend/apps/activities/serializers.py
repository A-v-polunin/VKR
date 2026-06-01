from rest_framework import serializers
from .models import Category, Activity, Request, Participation, Favorite, Review
from apps.accounts.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']

class ActivitySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Activity
        fields = ['id', 'name', 'slug', 'category', 'category_id', 'description', 'icon', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class RequestSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    activity = ActivitySerializer(read_only=True)
    activity_id = serializers.IntegerField(write_only=True)
    date = serializers.DateField(input_formats=['%Y-%m-%d', '%Y/%m/%d'])
    time = serializers.TimeField(input_formats=['%H:%M:%S', '%H:%M', '%H:%M:%S.%f'])
    date_end = serializers.DateField(required=False, allow_null=True, input_formats=['%Y-%m-%d', '%Y/%m/%d'])
    time_end = serializers.TimeField(required=False, allow_null=True, input_formats=['%H:%M:%S', '%H:%M', '%H:%M:%S.%f'])
    latitude = serializers.DecimalField(max_digits=10, decimal_places=6, coerce_to_string=False, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=6, coerce_to_string=False, required=False)
    participations_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    is_participating = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = ['id', 'creator', 'request_type', 'activity', 'activity_id', 'format', 'date', 'time', 'date_end', 'time_end', 'location_name', 'latitude', 'longitude', 'address', 'metro_stations', 'level', 'max_participants', 'current_participants', 'participations_count', 'title', 'description', 'requirements', 'photos', 'visibility', 'status', 'is_favorite', 'is_participating', 'created_at', 'updated_at']
        read_only_fields = ['id', 'creator', 'current_participants', 'created_at', 'updated_at']

    def get_participations_count(self, obj):
        return obj.participations.filter(status__in=['pending', 'approved']).count()

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            from .models import Favorite
            return Favorite.objects.filter(user=request.user, request=obj).exists()
        return False

    def get_is_participating(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.participations.filter(user=request.user, status='approved').exists()
        return False

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
        elif hasattr(data, 'copy'):
            data = data.copy()
        elif hasattr(data, 'dict'):
            data = data.dict()
        else:
            data = dict(data) if data else {}
        for field in ['date_end', 'time_end']:
            if field in data:
                value = data[field]
                if value == '' or (isinstance(value, str) and value.strip() == ''):
                    data[field] = None
        MOSCOW_LAT = 55.762308
        MOSCOW_LON = 37.616261
        for field, default_value in [('latitude', MOSCOW_LAT), ('longitude', MOSCOW_LON)]:
            if field not in data or data[field] == '' or data[field] is None:
                data[field] = default_value
            elif isinstance(data[field], str) and data[field].strip():
                try:
                    data[field] = float(data[field].strip())
                except (ValueError, TypeError):
                    data[field] = default_value
        return super().to_internal_value(data)

    def validate_latitude(self, value):
        if value is None:
            from decimal import Decimal
            return Decimal('55.762308')
        try:
            from decimal import Decimal
            if isinstance(value, str):
                value = Decimal(value)
            lat_float = float(value)
            if not -90 <= lat_float <= 90:
                raise serializers.ValidationError('Широта должна быть между -90 и 90')
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError(f'Широта должна быть числом: {str(e)}')
        return value

    def validate_longitude(self, value):
        if value is None:
            from decimal import Decimal
            return Decimal('37.616261')
        try:
            from decimal import Decimal
            if isinstance(value, str):
                value = Decimal(value)
            lon_float = float(value)
            if not -180 <= lon_float <= 180:
                raise serializers.ValidationError('Долгота должна быть между -180 и 180')
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError(f'Долгота должна быть числом: {str(e)}')
        return value

    def validate(self, attrs):
        if 'date_end' in attrs and attrs['date_end'] == '':
            attrs['date_end'] = None
        if 'time_end' in attrs and attrs['time_end'] == '':
            attrs['time_end'] = None
        return attrs

class ParticipationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_profile = serializers.SerializerMethodField()
    request = RequestSerializer(read_only=True)
    request_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Participation
        fields = ['id', 'request', 'request_id', 'user', 'user_profile', 'status', 'message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_user_profile(self, obj):
        try:
            from apps.accounts.serializers import ProfileSerializer
            return ProfileSerializer(obj.user.profile).data
        except AttributeError:
            return None

class FavoriteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    request = RequestSerializer(read_only=True)
    request_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'request', 'request_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewed_user = UserSerializer(read_only=True)
    request = RequestSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'request', 'reviewer', 'reviewed_user', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'reviewer', 'created_at']