# Use Python as the base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt .

RUN apt-get update && apt-get install -y \
    build-essential \
    patch \
    make \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN pip install -r requirements.txt

# Copy the rest of the RAG service code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the app
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "5000"]