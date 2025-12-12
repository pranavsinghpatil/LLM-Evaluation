@echo off
echo Running Unit Tests...
set PYTHONPATH=src
python -m pytest tests/test_api.py -v
pause
