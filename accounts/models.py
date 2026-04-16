from django.db import models
from django.conf import settings

class Design(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    typology = models.CharField(max_length=50)
    width = models.FloatField()
    height = models.FloatField()
    quantity = models.IntegerField()
    material = models.CharField(max_length=50)
    total_cost = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.typology} ({self.width}x{self.height}) by {self.user}"
