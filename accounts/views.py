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
