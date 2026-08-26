# CI/CD — oneCMS

## Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** (`ci.yml`) | Every PR + push to `main` | Typecheck → Lint → Test → Build |
| **Deploy** (`deploy.yml`) | Push to `main` + manual dispatch | API → ECR + Elastic Beanstalk · CMS → S3 |

## AWS Architecture (Free Tier)

```
┌─────────────┐     ┌──────────────────────┐
│  GitHub      │────▶│  Amazon ECR           │
│  Actions     │     │  (Docker registry)    │
│              │     └──────────┬───────────┘
│              │                │
│              │     ┌──────────▼───────────┐
│              │────▶│  Elastic Beanstalk    │
│              │     │  (t3.micro, Docker)   │
│              │     │  ─ Express API ───────│──── MongoDB Atlas
│              │     │    port 3001          │──── Redis (ElastiCache / Docker)
│              │     └──────────────────────┘
│              │
│              │     ┌──────────▼───────────┐
│              │────▶│  S3 Bucket            │
│              │     │  (CMS static files)   │
└─────────────┘     └──────────────────────┘
```

## Free Tier Coverage

| Service | Free Tier | Usage |
|---------|-----------|-------|
| **EC2** (via EB) | 750 hrs/month t3.micro for 12 months | API server |
| **ECR** | 500 MB private storage | Docker images |
| **S3** | 5 GB storage, 20K GET, 2K PUT/month | CMS static files |
| **Elastic Beanstalk** | Free (pay for underlying EC2) | Orchestration |

## Required GitHub Secrets

Configure these in: **GitHub → Settings → Secrets and variables → Actions**

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJal...` |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID | `123456789012` |
| `EB_APPLICATION_NAME` | Elastic Beanstalk app name | `onecms-api` |
| `EB_ENVIRONMENT_NAME` | Elastic Beanstalk env name | `onecms-api-prod` |
| `S3_CMS_BUCKET` | S3 bucket for CMS build | `onecms-cms-prod` |

## AWS Setup Steps

### 1. Create an IAM User

```bash
# Create a deployment user with programmatic access
aws iam create-user --user-name onecms-deployer

# Attach required policies
aws iam attach-user-policy --user-name onecms-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-user-policy --user-name onecms-deployer \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### 2. Create ECR Repository

```bash
aws ecr create-repository --repository-name onecms-api --region ap-south-1
```

### 3. Create Elastic Beanstalk Application

```bash
# Create application
aws elasticbeanstalk create-application --application-name onecms-api

# Create single-instance environment (no load balancer = free tier)
aws elasticbeanstalk create-environment \
  --application-name onecms-api \
  --environment-name onecms-api-prod \
  --solution-stack-name "64bit Amazon Linux 2023 v4.13.7 running Docker" \
  --option-settings \
    Namespace=aws:autoscaling:launchconfiguration,OptionName=InstanceType,Value=t3.micro \
    Namespace=aws:elasticbeanstalk:environment,OptionName=EnvironmentType,Value=SingleInstance

# Set environment variables (your real secrets)
aws elasticbeanstalk update-environment \
  --environment-name onecms-api-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_ENV,Value=production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=PORT,Value=3001 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=MONGO_URI,Value=<your-mongo-uri> \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=REDIS_HOST,Value=<your-redis-host> \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET,Value=<your-jwt-secret>
```

### 4. Create S3 Bucket (Public)

```bash
# Create S3 bucket for CMS static files
aws s3 mb s3://onecms-cms-prod --region ap-south-1

# Enable static website hosting
aws s3 website s3://onecms-cms-prod \
  --index-document index.html \
  --error-document index.html

# Remove "Block Public Access" restriction
aws s3api put-public-access-block --bucket onecms-cms-prod \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Attach public read policy
aws s3api put-bucket-policy --bucket onecms-cms-prod --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::onecms-cms-prod/*\"}]}"
```

### 5. Elastic Beanstalk Environment Variables

Set these in the EB console or via CLI for the API to work in production:

```
NODE_ENV=production
PORT=3001
MONGO_URI=<your-mongodb-atlas-uri>
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
JWT_SECRET=<generate-via-openssl-rand-base64-32>
JWT_PRIVATE_KEY=<your-private-key>
JWT_PUBLIC_KEY=<your-public-key>
REFRESH_SECRET=<generate-via-openssl-rand-base64-32>
AWS_S3_BUCKET_NAME=onecms-media-bucket
AWS_REGION=ap-south-1
```
