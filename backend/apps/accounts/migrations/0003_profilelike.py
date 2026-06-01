from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [('accounts', '0002_initial')]
    operations = [migrations.CreateModel(name='ProfileLike', fields=[('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')), ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создан')), ('liker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='given_likes', to=settings.AUTH_USER_MODEL, verbose_name='Кто лайкнул')), ('profile_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_likes', to=settings.AUTH_USER_MODEL, verbose_name='Чей профиль'))], options={'verbose_name': 'Лайк профиля', 'verbose_name_plural': 'Лайки профилей', 'indexes': [models.Index(fields=['profile_user', '-created_at'], name='accounts_pr_profile_da7e8e_idx')], 'unique_together': {('liker', 'profile_user')}})]
