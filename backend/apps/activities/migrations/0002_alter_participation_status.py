from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('activities', '0001_initial')]
    operations = [migrations.AlterField(model_name='participation', name='status', field=models.CharField(choices=[('pending', 'Ожидает подтверждения'), ('approved', 'Подтверждён'), ('rejected', 'Отклонён'), ('cancelled', 'Отменён'), ('excluded', 'Исключён')], default='pending', max_length=20, verbose_name='Статус'))]
