from django.urls import path
from . import views

urlpatterns = [
    path('chat/completions', views.chat_completions, name='chat_completions'),
    path('youtube/analyze', views.youtube_analyze, name='youtube_analyze'),
    path('quiz/generate', views.quiz_generate, name='quiz_generate'),
    path('pdf/extract', views.pdf_extract, name='pdf_extract'),
]
