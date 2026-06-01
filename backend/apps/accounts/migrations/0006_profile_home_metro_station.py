from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('accounts', '0005_alter_profile_rating')]
    operations = [migrations.AddField(model_name='profile', name='home_metro_station_id', field=models.CharField(blank=True, help_text='Идентификатор станции из справочника; для фильтра «Рядом» на поиске', max_length=120, verbose_name='Станция метро (дом)'))]
