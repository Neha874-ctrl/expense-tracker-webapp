FROM python:3.11-slim

WORKDIR /app

# Copy the requirements file and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ /app/

# Expose the port Gunicorn will run on
EXPOSE 5000

# Command to run the application using Gunicorn (production WSGI server)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]