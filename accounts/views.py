from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages

def landing_view(request):
    return render(request, 'index.html')

def login_view(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        user = authenticate(request, username=u, password=p)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')

def signup_view(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        e = request.POST.get('email')
        n = request.POST.get('name')
        
        if User.objects.filter(username=u).exists():
            messages.error(request, 'Username already exists.')
        else:
            user = User.objects.create_user(username=u, email=e, password=p)
            user.first_name = n
            user.save()
            login(request, user)
            return redirect('dashboard')
    
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('landing')

@login_required
def dashboard_view(request):
    return render(request, 'dashboard.html')

@login_required
def save_design_view(request):
    if request.method == 'POST':
        design_type = request.POST.get('type')
        typology = request.POST.get('typology')
        width = request.POST.get('width', 0)
        height = request.POST.get('height', 0)
        quantity = request.POST.get('quantity', 1)
        material = request.POST.get('material')
        
        try:
            width = float(width)
            height = float(height)
            quantity = int(quantity)
        except ValueError:
            width = 0.0
            height = 0.0
            quantity = 1
            
        area = width * height
        rates = {
            'aluminium': 500,
            'steel': 700,
            'wood': 600
        }
        
        rate = rates.get(material.lower(), 500)
        
        base_cost = area * rate * quantity
        production_cost = base_cost * 0.10
        labor_cost = base_cost * 0.10
        total_cost = base_cost + production_cost + labor_cost
        
        from .models import Design
        Design.objects.create(
            user=request.user,
            type=design_type,
            typology=typology,
            width=width,
            height=height,
            quantity=quantity,
            material=material,
            total_cost=total_cost
        )
        
        messages.success(request, 'Design saved successfully.')
        return redirect('dashboard')
    
    return redirect('dashboard')

