FROM python:3.11-slim

WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code, templates, and static files
COPY app.py .
COPY templates templates/
COPY static static/

# Expose the port Gunicorn will run on
EXPOSE 8000

# Command to run the application using Gunicorn (production WSGI server)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]