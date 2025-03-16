#!/bin/bash

# Script to deploy NVK Analyzer to Azure
set -e

echo "Starting deployment to Azure..."

# Login to Azure (uncomment if not already logged in)
# az login

# Variables
RESOURCE_GROUP="nvk-resource-group"
LOCATION="eastus"
ACR_NAME="nvkregistrycontainer"
APP_NAME="nvk-analyzer"
VNET_NAME="nvk-vnet"
SUBNET_NAME="nvk-subnet"

# Create resource group if it doesn't exist
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
echo "Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Log in to ACR
echo "Logging in to Azure Container Registry..."
az acr login --name $ACR_NAME

# Build and push Docker images
echo "Building and pushing Docker images..."

# Build and push client image
docker build -t $ACR_NAME.azurecr.io/nvk-client:latest -f docker/client.Dockerfile .
docker push $ACR_NAME.azurecr.io/nvk-client:latest

# Build and push server image
docker build -t $ACR_NAME.azurecr.io/nvk-server:latest -f docker/server.Dockerfile .
docker push $ACR_NAME.azurecr.io/nvk-server:latest

# Build and push RAG service image
docker build -t $ACR_NAME.azurecr.io/nvk-rag:latest -f rag-service/Dockerfile rag-service
docker push $ACR_NAME.azurecr.io/nvk-rag:latest

# Create virtual network and subnet for the services
echo "Creating virtual network and subnet..."
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name $VNET_NAME \
  --address-prefix 10.0.0.0/16 \
  --subnet-name $SUBNET_NAME \
  --subnet-prefix 10.0.1.0/24

# Deploy RAG service to Azure Container Instance
echo "Deploying RAG service..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name "nvk-rag-service" \
  --image $ACR_NAME.azurecr.io/nvk-rag:latest \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label "nvk-rag-service" \
  --ports 5000 \
  --cpu 1 \
  --memory 2 \
  --vnet $VNET_NAME \
  --subnet $SUBNET_NAME

# Get the FQDN of the RAG service
RAG_FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name "nvk-rag-service" \
  --query "ipAddress.fqdn" \
  -o tsv)

# Deploy server to Azure Container Instance
echo "Deploying server..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name "nvk-server" \
  --image $ACR_NAME.azurecr.io/nvk-server:latest \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label "nvk-server" \
  --ports 3000 \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    GEMINI_API_KEY=$GEMINI_API_KEY \
    RAG_SERVICE_URL=http://$RAG_FQDN:5000 \
  --vnet $VNET_NAME \
  --subnet $SUBNET_NAME

# Get the FQDN of the server
SERVER_FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name "nvk-server" \
  --query "ipAddress.fqdn" \
  -o tsv)

# Deploy client to Azure Container Instance
echo "Deploying client..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name "nvk-client" \
  --image $ACR_NAME.azurecr.io/nvk-client:latest \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label "nvk-client" \
  --ports 3000 \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    REACT_APP_API_URL=http://$SERVER_FQDN:3000 \
  --vnet $VNET_NAME \
  --subnet $SUBNET_NAME

# Get the FQDN of the client
CLIENT_FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name "nvk-client" \
  --query "ipAddress.fqdn" \
  -o tsv)

echo "Deployment completed successfully!"
echo "Client URL: http://$CLIENT_FQDN:3000"
echo "Server URL: http://$SERVER_FQDN:3000"
echo "RAG Service URL: http://$RAG_FQDN:5000"