from django.urls import path
from . import views
app_name = 'notifications'
urlpatterns = [path('', views.notification_list, name='notification_list'), path('<int:pk>/read/', views.notification_read, name='notification_read'), path('read-all/', views.notification_read_all, name='notification_read_all'), path('unread-count/', views.unread_count, name='unread_count')]