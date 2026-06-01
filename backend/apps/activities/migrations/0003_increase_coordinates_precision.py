from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('activities', '0002_alter_participation_status')]
    operations = [migrations.AlterField(model_name='request', name='latitude', field=models.DecimalField(decimal_places=6, max_digits=10, verbose_name='Широта')), migrations.AlterField(model_name='request', name='longitude', field=models.DecimalField(decimal_places=6, max_digits=10, verbose_name='Долгота'))]
