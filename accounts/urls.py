from django.urls import path
from . import views

urlpatterns = [
    path('',              views.landing_view,        name='landing'),
    path('login/',        views.login_view,           name='login'),
    path('signup/',       views.signup_view,          name='signup'),
    path('logout/',       views.logout_view,          name='logout'),
    path('dashboard/',    views.dashboard_view,       name='dashboard'),
    path('save-design/',  views.save_design_view,     name='save_design'),
    path('calculate-cost/', views.calculate_cost_view, name='calculate_cost'),
    path('export-pdf/<int:design_id>/', views.export_pdf_view, name='export_pdf'),
]
