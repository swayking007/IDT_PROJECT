from django.contrib import admin
from .models import Design

@admin.register(Design)
class DesignAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'typology', 'width', 'height', 'material', 'total_cost', 'created_at')
