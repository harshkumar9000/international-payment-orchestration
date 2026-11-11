"""
Vercel Python Function Entrypoint
Exposes the existing FastAPI application instance as 'app' for Vercel.
"""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from main import app

