from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [path('admin/', admin.site.urls), path('api/auth/', include(('apps.accounts.urls', 'accounts'), namespace='auth')), path('api/profile/', include(('apps.accounts.urls', 'accounts'), namespace='profile')), path('api/requests/', include('apps.activities.urls')), path('api/chat/', include('apps.chat.urls')), path('api/notifications/', include('apps.notifications.urls')), path('api/moderation/', include('apps.moderation.urls'))]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)