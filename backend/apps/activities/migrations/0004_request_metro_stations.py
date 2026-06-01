from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('activities', '0003_increase_coordinates_precision')]
    operations = [migrations.AddField(model_name='request', name='metro_stations', field=models.JSONField(blank=True, default=list, verbose_name='Станции метро'))]
